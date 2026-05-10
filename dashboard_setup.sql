-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ihrygixmwapccqtzdhos/sql/new

CREATE TABLE IF NOT EXISTS cities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  cost_index INTEGER DEFAULT 0,
  popularity INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('ongoing','upcoming','completed')),
  cover_photo TEXT,
  destination_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own trips" ON trips FOR ALL USING (auth.uid() = user_id);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cities are public" ON cities FOR SELECT USING (true);

-- Seed data
INSERT INTO cities (name, country, cost_index, popularity) VALUES
('Paris', 'France', 85, 98),
('Tokyo', 'Japan', 75, 95),
('Bali', 'Indonesia', 40, 90),
('New York', 'USA', 90, 88),
('Dubai', 'UAE', 80, 85);
