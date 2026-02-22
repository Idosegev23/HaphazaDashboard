-- =============================================================
-- Migration: disputes_system
-- Applied: 2026-02-22
-- Purpose: RLS policies for disputes table, raise_dispute RPC,
--          get_open_disputes_count RPC, category column
-- Idempotent: safe to re-run on existing DB
-- =============================================================

-- =====================
-- 1. DISPUTES: category column
-- =====================
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS category TEXT;

-- =====================
-- 2. RLS Policies for disputes
-- =====================
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Admin: full access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins manage all disputes' AND tablename = 'disputes'
  ) THEN
    CREATE POLICY "Admins manage all disputes" ON disputes
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users WHERE id = auth.uid()
          AND raw_user_meta_data->>'role' IN ('admin', 'support', 'content_ops')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM auth.users WHERE id = auth.uid()
          AND raw_user_meta_data->>'role' IN ('admin', 'support', 'content_ops')
        )
      );
  END IF;
END $$;

-- Creators: read disputes on their own tasks + disputes they raised
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Creators read own disputes' AND tablename = 'disputes'
  ) THEN
    CREATE POLICY "Creators read own disputes" ON disputes
      FOR SELECT TO authenticated
      USING (
        raised_by = auth.uid()
        OR task_id IN (
          SELECT id FROM tasks WHERE creator_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Creators: insert disputes on their own tasks
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Creators insert own disputes' AND tablename = 'disputes'
  ) THEN
    CREATE POLICY "Creators insert own disputes" ON disputes
      FOR INSERT TO authenticated
      WITH CHECK (
        raised_by = auth.uid()
        AND task_id IN (
          SELECT id FROM tasks WHERE creator_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Brand members: read disputes on tasks of their campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Brands read campaign disputes' AND tablename = 'disputes'
  ) THEN
    CREATE POLICY "Brands read campaign disputes" ON disputes
      FOR SELECT TO authenticated
      USING (
        raised_by = auth.uid()
        OR task_id IN (
          SELECT t.id FROM tasks t
          JOIN campaigns c ON t.campaign_id = c.id
          JOIN memberships m ON m.entity_id = c.brand_id AND m.entity_type = 'brand'
          WHERE m.user_id = auth.uid() AND m.is_active = true
        )
      );
  END IF;
END $$;

-- Brand members: insert disputes on tasks of their campaigns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Brands insert campaign disputes' AND tablename = 'disputes'
  ) THEN
    CREATE POLICY "Brands insert campaign disputes" ON disputes
      FOR INSERT TO authenticated
      WITH CHECK (
        raised_by = auth.uid()
        AND task_id IN (
          SELECT t.id FROM tasks t
          JOIN campaigns c ON t.campaign_id = c.id
          JOIN memberships m ON m.entity_id = c.brand_id AND m.entity_type = 'brand'
          WHERE m.user_id = auth.uid() AND m.is_active = true
        )
      );
  END IF;
END $$;

-- =====================
-- 3. RPC: raise_dispute
-- =====================
CREATE OR REPLACE FUNCTION raise_dispute(
  p_task_id UUID,
  p_reason TEXT,
  p_category TEXT DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_task RECORD;
  v_dispute_id UUID;
  v_raiser_name TEXT;
  v_is_admin BOOLEAN;
  v_is_creator BOOLEAN;
  v_is_brand BOOLEAN;
BEGIN
  -- Get task with campaign details
  SELECT t.id, t.title, t.status, t.creator_id, c.brand_id, c.title AS campaign_title
  INTO v_task
  FROM tasks t
  JOIN campaigns c ON t.campaign_id = c.id
  WHERE t.id = p_task_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Task not found');
  END IF;

  -- Check if already disputed
  IF v_task.status = 'disputed' THEN
    RETURN json_build_object('success', false, 'error', 'Task is already disputed');
  END IF;

  -- Check if there's already an open dispute
  IF EXISTS (SELECT 1 FROM disputes WHERE task_id = p_task_id AND status = 'open') THEN
    RETURN json_build_object('success', false, 'error', 'There is already an open dispute for this task');
  END IF;

  -- Check valid status for dispute
  IF v_task.status NOT IN ('needs_edits', 'uploaded', 'approved', 'in_production') THEN
    RETURN json_build_object('success', false, 'error', 'Task status does not allow disputes');
  END IF;

  -- Determine caller role
  v_is_admin := EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' IN ('admin', 'support', 'content_ops')
  );
  v_is_creator := (auth.uid() = v_task.creator_id);
  v_is_brand := EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid() AND entity_id = v_task.brand_id
    AND entity_type = 'brand' AND is_active = true
  );

  IF NOT (v_is_admin OR v_is_creator OR v_is_brand) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get raiser display name
  SELECT display_name INTO v_raiser_name
  FROM users_profiles WHERE user_id = auth.uid();

  -- Insert dispute
  INSERT INTO disputes (task_id, raised_by, reason, status, category)
  VALUES (p_task_id, auth.uid(), p_reason, 'open', p_category)
  RETURNING id INTO v_dispute_id;

  -- Update task status to disputed
  UPDATE tasks SET status = 'disputed', updated_at = now()
  WHERE id = p_task_id;

  -- Send notifications to the other parties
  IF v_is_creator THEN
    -- Creator raised: notify brand members
    INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
    SELECT m.user_id,
      'dispute_raised',
      'נפתחה מחלוקת על משימה',
      COALESCE(v_raiser_name, 'משפיען') || ' פתח/ה מחלוקת על "' || v_task.title || '"',
      'task',
      p_task_id::text
    FROM memberships m
    WHERE m.entity_id = v_task.brand_id AND m.entity_type = 'brand' AND m.is_active = true;
  ELSIF v_is_brand THEN
    -- Brand raised: notify creator
    INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
    VALUES (
      v_task.creator_id,
      'dispute_raised',
      'נפתחה מחלוקת על משימה',
      'המותג פתח מחלוקת על המשימה "' || v_task.title || '"',
      'task',
      p_task_id::text
    );
  END IF;

  -- Notify admins (via raw_user_meta_data role)
  INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
  SELECT u.id,
    'dispute_raised_admin',
    'מחלוקת חדשה דורשת טיפול',
    COALESCE(v_raiser_name, 'משתמש') || ' פתח/ה מחלוקת: "' || LEFT(p_reason, 100) || '"',
    'dispute',
    v_dispute_id::text
  FROM auth.users u
  WHERE u.raw_user_meta_data->>'role' IN ('admin', 'support', 'content_ops')
    AND u.id != auth.uid();

  -- Audit log
  PERFORM log_audit('dispute', v_dispute_id::text, 'raised', json_build_object(
    'task_id', p_task_id,
    'category', p_category,
    'reason', LEFT(p_reason, 200)
  ));

  RETURN json_build_object('success', true, 'dispute_id', v_dispute_id);
END;
$$;

-- =====================
-- 4. RPC: get_open_disputes_count
-- =====================
CREATE OR REPLACE FUNCTION get_open_disputes_count()
RETURNS INTEGER LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::integer FROM disputes WHERE status = 'open';
$$;
