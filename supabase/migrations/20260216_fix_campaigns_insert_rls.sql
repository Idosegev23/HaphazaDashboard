-- Fix RLS for campaigns INSERT - allow brand members to create campaigns

-- Drop and recreate INSERT policy to ensure it works
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON campaigns;
DROP POLICY IF EXISTS "Brand members can create campaigns" ON campaigns;

-- Allow authenticated brand members to create campaigns for their brand
CREATE POLICY "Brand members can create campaigns" ON campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User is a member of the brand they're creating campaign for
    brand_id IN (
      SELECT brand_id FROM brand_users 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
    OR
    -- User is a member of the brand via memberships table
    brand_id IN (
      SELECT entity_id FROM memberships
      WHERE user_id = auth.uid()
      AND entity_type = 'brand'
      AND is_active = true
    )
    OR
    -- User is an admin
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' IN ('admin', 'finance', 'content_ops'))
    )
  );
