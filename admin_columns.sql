-- Add admin columns to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE;

-- Create admin_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create city_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS city_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name TEXT NOT NULL,
  country TEXT NOT NULL,
  trip_count INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_name TEXT NOT NULL,
  category TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  avg_cost NUMERIC DEFAULT 0,
  top_city TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_stats ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view admin logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can insert admin logs" ON admin_logs;
DROP POLICY IF EXISTS "Anyone can view city stats" ON city_stats;
DROP POLICY IF EXISTS "Admins can update city stats" ON city_stats;
DROP POLICY IF EXISTS "Anyone can view activity stats" ON activity_stats;
DROP POLICY IF EXISTS "Admins can update activity stats" ON activity_stats;

-- Create policies for new tables
CREATE POLICY "Admins can view admin logs" ON admin_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert admin logs" ON admin_logs
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Anyone can view city stats" ON city_stats
  FOR SELECT USING (true);

CREATE POLICY "Admins can update city stats" ON city_stats
  FOR UPDATE USING (is_admin());

CREATE POLICY "Anyone can view activity stats" ON activity_stats
  FOR SELECT USING (true);

CREATE POLICY "Admins can update activity stats" ON activity_stats
  FOR UPDATE USING (is_admin());