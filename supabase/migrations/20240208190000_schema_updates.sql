-- Add deliverables to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '{}'::jsonb;

-- Add proof_url to payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- Create storage bucket for payment uploads if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-uploads', 'payment-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (Drop first to avoid errors if they exist)
DROP POLICY IF EXISTS "Authenticated users can upload payment files" ON storage.objects;
CREATE POLICY "Authenticated users can upload payment files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-uploads');

DROP POLICY IF EXISTS "Authenticated users can view payment files" ON storage.objects;
CREATE POLICY "Authenticated users can view payment files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-uploads');
