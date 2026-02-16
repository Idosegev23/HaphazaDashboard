-- Fix is_brand_member() to use SECURITY DEFINER for better performance
-- Also check both brand_users and memberships tables
CREATE OR REPLACE FUNCTION is_brand_member(brand_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM brand_users
    WHERE user_id = auth.uid()
    AND brand_id = brand_uuid
    AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
    AND entity_id = brand_uuid
    AND entity_type = 'brand'
    AND is_active = true
  );
END;
$$;
