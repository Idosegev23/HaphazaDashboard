-- Fix RLS policies for campaigns table to allow campaign creation

-- Drop existing restrictive RLS policies on campaigns
DROP POLICY IF EXISTS "Brands can insert their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Brands can update their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Brands can delete their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can view campaigns" ON campaigns;

-- Create new permissive RLS policies
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
