#!/usr/bin/env node

/**
 * Setup Admin Users Script
 * 
 * This script sets admin role for specified users.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse .env.local file
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
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  console.error('⚠️  Note: ANON_KEY cannot modify auth.users table');
  console.error('\n📋 Please run the SQL manually in Supabase Dashboard:');
  console.error('\nSee SETUP_ADMINS.md for instructions.\n');
  process.exit(1);
}

console.log('🚀 AURA Admin Setup\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Using key:', supabaseKey.substring(0, 20) + '...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

const adminEmails = ['cto@ldrsgroup.com', 'yoav@ldrsgroup.com'];

async function setAdmins() {
  try {
    console.log('Setting admin users...\n');
    
    // This requires SERVICE_ROLE_KEY and direct SQL access
    const { data, error } = await supabase.rpc('set_admin_users', {
      emails: adminEmails
    });

    if (error) {
      console.error('❌ Error:', error.message);
      console.error('\n⚠️  This operation requires direct database access.');
      console.error('📋 Please run the SQL from SETUP_ADMINS.md in Supabase Dashboard.\n');
      process.exit(1);
    }

    console.log('✅ Success!');
    console.log(data);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('\n📋 Please run the SQL from SETUP_ADMINS.md in Supabase Dashboard.\n');
    process.exit(1);
  }
}

setAdmins();
