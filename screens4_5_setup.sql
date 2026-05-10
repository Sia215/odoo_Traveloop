-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ihrygixmwapccqtzdhos/sql/new

CREATE TABLE IF NOT EXISTS trip_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  description TEXT,
  start_date DATE,
  end_date DATE,
  budget NUMERIC(10,2) DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trip_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own trip sections" ON trip_sections
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM trips WHERE id = trip_sections.trip_id)
  );

CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id UUID REFERENCES cities(id),
  name TEXT NOT NULL,
  category TEXT,
  estimated_cost NUMERIC(10,2) DEFAULT 0,
  duration_hours NUMERIC(4,1),
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Activities are public" ON activities FOR SELECT USING (true);

INSERT INTO activities (name, category, estimated_cost, duration_hours) VALUES
('Eiffel Tower Visit',  'Sightseeing', 25,  3.0),
('Sushi Making Class',  'Food',        60,  2.5),
('Ubud Rice Terrace',   'Nature',      15,  4.0),
('Times Square Walk',   'Culture',     0,   1.5),
('Desert Safari Dubai', 'Adventure',   85,  5.0),
('Louvre Museum Tour',  'Culture',     20,  3.0);
