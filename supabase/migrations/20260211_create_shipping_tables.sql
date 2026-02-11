-- Create Shipping Tables (Missing from previous migrations)
-- This migration creates all necessary tables for the shipping functionality

-- 1. Campaign Products Table
CREATE TABLE IF NOT EXISTS campaign_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  image_url TEXT,
  quantity INTEGER DEFAULT 1,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Shipment Requests Table
CREATE TABLE IF NOT EXISTS shipment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status shipment_status DEFAULT 'not_requested',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Shipment Addresses Table
CREATE TABLE IF NOT EXISTS shipment_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_request_id UUID NOT NULL REFERENCES shipment_requests(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  street TEXT NOT NULL,
  house_number TEXT NOT NULL,
  apartment TEXT,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'Israel',
  phone TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Shipments Table (actual shipment tracking)
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_request_id UUID NOT NULL REFERENCES shipment_requests(id) ON DELETE CASCADE,
  tracking_number TEXT,
  carrier TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Task Eligibility Rules Table
CREATE TABLE IF NOT EXISTS task_eligibility_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  requires_shipment_delivered BOOLEAN DEFAULT false,
  requires_payment_verified BOOLEAN DEFAULT false,
  custom_rule TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_products_campaign ON campaign_products(campaign_id);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_campaign ON shipment_requests(campaign_id);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_creator ON shipment_requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_status ON shipment_requests(status);
CREATE INDEX IF NOT EXISTS idx_shipment_addresses_request ON shipment_addresses(shipment_request_id);
CREATE INDEX IF NOT EXISTS idx_shipment_addresses_creator ON shipment_addresses(creator_id);
CREATE INDEX IF NOT EXISTS idx_shipments_request ON shipments(shipment_request_id);
CREATE INDEX IF NOT EXISTS idx_task_eligibility_task ON task_eligibility_rules(task_id);

-- RLS Policies

-- Campaign Products: Brand can manage their own campaign products
ALTER TABLE campaign_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brands can manage their campaign products" ON campaign_products;
CREATE POLICY "Brands can manage their campaign products"
ON campaign_products FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = campaign_products.campaign_id
    AND c.brand_id = (
      SELECT brand_id FROM users_profiles WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Creators can view campaign products" ON campaign_products;
CREATE POLICY "Creators can view campaign products"
ON campaign_products FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns c
    JOIN applications a ON a.campaign_id = c.id
    WHERE c.id = campaign_products.campaign_id
    AND a.creator_id = auth.uid()
    AND a.status = 'approved'
  )
);

-- Shipment Requests
ALTER TABLE shipment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brands can manage shipment requests" ON shipment_requests;
CREATE POLICY "Brands can manage shipment requests"
ON shipment_requests FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns c
    WHERE c.id = shipment_requests.campaign_id
    AND c.brand_id = (
      SELECT brand_id FROM users_profiles WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Creators can view their shipment requests" ON shipment_requests;
CREATE POLICY "Creators can view their shipment requests"
ON shipment_requests FOR SELECT
TO authenticated
USING (creator_id = auth.uid());

-- Shipment Addresses
ALTER TABLE shipment_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators can manage their addresses" ON shipment_addresses;
CREATE POLICY "Creators can manage their addresses"
ON shipment_addresses FOR ALL
TO authenticated
USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Brands can view shipment addresses" ON shipment_addresses;
CREATE POLICY "Brands can view shipment addresses"
ON shipment_addresses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shipment_requests sr
    JOIN campaigns c ON c.id = sr.campaign_id
    WHERE sr.id = shipment_addresses.shipment_request_id
    AND c.brand_id = (
      SELECT brand_id FROM users_profiles WHERE user_id = auth.uid()
    )
  )
);

-- Shipments
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brands can manage shipments" ON shipments;
CREATE POLICY "Brands can manage shipments"
ON shipments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shipment_requests sr
    JOIN campaigns c ON c.id = sr.campaign_id
    WHERE sr.id = shipments.shipment_request_id
    AND c.brand_id = (
      SELECT brand_id FROM users_profiles WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Creators can view their shipments" ON shipments;
CREATE POLICY "Creators can view their shipments"
ON shipments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shipment_requests sr
    WHERE sr.id = shipments.shipment_request_id
    AND sr.creator_id = auth.uid()
  )
);

-- Task Eligibility Rules
ALTER TABLE task_eligibility_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brands can manage task eligibility" ON task_eligibility_rules;
CREATE POLICY "Brands can manage task eligibility"
ON task_eligibility_rules FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN campaigns c ON c.id = t.campaign_id
    WHERE t.id = task_eligibility_rules.task_id
    AND c.brand_id = (
      SELECT brand_id FROM users_profiles WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Creators can view task eligibility" ON task_eligibility_rules;
CREATE POLICY "Creators can view task eligibility"
ON task_eligibility_rules FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_eligibility_rules.task_id
    AND t.creator_id = auth.uid()
  )
);

-- Function to automatically create shipment request when task is created with requires_product=true
CREATE OR REPLACE FUNCTION create_shipment_request_for_product_task()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.requires_product = true THEN
    INSERT INTO shipment_requests (campaign_id, creator_id, status)
    VALUES (NEW.campaign_id, NEW.creator_id, 'waiting_address');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create shipment requests
DROP TRIGGER IF EXISTS trigger_create_shipment_request ON tasks;
CREATE TRIGGER trigger_create_shipment_request
AFTER INSERT ON tasks
FOR EACH ROW
EXECUTE FUNCTION create_shipment_request_for_product_task();
