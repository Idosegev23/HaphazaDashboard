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
