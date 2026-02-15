-- Add verified_at columns for verification badges
ALTER TABLE creators ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Create batch_payouts table for admin payment batches
CREATE TABLE IF NOT EXISTS batch_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users_profiles(user_id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed')),
  payment_ids UUID[],
  total_amount NUMERIC NOT NULL,
  executed_at TIMESTAMPTZ,
  notes TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_batch_payouts_created_by ON batch_payouts(created_by);
CREATE INDEX IF NOT EXISTS idx_batch_payouts_status ON batch_payouts(status);
CREATE INDEX IF NOT EXISTS idx_batch_payouts_created_at ON batch_payouts(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE batch_payouts IS 'Admin-created payment batches for bulk payout operations';
COMMENT ON COLUMN batch_payouts.payment_ids IS 'Array of payment IDs included in this batch';
COMMENT ON COLUMN batch_payouts.status IS 'Batch status: pending, executed, or failed';
