-- Add description column to campaign_products table
ALTER TABLE campaign_products
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN campaign_products.description IS 'Detailed description of the product that will be sent to influencers';
