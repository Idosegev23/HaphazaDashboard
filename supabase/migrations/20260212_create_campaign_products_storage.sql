-- Create storage bucket for campaign product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-products', 'campaign-products', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on campaign-products bucket
CREATE POLICY "Public can view campaign product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'campaign-products');

CREATE POLICY "Brands can upload campaign product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'campaign-products'
  AND auth.uid() IN (
    SELECT user_id FROM memberships
    WHERE entity_type = 'brand' AND is_active = true
  )
);

CREATE POLICY "Brands can update their campaign product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'campaign-products'
  AND auth.uid() IN (
    SELECT user_id FROM memberships
    WHERE entity_type = 'brand' AND is_active = true
  )
);

CREATE POLICY "Brands can delete their campaign product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'campaign-products'
  AND auth.uid() IN (
    SELECT user_id FROM memberships
    WHERE entity_type = 'brand' AND is_active = true
  )
);
