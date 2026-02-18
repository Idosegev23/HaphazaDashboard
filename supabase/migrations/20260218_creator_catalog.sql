-- Creator Catalog feature: add bio, city columns and RLS for brand access

-- 1. Add bio column to creators
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Add city column to creators (registration collects it but wasn't stored)
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS city TEXT;

-- 3. Allow brands and admins to view creator_metrics (for catalog ratings)
DROP POLICY IF EXISTS "Brands can view creator metrics" ON public.creator_metrics;
CREATE POLICY "Brands can view creator metrics" ON public.creator_metrics
  FOR SELECT TO authenticated
  USING (true);

-- 4. Fix creators SELECT policy - allow all authenticated users to browse catalog
-- Previous policy only checked brand_users table but missed memberships table
DROP POLICY IF EXISTS "Admins and brands can view creator profiles" ON public.creators;
DROP POLICY IF EXISTS "Users can view their own creator profile" ON public.creators;
CREATE POLICY "Authenticated users can view creators" ON public.creators
  FOR SELECT TO authenticated
  USING (true);

-- 5. Add direct FK from creators to users_profiles for PostgREST join support
-- creators already has FK to auth.users, but PostgREST needs a direct FK to resolve
-- the users_profiles!inner(...) embedding syntax
ALTER TABLE public.creators
  ADD CONSTRAINT creators_profile_fkey
  FOREIGN KEY (user_id) REFERENCES public.users_profiles(user_id);

-- 6. RPC function for atomic content review (approve/reject)
-- SECURITY DEFINER bypasses RLS, so task + revision_request updates always succeed
CREATE OR REPLACE FUNCTION review_content(
  p_upload_id UUID,
  p_action TEXT,
  p_feedback TEXT DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_upload RECORD;
  v_task RECORD;
  v_campaign RECORD;
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
    UPDATE uploads SET status = 'rejected',
      meta = COALESCE(v_upload.meta, '{}'::jsonb) || jsonb_build_object('rejection_reason', COALESCE(p_feedback, 'לא צוין'))
      WHERE id = p_upload_id;
    UPDATE tasks SET status = 'needs_edits', updated_at = now() WHERE id = v_upload.task_id;
    INSERT INTO revision_requests (task_id, note, tags, status)
      VALUES (v_upload.task_id, COALESCE(p_feedback, 'התוכן נדחה - נדרש תיקון'), ARRAY['content_rejected'], 'open');
    RETURN json_build_object('success', true, 'action', 'rejected');

  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid action');
  END IF;
END;
$$;
