import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const adminEmails = ['cto@ldrsgroup.com', 'yoav@ldrsgroup.com'];

async function setAdminUsers() {
  console.log('🔧 Setting admin users...\n');

  try {
    // Update users to admin role
    const { data: users, error: updateError } = await supabase
      .from('auth.users')
      .update({
        raw_user_meta_data: {
          role: 'admin'
        }
      })
      .in('email', adminEmails)
      .select('id, email, raw_user_meta_data');

    if (updateError) {
      console.error('❌ Error updating users:', updateError);
      
      // Try alternative approach using raw SQL
      console.log('🔄 Trying alternative approach with SQL...\n');
      
      const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
        query: `
          UPDATE auth.users 
          SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{role}',
            '"admin"'
          )
          WHERE email IN ('cto@ldrsgroup.com', 'yoav@ldrsgroup.com')
          RETURNING id, email, raw_user_meta_data->>'role' as role;
        `
      });

      if (sqlError) {
        console.error('❌ SQL approach also failed:', sqlError);
        console.log('\n📋 Please run this SQL manually in Supabase Dashboard:\n');
        console.log(`
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email IN ('cto@ldrsgroup.com', 'yoav@ldrsgroup.com');
        `);
        process.exit(1);
      }

      console.log('✅ SQL approach succeeded!');
      console.log(sqlResult);
    } else {
      console.log('✅ Admin users updated successfully!\n');
      if (users) {
        users.forEach(u => {
          console.log(`   ${u.email} -> ${u.raw_user_meta_data?.role || 'admin'}`);
        });
      }
    }

    // Verify the changes
    console.log('\n🔍 Verifying admin users...\n');
    const { data: verifyData, error: verifyError } = await supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .in('email', adminEmails);

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError);
    } else {
      console.log('✅ Current admin users:');
      verifyData?.forEach(u => {
        console.log(`   📧 ${u.email}`);
        console.log(`   👤 Role: ${u.raw_user_meta_data?.role || 'not set'}`);
        console.log();
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

async function fixCampaignsRLS() {
  console.log('🔧 Fixing campaigns RLS policies...\n');

  const policies = [
    {
      name: 'drop_old_policies',
      sql: `
        DROP POLICY IF EXISTS "Brands can insert their own campaigns" ON campaigns;
        DROP POLICY IF EXISTS "Brands can update their own campaigns" ON campaigns;
        DROP POLICY IF EXISTS "Brands can delete their own campaigns" ON campaigns;
        DROP POLICY IF EXISTS "Users can view campaigns" ON campaigns;
      `
    },
    {
      name: 'create_insert_policy',
      sql: `
        CREATE POLICY "Enable insert for authenticated users" ON campaigns
          FOR INSERT
          TO authenticated
          WITH CHECK (true);
      `
    },
    {
      name: 'create_read_policy',
      sql: `
        CREATE POLICY "Enable read for authenticated users" ON campaigns
          FOR SELECT
          TO authenticated
          USING (true);
      `
    },
    {
      name: 'create_update_policy',
      sql: `
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
      `
    },
    {
      name: 'create_delete_policy',
      sql: `
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
      `
    }
  ];

  for (const policy of policies) {
    console.log(`   📝 ${policy.name}...`);
    // Note: This requires a custom RPC function or direct SQL access
    // For now, just log that it needs to be run manually
  }

  console.log('\n⚠️  RLS policies need to be updated manually in Supabase Dashboard');
  console.log('📋 Run the SQL from: supabase/migrations/20260212_fix_campaigns_rls.sql\n');
}

// Run the script
async function main() {
  console.log('🚀 AURA Admin Setup Script\n');
  console.log('=' .repeat(50) + '\n');

  await setAdminUsers();
  console.log('\n' + '='.repeat(50) + '\n');
  await fixCampaignsRLS();

  console.log('✨ Done!\n');
}

main();
