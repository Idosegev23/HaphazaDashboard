-- Run this SQL in Supabase SQL Editor to set admin users and fix RLS

-- 1. Set admin role for specified users
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email IN ('cto@ldrsgroup.com', 'yoav@ldrsgroup.com');

-- 2. Verify the changes
SELECT id, email, raw_user_meta_data->>'role' as role
FROM auth.users 
WHERE email IN ('cto@ldrsgroup.com', 'yoav@ldrsgroup.com');

-- 3. Fix RLS policies for campaigns table
DROP POLICY IF EXISTS "Brands can insert their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Brands can update their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Brands can delete their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can view campaigns" ON campaigns;

-- 4. Create new permissive RLS policies
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

-- Done! The users should now have admin role and campaigns can be created.
