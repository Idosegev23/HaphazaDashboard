-- =============================================================
-- Migration: full_features
-- Applied: 2026-02-22
-- Purpose: Platforms selection, revision deadlines, brand notes,
--          campaign messages, creator rejection details,
--          expanded deliverables support
-- Idempotent: safe to re-run on existing DB
-- =============================================================

-- =====================
-- 1. CAMPAIGNS: platforms column
-- =====================
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS platforms TEXT[];

-- =====================
-- 2. CAMPAIGNS: revision_deadlines JSONB
-- For per-round deadlines, e.g. [{"round":1,"deadline":"2026-03-01"},{"round":2,"deadline":"2026-03-08"}]
-- =====================
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS revision_deadlines JSONB DEFAULT '[]';

-- =====================
-- 3. CAMPAIGNS: ensure columns exist (idempotent)
-- =====================
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_barter BOOLEAN DEFAULT FALSE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS barter_description TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS requires_sponsored_approval BOOLEAN DEFAULT TRUE;

-- =====================
-- 3b. CAMPAIGNS: deliverable_details (H1 - per-deliverable due date & notes)
-- e.g. {"instagram_reel": {"due_date": "2026-03-15", "notes": "Include logo"}, ...}
-- =====================
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS deliverable_details JSONB DEFAULT '{}';

-- =====================
-- 4. CREATORS: rejection fields
-- =====================
ALTER TABLE creators ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS rejection_notes TEXT;

-- =====================
-- 5. BRAND_CREATOR_NOTES table
-- =====================
CREATE TABLE IF NOT EXISTS brand_creator_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  creator_id UUID NOT NULL REFERENCES users_profiles(user_id) ON DELETE CASCADE,
  note TEXT NOT NULL DEFAULT '',
  author_id UUID,
  author_name TEXT,
  author_role TEXT DEFAULT 'brand',
  brand_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop old unique constraint if it exists (allow multiple notes per brand-creator)
ALTER TABLE brand_creator_notes DROP CONSTRAINT IF EXISTS brand_creator_notes_brand_id_creator_id_key;

-- Add brand_name column if table already existed
ALTER TABLE brand_creator_notes ADD COLUMN IF NOT EXISTS brand_name TEXT;

CREATE INDEX IF NOT EXISTS idx_brand_creator_notes_brand ON brand_creator_notes(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_creator_notes_creator ON brand_creator_notes(creator_id);

-- RLS
ALTER TABLE brand_creator_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Brand members manage their notes' AND tablename = 'brand_creator_notes'
  ) THEN
    CREATE POLICY "Brand members manage their notes" ON brand_creator_notes
      FOR ALL TO authenticated
      USING (
        brand_id IN (
          SELECT entity_id FROM memberships
          WHERE user_id = auth.uid() AND entity_type = 'brand' AND is_active = true
        )
        OR
        EXISTS (
          SELECT 1 FROM auth.users WHERE id = auth.uid()
          AND raw_user_meta_data->>'role' IN ('admin', 'finance', 'support', 'content_ops')
        )
      )
      WITH CHECK (
        brand_id IN (
          SELECT entity_id FROM memberships
          WHERE user_id = auth.uid() AND entity_type = 'brand' AND is_active = true
        )
        OR
        EXISTS (
          SELECT 1 FROM auth.users WHERE id = auth.uid()
          AND raw_user_meta_data->>'role' IN ('admin', 'finance', 'support', 'content_ops')
        )
      );
  END IF;
END $$;

-- =====================
-- 6. CAMPAIGN_MESSAGES table (campaign-scoped chat)
-- =====================
CREATE TABLE IF NOT EXISTS campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('brand', 'creator', 'admin')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign ON campaign_messages(campaign_id, created_at);

-- RLS
ALTER TABLE campaign_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Campaign participants can view messages' AND tablename = 'campaign_messages'
  ) THEN
    CREATE POLICY "Campaign participants can view messages" ON campaign_messages
      FOR SELECT TO authenticated
      USING (
        -- Brand members of the campaign's brand
        EXISTS (
          SELECT 1 FROM campaigns c
          JOIN memberships m ON m.entity_id = c.brand_id AND m.entity_type = 'brand'
          WHERE c.id = campaign_id AND m.user_id = auth.uid() AND m.is_active = true
        )
        OR
        -- Creators with tasks in this campaign
        EXISTS (
          SELECT 1 FROM tasks t
          WHERE t.campaign_id = campaign_messages.campaign_id AND t.creator_id = auth.uid()
        )
        OR
        -- Admins
        EXISTS (
          SELECT 1 FROM auth.users WHERE id = auth.uid()
          AND raw_user_meta_data->>'role' IN ('admin', 'support', 'content_ops')
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Campaign participants can send messages' AND tablename = 'campaign_messages'
  ) THEN
    CREATE POLICY "Campaign participants can send messages" ON campaign_messages
      FOR INSERT TO authenticated
      WITH CHECK (
        sender_id = auth.uid()
        AND (
          EXISTS (
            SELECT 1 FROM campaigns c
            JOIN memberships m ON m.entity_id = c.brand_id AND m.entity_type = 'brand'
            WHERE c.id = campaign_id AND m.user_id = auth.uid() AND m.is_active = true
          )
          OR
          EXISTS (
            SELECT 1 FROM tasks t
            WHERE t.campaign_id = campaign_messages.campaign_id AND t.creator_id = auth.uid()
          )
          OR
          EXISTS (
            SELECT 1 FROM auth.users WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' IN ('admin', 'support', 'content_ops')
          )
        )
      );
  END IF;
END $$;

-- =====================
-- 7. Update admin_review_creator to store rejection_reason/notes
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
    UPDATE creators SET status = 'approved', rejection_reason = NULL, rejection_notes = NULL, updated_at = now() WHERE user_id = p_creator_user_id;
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
    UPDATE creators SET status = 'rejected', rejection_reason = p_reason, updated_at = now() WHERE user_id = p_creator_user_id;
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
