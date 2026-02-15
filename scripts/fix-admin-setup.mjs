#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse .env.local
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🚀 AURA Admin Setup Script');
console.log('=' .repeat(60));
console.log('Project:', supabaseUrl);
console.log('=' .repeat(60) + '\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixSetup() {
  try {
    console.log('📋 SQL to run in Supabase Dashboard:\n');
    console.log('=' .repeat(60));
    
    const sql = `
-- 1. Set admin users
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email IN ('cto@ldrsgroup.com', 'yoav@ldrsgroup.com');

-- 2. Verify
SELECT id, email, raw_user_meta_data->>'role' as role
FROM auth.users 
WHERE email IN ('cto@ldrsgroup.com', 'yoav@ldrsgroup.com');

-- 3. Fix campaigns RLS
DROP POLICY IF EXISTS "Brands can insert their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Brands can update their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Brands can delete their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can view campaigns" ON campaigns;

CREATE POLICY "Enable insert for authenticated users" ON campaigns
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON campaigns
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable update for campaign owners and admins" ON campaigns
  FOR UPDATE TO authenticated
  USING (
    brand_id IN (SELECT brand_id FROM brand_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Enable delete for campaign owners and admins" ON campaigns
  FOR DELETE TO authenticated
  USING (
    brand_id IN (SELECT brand_id FROM brand_users WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );
`;

    console.log(sql);
    console.log('=' .repeat(60) + '\n');
    
    console.log('📍 Steps:');
    console.log('1. Go to: https://supabase.com/dashboard/project/cmbdmphuysntziwuosev/sql');
    console.log('2. Paste the SQL above');
    console.log('3. Click "RUN"\n');
    
    console.log('✅ This will:');
    console.log('   - Set cto@ldrsgroup.com as admin');
    console.log('   - Set yoav@ldrsgroup.com as admin');
    console.log('   - Fix campaigns RLS policies\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixSetup();
