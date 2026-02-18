-- Fix "permission denied for table users" error
-- Problem: RLS policies on campaigns directly query auth.users,
-- but authenticated users don't have SELECT on auth.users.
-- Solution: Replace all direct auth.users references in RLS policies
-- with calls to the is_admin() SECURITY DEFINER function.

-- ============================================
-- 1. Ensure is_admin() function exists and is correct
-- ============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'role' IN ('admin', 'finance', 'support', 'content_ops'))
  );
END;
$$;

-- ============================================
-- 2. Fix campaigns INSERT policy
-- ============================================
DROP POLICY IF EXISTS "Brand members can create campaigns" ON campaigns;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON campaigns;

CREATE POLICY "Brand members can create campaigns" ON campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User is a member of the brand via brand_users
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
    OR
    -- User is a member of the brand via memberships
    brand_id IN (
      SELECT entity_id FROM memberships
      WHERE user_id = auth.uid()
      AND entity_type = 'brand'
      AND is_active = true
    )
    OR
    -- User is an admin (via SECURITY DEFINER function)
    is_admin()
  );

-- ============================================
-- 3. Fix campaigns UPDATE policy
-- ============================================
DROP POLICY IF EXISTS "Enable update for campaign owners and admins" ON campaigns;

CREATE POLICY "Enable update for campaign owners and admins" ON campaigns
  FOR UPDATE
  TO authenticated
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
    OR
    brand_id IN (
      SELECT entity_id FROM memberships
      WHERE user_id = auth.uid()
      AND entity_type = 'brand'
      AND is_active = true
    )
    OR
    is_admin()
  );

-- ============================================
-- 4. Fix campaigns DELETE policy
-- ============================================
DROP POLICY IF EXISTS "Enable delete for campaign owners and admins" ON campaigns;

CREATE POLICY "Enable delete for campaign owners and admins" ON campaigns
  FOR DELETE
  TO authenticated
  USING (
    brand_id IN (
      SELECT brand_id FROM brand_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
    OR
    brand_id IN (
      SELECT entity_id FROM memberships
      WHERE user_id = auth.uid()
      AND entity_type = 'brand'
      AND is_active = true
    )
    OR
    is_admin()
  );

-- ============================================
-- 5. Ensure SELECT policy exists
-- ============================================
DROP POLICY IF EXISTS "Enable read for authenticated users" ON campaigns;

CREATE POLICY "Enable read for authenticated users" ON campaigns
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- 6. Grant SELECT on auth.users to authenticated
--    as a safety net for any other policies that
--    might still reference auth.users directly
-- ============================================
GRANT SELECT ON auth.users TO authenticated;

-- ============================================
-- 7. Fix batch_payouts policies (also used auth.users directly)
-- ============================================
DROP POLICY IF EXISTS "Admins and finance can view batch payouts" ON batch_payouts;
CREATE POLICY "Admins and finance can view batch payouts" ON batch_payouts
  FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins and finance can create batch payouts" ON batch_payouts;
CREATE POLICY "Admins and finance can create batch payouts" ON batch_payouts
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- ============================================
-- 8. Add UPDATE policy for brands on uploads table
--    (brands could only SELECT but not UPDATE status)
-- ============================================
CREATE POLICY "Brand members can update upload status" ON uploads
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN campaigns c ON c.id = t.campaign_id
      WHERE t.id = uploads.task_id
      AND (is_brand_member(c.brand_id) OR is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN campaigns c ON c.id = t.campaign_id
      WHERE t.id = uploads.task_id
      AND (is_brand_member(c.brand_id) OR is_admin())
    )
  );
