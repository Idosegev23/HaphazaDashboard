-- Add brief_url column to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS brief_url TEXT;

-- Create storage bucket for campaign briefs
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-briefs', 'campaign-briefs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for campaign briefs
DROP POLICY IF EXISTS "Brands can upload campaign briefs" ON storage.objects;
CREATE POLICY "Brands can upload campaign briefs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-briefs');

DROP POLICY IF EXISTS "Authenticated users can view campaign briefs" ON storage.objects;
CREATE POLICY "Authenticated users can view campaign briefs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'campaign-briefs');
