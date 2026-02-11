-- Table to store which tutorials a user has dismissed
CREATE TABLE IF NOT EXISTS tutorial_dismissed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_key TEXT NOT NULL,
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tutorial_key)
);

-- Enable RLS
ALTER TABLE tutorial_dismissed ENABLE ROW LEVEL SECURITY;

-- Users can read their own dismissed tutorials
CREATE POLICY "Users can read own dismissed tutorials"
  ON tutorial_dismissed
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own dismissed tutorials
CREATE POLICY "Users can dismiss tutorials"
  ON tutorial_dismissed
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own dismissed tutorials (to re-enable)
CREATE POLICY "Users can re-enable tutorials"
  ON tutorial_dismissed
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_tutorial_dismissed_user_key
  ON tutorial_dismissed(user_id, tutorial_key);
