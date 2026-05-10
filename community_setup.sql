-- Run in Supabase SQL Editor
-- https://supabase.com/dashboard/project/ihrygixmwapccqtzdhos/sql/new

CREATE TABLE IF NOT EXISTS community_posts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trip_id       UUID REFERENCES trips(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  tags          TEXT[] DEFAULT '{}',
  is_public     BOOLEAN DEFAULT TRUE,
  like_count    INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  copy_count    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_likes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_comments (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE community_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public posts readable"      ON community_posts FOR SELECT USING (is_public = true);
CREATE POLICY "Auth users insert posts"    ON community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own posts"     ON community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own posts"     ON community_posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Likes readable by all"      ON community_likes FOR SELECT USING (true);
CREATE POLICY "Auth users insert likes"    ON community_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own likes"     ON community_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Comments readable by all"   ON community_comments FOR SELECT USING (true);
CREATE POLICY "Auth users insert comments" ON community_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments"  ON community_comments FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_tags ON community_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_community_likes_post_id ON community_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_user_id ON community_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_created_at ON community_comments(created_at DESC);

-- Function to update like/comment counts
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'community_likes' THEN
      UPDATE community_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'community_comments' THEN
      UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'community_likes' THEN
      UPDATE community_posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'community_comments' THEN
      UPDATE community_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update counts
CREATE TRIGGER update_like_count
  AFTER INSERT OR DELETE ON community_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

CREATE TRIGGER update_comment_count
  AFTER INSERT OR DELETE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();
CREATE POLICY "Users delete own comments"  ON community_comments FOR DELETE USING (auth.uid() = user_id);

-- Seed sample posts (replace user_id with a real user id from your auth.users)
-- INSERT INTO community_posts (user_id, title, content, tags) VALUES
-- ('<your-user-id>', 'Amazing Paris Trip!', 'Visited the Eiffel Tower...', ARRAY['Adventure','Budget']);
