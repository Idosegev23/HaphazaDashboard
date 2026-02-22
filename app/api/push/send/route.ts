import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Simple in-memory rate limiter: map of userId -> list of timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20; // max 20 requests per minute per caller

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];

  // Evict old entries
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(userId, recent);
    return true;
  }

  recent.push(now);
  rateLimitMap.set(userId, recent);
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // --- Auth: verify caller is admin ---
    const supabase = await createClient();
    const {
      data: { user: caller },
    } = await supabase.auth.getUser();

    if (!caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role via user metadata (same logic as lib/auth/get-user.ts)
    const roleFromMetadata = caller.user_metadata?.role as string | undefined;
    const ADMIN_ROLES = ['admin', 'finance', 'support', 'content_ops'];

    let callerRole = roleFromMetadata;
    if (!callerRole || !ADMIN_ROLES.includes(callerRole)) {
      // Fallback: check memberships for admin-level role
      const { data: membership } = await supabase
        .from('memberships')
        .select('role')
        .eq('user_id', caller.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      callerRole = membership?.role || undefined;
    }

    if (!callerRole || !ADMIN_ROLES.includes(callerRole)) {
      return NextResponse.json({ error: 'Forbidden: admin role required' }, { status: 403 });
    }

    // --- Rate limiting ---
    if (isRateLimited(caller.id)) {
      return NextResponse.json(
        { error: 'Too many requests. Max 20 per minute.' },
        { status: 429 }
      );
    }

    // --- Validate request body ---
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { user_id, title, body: notifBody, url } = body as {
      user_id?: string;
      title?: string;
      body?: string;
      url?: string;
    };

    if (!user_id || typeof user_id !== 'string' || !UUID_REGEX.test(user_id)) {
      return NextResponse.json({ error: 'user_id must be a valid UUID' }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || title.length > 200) {
      return NextResponse.json(
        { error: 'title is required and must be a string (max 200 chars)' },
        { status: 400 }
      );
    }

    if (notifBody !== undefined && (typeof notifBody !== 'string' || notifBody.length > 1000)) {
      return NextResponse.json(
        { error: 'body must be a string (max 1000 chars)' },
        { status: 400 }
      );
    }

    if (url !== undefined && (typeof url !== 'string' || url.length > 500)) {
      return NextResponse.json(
        { error: 'url must be a string (max 500 chars)' },
        { status: 400 }
      );
    }

    // Only allow relative URLs (internal navigation)
    if (url && !url.startsWith('/')) {
      return NextResponse.json(
        { error: 'url must be a relative path starting with /' },
        { status: 400 }
      );
    }

    // --- Check user's notification preferences ---
    const { data: profileData } = await supabase
      .from('users_profiles')
      .select('notification_preferences')
      .eq('user_id', user_id)
      .single();

    const prefs = profileData?.notification_preferences as
      | { channels?: string[] }
      | null;

    if (prefs?.channels && !prefs.channels.includes('push')) {
      return NextResponse.json({
        sent: 0,
        message: 'User has disabled push notifications',
      });
    }

    // --- Load web-push ---
    let webpush: any;
    try {
      webpush = require('web-push');
    } catch {
      return NextResponse.json(
        { error: 'web-push not installed. Run: npm install web-push' },
        { status: 500 }
      );
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@leaders.co.il';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error(
        '[Push] VAPID keys not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env.local. Generate with: npx web-push generate-vapid-keys'
      );
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === 'production'
              ? 'Push service unavailable'
              : 'VAPID keys not configured. Run: npx web-push generate-vapid-keys',
        },
        { status: 500 }
      );
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    // --- Get push subscriptions for target user ---
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No subscriptions found' });
    }

    const payload = JSON.stringify({
      title,
      body: notifBody,
      url: url || '/',
    });

    let sent = 0;
    const failed: string[] = [];

    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        sent++;
      } catch (err: any) {
        // Clean up expired/gone subscriptions
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint);
        }
        failed.push(sub.endpoint);
      }
    }

    return NextResponse.json({ sent, failed: failed.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
