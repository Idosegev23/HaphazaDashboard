-- Add brief_urls column to campaigns table for multiple brief files

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS brief_urls TEXT[];

COMMENT ON COLUMN campaigns.brief_urls IS 'Array of URLs to multiple brief files (PDF/DOCX)';
