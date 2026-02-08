-- Fix recursion by making check functions SECURITY DEFINER
-- This bypasses RLS on the tables they query (brand_users, memberships)
-- preventing the infinite loop where RLS calls the function which queries the table which triggers RLS...

-- Fix is_brand_member
CREATE OR REPLACE FUNCTION is_brand_member(brand_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM brand_users
    WHERE user_id = auth.uid()
    AND brand_id = brand_uuid
    AND is_active = true
  );
END;
$$;

-- Fix is_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  );
END;
$$;
