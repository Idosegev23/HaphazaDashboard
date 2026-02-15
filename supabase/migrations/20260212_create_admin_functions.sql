-- Create RPC functions for admin operations
-- These can be called from the application

-- Function to set a user as admin
CREATE OR REPLACE FUNCTION set_user_admin(user_email TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Update user metadata
  UPDATE auth.users 
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
  )
  WHERE email = user_email;

  -- Return the updated user info
  SELECT jsonb_build_object(
    'id', id,
    'email', email,
    'role', raw_user_meta_data->>'role',
    'success', true
  )
  INTO result
  FROM auth.users
  WHERE email = user_email;

  RETURN COALESCE(result, jsonb_build_object('success', false, 'message', 'User not found'));
END;
$$;

-- Function to set multiple users as admins
CREATE OR REPLACE FUNCTION set_multiple_admins(user_emails TEXT[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  updated_count integer;
BEGIN
  -- Update all users
  WITH updated AS (
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}',
      '"admin"'
    )
    WHERE email = ANY(user_emails)
    RETURNING id, email, raw_user_meta_data->>'role' as role
  )
  SELECT 
    jsonb_build_object(
      'success', true,
      'count', COUNT(*),
      'users', jsonb_agg(jsonb_build_object(
        'id', id,
        'email', email,
        'role', role
      ))
    )
  INTO result
  FROM updated;

  RETURN COALESCE(result, jsonb_build_object('success', false, 'count', 0));
END;
$$;

-- Grant execute permissions to authenticated users
-- (In production, you might want to restrict this further)
GRANT EXECUTE ON FUNCTION set_user_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_multiple_admins(TEXT[]) TO authenticated;

-- Now set the admin users
SELECT set_multiple_admins(ARRAY['cto@ldrsgroup.com', 'yoav@ldrsgroup.com']);
