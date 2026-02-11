-- Create storage buckets for the platform
-- תאריך: 2026-02-11

-- 1. Avatar images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Campaign briefs bucket  
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-briefs',
  'campaign-briefs',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Task uploads bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-uploads',
  'task-uploads',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for avatars
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Storage Policies for campaign briefs
DROP POLICY IF EXISTS "Brands can upload campaign briefs" ON storage.objects;
CREATE POLICY "Brands can upload campaign briefs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'campaign-briefs'
  AND EXISTS (
    SELECT 1 FROM users_profiles
    WHERE user_id = auth.uid()
    AND role IN ('brand_manager', 'brand_user')
  )
);

DROP POLICY IF EXISTS "Authenticated users can view campaign briefs" ON storage.objects;
CREATE POLICY "Authenticated users can view campaign briefs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'campaign-briefs');

-- Storage Policies for task uploads (if not exist)
DROP POLICY IF EXISTS "Creators can upload task files" ON storage.objects;
CREATE POLICY "Creators can upload task files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-uploads'
  AND EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id::text = (storage.foldername(name))[1]
    AND t.creator_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Task participants can view uploads" ON storage.objects;
CREATE POLICY "Task participants can view uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-uploads'
  AND (
    -- Creator can view their own uploads
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id::text = (storage.foldername(name))[1]
      AND t.creator_id = auth.uid()
    )
    OR
    -- Brand can view uploads for their campaigns
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN campaigns c ON c.id = t.campaign_id
      WHERE t.id::text = (storage.foldername(name))[1]
      AND c.brand_id = (
        SELECT brand_id FROM users_profiles WHERE user_id = auth.uid()
      )
    )
  )
);
