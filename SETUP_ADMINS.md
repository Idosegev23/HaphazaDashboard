# 🔧 Setup Admin Users - AURA

## Quick Setup (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar

### Step 2: Run This SQL Script

Copy and paste the following into the SQL Editor and click **"RUN"**:

```sql
-- ============================================
-- 🎯 Set Admin Users & Fix Campaigns RLS
-- ============================================

-- 1️⃣ Set admin role for specified users
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email IN ('cto@ldrsgroup.com', 'yoav@ldrsgroup.com');

-- 2️⃣ Verify admin users (should return 2 rows)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users 
WHERE email IN ('cto@ldrsgroup.com', 'yoav@ldrsgroup.com');

-- 3️⃣ Fix RLS policies for campaigns table
DROP POLICY IF EXISTS "Brands can insert their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Brands can update their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Brands can delete their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can view campaigns" ON campaigns;

-- 4️⃣ Create new permissive RLS policies
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

-- ✅ Done! You should see success messages for all statements.
```

### Step 3: Verify

After running the script, you should see:
- ✅ 2 users updated with admin role
- ✅ 4 RLS policies dropped
- ✅ 4 new RLS policies created

### Step 4: Test

1. Log in with `cto@ldrsgroup.com` or `yoav@ldrsgroup.com`
2. Navigate to `/admin/dashboard`
3. You should now have full admin access!

## What This Does

### Admin Users
- Sets `cto@ldrsgroup.com` as admin
- Sets `yoav@ldrsgroup.com` as admin

### RLS Fixes
- Allows all authenticated users to create campaigns
- Allows all authenticated users to read campaigns
- Allows campaign owners and admins to update campaigns
- Allows campaign owners and admins to delete campaigns

This fixes the "new row violates row-level security policy" error.

## Troubleshooting

### If users don't exist yet:
The users need to sign up first through the app before running this script.

### If you still can't create campaigns:
1. Check that RLS is enabled on the campaigns table
2. Check that the policies were created successfully
3. Try logging out and logging back in

### To add more admins later:
```sql
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'new-admin@example.com';
```

## Need Help?
Contact the development team or check the Supabase documentation:
https://supabase.com/docs/guides/auth/row-level-security
