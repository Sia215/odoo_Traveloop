-- Run in Supabase SQL Editor
-- https://supabase.com/dashboard/project/ihrygixmwapccqtzdhos/sql/new

CREATE TABLE IF NOT EXISTS checklist_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id     UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label       TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Other',
  is_packed   BOOLEAN DEFAULT FALSE,
  is_default  BOOLEAN DEFAULT FALSE,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_share_links (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id     UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE checklist_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_share_links ENABLE ROW LEVEL SECURITY;

-- checklist_items policies
CREATE POLICY "Users manage own checklist items"
  ON checklist_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- checklist_share_links policies
CREATE POLICY "Users manage own share links"
  ON checklist_share_links FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read share links"
  ON checklist_share_links FOR SELECT
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checklist_items_trip_id   ON checklist_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_user_id   ON checklist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_share_trip_id   ON checklist_share_links(trip_id);
CREATE INDEX IF NOT EXISTS idx_checklist_share_token     ON checklist_share_links(share_token);

-- Enable Realtime for checklist_items
ALTER PUBLICATION supabase_realtime ADD TABLE checklist_items;
