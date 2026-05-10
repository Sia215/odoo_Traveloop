-- Run in Supabase SQL Editor
-- https://supabase.com/dashboard/project/ihrygixmwapccqtzdhos/sql/new

-- Trip stops
CREATE TABLE IF NOT EXISTS trip_stops (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id      UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  city_name    TEXT NOT NULL,
  country      TEXT,
  start_date   DATE,
  end_date     DATE,
  day_number   INT DEFAULT 1,
  stay_budget  NUMERIC(10,2) DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE trip_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own trip stops" ON trip_stops FOR ALL
  USING (auth.uid() = (SELECT user_id FROM trips WHERE id = trip_stops.trip_id));

-- Trip activities (renamed from activities to avoid conflict)
CREATE TABLE IF NOT EXISTS trip_activities (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id            UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  stop_id            UUID REFERENCES trip_stops(id) ON DELETE SET NULL,
  name               TEXT NOT NULL,
  description        TEXT,
  category           TEXT DEFAULT 'Other',
  activity_time      TIME,
  duration_minutes   INT,
  cost               NUMERIC(10,2) DEFAULT 0,
  currency           TEXT DEFAULT 'INR',
  is_paid            BOOLEAN DEFAULT FALSE,
  location_name      TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE trip_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own trip activities" ON trip_activities FOR ALL
  USING (auth.uid() = (SELECT user_id FROM trips WHERE id = trip_activities.trip_id));

-- Trip budget
CREATE TABLE IF NOT EXISTS trip_budget (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id       UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_budget  NUMERIC(10,2) NOT NULL,
  currency      TEXT DEFAULT 'INR',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE trip_budget ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own trip budget" ON trip_budget FOR ALL
  USING (auth.uid() = (SELECT user_id FROM trips WHERE id = trip_budget.trip_id));
