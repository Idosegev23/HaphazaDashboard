-- Fix is_admin() function to check raw_user_meta_data instead of memberships
-- This function is used in 35+ RLS policies across the system
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' IN ('admin', 'finance', 'support', 'content_ops'))
  );
END;
$$;
