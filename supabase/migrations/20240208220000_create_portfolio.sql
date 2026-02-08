-- Create portfolio table
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL, -- 'image' or 'video'
  platform TEXT, -- 'instagram', 'tiktok', etc.
  external_link TEXT, -- link to original post
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Creators can manage their own portfolio
CREATE POLICY "Creators can manage their own portfolio"
ON portfolio_items
FOR ALL
TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

-- Brands can view creator portfolios
CREATE POLICY "Brands can view creator portfolios"
ON portfolio_items
FOR SELECT
TO authenticated
USING (true);

-- Create storage bucket for portfolio
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for portfolio
DROP POLICY IF EXISTS "Creators can upload to their portfolio" ON storage.objects;
CREATE POLICY "Creators can upload to their portfolio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'portfolio');

DROP POLICY IF EXISTS "Anyone can view portfolio files" ON storage.objects;
CREATE POLICY "Anyone can view portfolio files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'portfolio');

DROP POLICY IF EXISTS "Creators can delete their portfolio files" ON storage.objects;
CREATE POLICY "Creators can delete their portfolio files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'portfolio');
