-- ============================================================
-- STEP 1: Add missing columns to activities
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='activities' AND column_name='rating'
  ) THEN
    ALTER TABLE activities ADD COLUMN rating NUMERIC(2,1) DEFAULT 4.0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='activities' AND column_name='city_name'
  ) THEN
    ALTER TABLE activities ADD COLUMN city_name TEXT;
  END IF;
END $$;

-- ============================================================
-- STEP 2: Seed activities
-- ============================================================

INSERT INTO activities
  (name, category, estimated_cost, duration_hours, description, city_name, rating)
VALUES
  ('Eiffel Tower Visit',    'Sightseeing', 25,  3.0, 'Visit the iconic iron lattice tower in Paris.',               'Paris',    4.8),
  ('Louvre Museum Tour',    'Culture',     20,  4.0, 'Explore one of the world''s largest art museums.',            'Paris',    4.7),
  ('Seine River Cruise',    'Sightseeing', 15,  1.5, 'Relaxing boat ride along the Seine.',                        'Paris',    4.5),
  ('Sushi Making Class',    'Food',        60,  2.5, 'Learn to make authentic sushi from a local chef.',           'Tokyo',    4.9),
  ('Shibuya Crossing Walk', 'Culture',     0,   1.0, 'Experience the world''s busiest pedestrian crossing.',       'Tokyo',    4.6),
  ('Ubud Rice Terrace',     'Nature',      15,  4.0, 'Walk through stunning green terraced rice fields.',          'Bali',     4.8),
  ('Bali Surf Lesson',      'Adventure',   45,  3.0, 'Learn to surf on Bali''s famous waves.',                    'Bali',     4.7),
  ('Times Square Walk',     'Culture',     0,   1.5, 'Explore the heart of Manhattan.',                            'New York', 4.4),
  ('Central Park Bike',     'Nature',      20,  2.0, 'Cycle through the iconic Central Park.',                     'New York', 4.6),
  ('Desert Safari Dubai',   'Adventure',   85,  5.0, 'Thrilling dune bashing and camel rides.',                   'Dubai',    4.9),
  ('Burj Khalifa Visit',    'Sightseeing', 40,  2.0, 'Visit the observation deck of the world''s tallest building.','Dubai',   4.8),
  ('Street Food Tour',      'Food',        30,  3.0, 'Taste local delicacies on a guided street food walk.',       'Bali',     4.7)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 3: Create trip_activities join table
-- ============================================================

CREATE TABLE IF NOT EXISTS trip_activities (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id     UUID        REFERENCES trips(id)          ON DELETE CASCADE,
  activity_id UUID        REFERENCES activities(id)     ON DELETE CASCADE,
  section_id  UUID        REFERENCES trip_sections(id)  ON DELETE SET NULL,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, activity_id)
);

-- ============================================================
-- STEP 4: RLS on trip_activities
-- ============================================================

ALTER TABLE trip_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own trip activities" ON trip_activities;

CREATE POLICY "Users manage own trip activities" ON trip_activities
  FOR ALL USING (
    auth.uid() = (
      SELECT user_id FROM trips WHERE id = trip_activities.trip_id
    )
  );
