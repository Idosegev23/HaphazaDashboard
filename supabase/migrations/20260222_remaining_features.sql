-- =============================================================
-- Migration: remaining_features
-- Applied: 2026-02-22
-- Purpose: Campaigns content calendar, revision deadlines,
--          creator approval flow, push notifications,
--          notification preferences, notifications table
-- Idempotent: safe to re-run on existing DB
-- =============================================================

-- =====================
-- 1. CAMPAIGNS columns
-- =====================
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS content_period_type TEXT DEFAULT 'campaign_dates';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS publish_start DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS publish_end DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS max_revisions INTEGER DEFAULT 2;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS submission_deadline DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS go_live_date DATE;

-- Add CHECK constraint only if not already present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_content_period_type_check'
  ) THEN
    ALTER TABLE campaigns
      ADD CONSTRAINT campaigns_content_period_type_check
      CHECK (content_period_type IN ('calendar_month', 'campaign_dates', 'custom'));
  END IF;
END $$;

-- =====================
-- 2. UPLOADS columns
-- =====================
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS revision_number INTEGER DEFAULT 1;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS rejection_notes TEXT;

-- =====================
-- 3. CREATORS status
-- =====================
ALTER TABLE creators ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_approval';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'creators_status_check'
  ) THEN
    ALTER TABLE creators
      ADD CONSTRAINT creators_status_check
      CHECK (status IN ('pending_approval', 'approved', 'rejected', 'suspended'));
  END IF;
END $$;

-- Backfill existing creators to 'approved' (only those still NULL or pending)
UPDATE creators SET status = 'approved' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_creators_status ON creators(status);

-- =====================
-- 4. USERS_PROFILES notification preferences
-- =====================
ALTER TABLE users_profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"channels":["in_app"]}';

-- =====================
-- 5. NOTIFICATIONS table
-- =====================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT FALSE,
  entity_type TEXT,
  entity_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read = FALSE;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own notifications' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications" ON notifications
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own notifications' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications" ON notifications
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service can insert notifications' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Service can insert notifications" ON notifications
      FOR INSERT TO authenticated
      WITH CHECK (TRUE);
  END IF;
END $$;

-- =====================
-- 6. PUSH_SUBSCRIPTIONS table
-- =====================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_profiles(user_id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own push subscriptions' AND tablename = 'push_subscriptions'
  ) THEN
    CREATE POLICY "Users manage own push subscriptions" ON push_subscriptions
      FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- =====================
-- 7. RPC: admin_review_creator
-- =====================
CREATE OR REPLACE FUNCTION admin_review_creator(
  p_creator_user_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_creator RECORD;
BEGIN
  IF NOT is_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_creator FROM creators WHERE user_id = p_creator_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Creator not found');
  END IF;

  IF p_action = 'approve' THEN
    UPDATE creators SET status = 'approved', updated_at = now() WHERE user_id = p_creator_user_id;
    -- Send approval notification
    INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
    VALUES (
      p_creator_user_id,
      'creator_approved',
      'החשבון שלך אושר!',
      'ברוך הבא ל-Leaders! כעת תוכל/י לגשת לפלטפורמה.',
      'creator',
      p_creator_user_id::text
    );
    RETURN json_build_object('success', true, 'action', 'approved');

  ELSIF p_action = 'reject' THEN
    UPDATE creators SET status = 'rejected', updated_at = now() WHERE user_id = p_creator_user_id;
    INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
    VALUES (
      p_creator_user_id,
      'creator_rejected',
      'הבקשה נדחתה',
      COALESCE(p_reason, 'הבקשה שלך להצטרף לפלטפורמה לא אושרה.'),
      'creator',
      p_creator_user_id::text
    );
    RETURN json_build_object('success', true, 'action', 'rejected');

  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid action. Use approve or reject.');
  END IF;
END;
$$;

-- =====================
-- 8. RPC: get_pending_creators_count
-- =====================
CREATE OR REPLACE FUNCTION get_pending_creators_count()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN
    RETURN 0;
  END IF;

  RETURN (SELECT COUNT(*)::int FROM creators WHERE status = 'pending_approval');
END;
$$;

-- =====================
-- 9. RPC: get_admin_users (updated with creator_status)
-- =====================
DROP FUNCTION IF EXISTS get_admin_users();

CREATE OR REPLACE FUNCTION get_admin_users()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT,
  is_blocked BOOLEAN,
  created_at TIMESTAMPTZ,
  creator_id UUID,
  creator_niches TEXT[],
  creator_tier TEXT,
  creator_verified_at TIMESTAMPTZ,
  creator_status TEXT,
  brand_id UUID,
  brand_name TEXT,
  brand_verified_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    up.user_id,
    up.email,
    up.display_name,
    up.avatar_url,
    COALESCE(
      (SELECT au.raw_user_meta_data->>'role' FROM auth.users au WHERE au.id = up.user_id),
      (SELECT m.role::text FROM memberships m WHERE m.user_id = up.user_id AND m.is_active = true ORDER BY m.created_at DESC LIMIT 1)
    ) AS role,
    up.is_blocked,
    up.created_at,
    c.user_id AS creator_id,
    c.niches AS creator_niches,
    c.tier AS creator_tier,
    c.verified_at AS creator_verified_at,
    c.status AS creator_status,
    b.id AS brand_id,
    b.name AS brand_name,
    b.verified_at AS brand_verified_at
  FROM users_profiles up
  LEFT JOIN creators c ON c.user_id = up.user_id
  LEFT JOIN memberships mb ON mb.user_id = up.user_id AND mb.is_active = true AND mb.entity_type = 'brand'
  LEFT JOIN brands b ON b.id = mb.entity_id
  ORDER BY up.created_at DESC;
END;
$$;

-- =====================
-- 10. RPC: review_content (updated with max_revisions + revision_number)
-- =====================
CREATE OR REPLACE FUNCTION review_content(
  p_upload_id UUID,
  p_action TEXT,
  p_feedback TEXT DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_upload RECORD;
  v_task RECORD;
  v_campaign RECORD;
  v_rejection_count INTEGER;
  v_max_revisions INTEGER;
  v_next_revision INTEGER;
BEGIN
  SELECT * INTO v_upload FROM uploads WHERE id = p_upload_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Upload not found');
  END IF;

  SELECT * INTO v_task FROM tasks WHERE id = v_upload.task_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Task not found');
  END IF;

  SELECT * INTO v_campaign FROM campaigns WHERE id = v_task.campaign_id;
  IF NOT is_brand_member(v_campaign.brand_id) AND NOT is_admin() THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF p_action = 'approve' THEN
    UPDATE uploads SET status = 'approved' WHERE id = p_upload_id;
    UPDATE tasks SET status = 'approved', updated_at = now() WHERE id = v_upload.task_id;
    RETURN json_build_object('success', true, 'action', 'approved');

  ELSIF p_action = 'reject' THEN
    -- Check max revisions
    v_max_revisions := COALESCE(v_campaign.max_revisions, 2);
    SELECT COUNT(*) INTO v_rejection_count
      FROM uploads
      WHERE task_id = v_upload.task_id AND status = 'rejected';

    IF v_rejection_count >= v_max_revisions THEN
      RETURN json_build_object('success', false, 'error', 'Max revisions reached');
    END IF;

    v_next_revision := v_rejection_count + 1;

    UPDATE uploads SET
      status = 'rejected',
      rejection_reason = COALESCE(p_feedback, 'לא צוין'),
      revision_number = v_next_revision,
      meta = COALESCE(v_upload.meta, '{}'::jsonb) || jsonb_build_object('rejection_reason', COALESCE(p_feedback, 'לא צוין'))
    WHERE id = p_upload_id;

    UPDATE tasks SET status = 'needs_edits', updated_at = now() WHERE id = v_upload.task_id;

    INSERT INTO revision_requests (task_id, note, tags, status)
    VALUES (v_upload.task_id, COALESCE(p_feedback, 'התוכן נדחה - נדרש תיקון'), ARRAY['content_rejected'], 'open');

    RETURN json_build_object('success', true, 'action', 'rejected', 'revision', v_next_revision, 'max_revisions', v_max_revisions);

  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid action');
  END IF;
END;
$$;

-- =====================
-- 11. RPC: notification helpers
-- =====================
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::int FROM notifications
    WHERE user_id = auth.uid() AND read = FALSE
  );
END;
$$;

CREATE OR REPLACE FUNCTION mark_notifications_read()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE notifications SET read = TRUE
  WHERE user_id = auth.uid() AND read = FALSE;
END;
$$;
