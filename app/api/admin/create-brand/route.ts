import { getUser } from '@/lib/auth/get-user';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Verify admin
    const currentUser = await getUser();
    if (!currentUser || !['admin'].includes(currentUser.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { brandName, industry, website, managerEmail, managerPassword, managerDisplayName } =
      await request.json();

    if (!brandName || !managerEmail || !managerPassword || !managerDisplayName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: managerEmail,
      password: managerPassword,
      email_confirm: true,
      user_metadata: {
        display_name: managerDisplayName,
        user_type: 'brand',
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Create user profile
    const { error: profileError } = await adminClient
      .from('users_profiles')
      .insert({
        user_id: userId,
        display_name: managerDisplayName,
        email: managerEmail,
        language: 'he',
      });

    if (profileError) {
      return NextResponse.json({ error: 'Failed to create profile: ' + profileError.message }, { status: 500 });
    }

    // 3. Create brand (without verified_at — triggers onboarding on first login)
    const normalizedWebsite = website
      ? (website.match(/^https?:\/\//i) ? website.trim() : 'https://' + website.trim())
      : null;

    const { data: brand, error: brandError } = await adminClient
      .from('brands')
      .insert({
        name: brandName,
        industry: industry || null,
        website: normalizedWebsite,
        default_language: 'he',
      })
      .select()
      .single();

    if (brandError) {
      return NextResponse.json({ error: 'Failed to create brand: ' + brandError.message }, { status: 500 });
    }

    // 4. Create membership
    const { error: membershipError } = await adminClient.from('memberships').insert({
      user_id: userId,
      role: 'brand_manager',
      entity_type: 'brand',
      entity_id: brand.id,
      is_active: true,
    });

    if (membershipError) {
      return NextResponse.json({ error: 'Failed to create membership: ' + membershipError.message }, { status: 500 });
    }

    // 5. Create brand_users
    const { error: brandUserError } = await adminClient.from('brand_users').insert({
      brand_id: brand.id,
      user_id: userId,
      role: 'brand_manager',
      is_active: true,
    });

    if (brandUserError) {
      return NextResponse.json({ error: 'Failed to create brand_users: ' + brandUserError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      brand: { id: brand.id, name: brand.name },
      user: { id: userId, email: managerEmail },
    });
  } catch (error: any) {
    console.error('Create brand error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
