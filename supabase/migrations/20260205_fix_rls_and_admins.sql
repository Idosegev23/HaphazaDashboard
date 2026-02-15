-- Fix RLS policies for campaigns table and set admin users

-- 1. Drop existing restrictive RLS policies on campaigns if they exist
DROP POLICY IF EXISTS "Brands can insert their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Brands can update their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Brands can delete their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can view campaigns" ON campaigns;

-- 2. Create more permissive RLS policies for campaigns
CREATE POLICY "Enable insert for authenticated users" ON campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON campaigns
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update for campaign owners and admins" ON campaigns
  FOR UPDATE
  TO authenticated
  USING (
    brand_id IN (
      SELECT brand_id FROM brands WHERE user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin')
    )
  );

CREATE POLICY "Enable delete for campaign owners and admins" ON campaigns
  FOR DELETE
  TO authenticated
  USING (
    brand_id IN (
      SELECT brand_id FROM brands WHERE user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin')
    )
  );

-- 3. Set admin role for specified users
-- Note: This needs to be run manually in Supabase SQL editor as it modifies auth.users
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{role}',
--   '"admin"'
-- )
-- WHERE email IN ('cto@ldrsgroup.com', 'yoav@ldrsgroup.com');

-- Alternative: Create a function to set admin role
CREATE OR REPLACE FUNCTION set_user_admin_role(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users 
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
  )
  WHERE email = user_email;
END;
$$;

-- Call the function for both admin users
SELECT set_user_admin_role('cto@ldrsgroup.com');
SELECT set_user_admin_role('yoav@ldrsgroup.com');

-- Verify the changes
-- SELECT id, email, raw_user_meta_data->>'role' as role
-- FROM auth.users 
-- WHERE email IN ('cto@ldrsgroup.com', 'yoav@ldrsgroup.com');
