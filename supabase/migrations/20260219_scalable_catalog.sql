-- Migration: Scalable creator catalog with pagination, server-side filtering, and text search
-- Supports 100K+ creators with efficient indexed queries

-- ============================================================
-- 1. Enable pg_trgm for fast ILIKE text search (including Hebrew)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- 2. Add total_followers cached column for efficient sorting
-- ============================================================
ALTER TABLE creators ADD COLUMN IF NOT EXISTS total_followers BIGINT DEFAULT 0;

-- Backfill existing data
UPDATE creators SET total_followers = COALESCE(
  (SELECT SUM((value->>'followers')::bigint)
   FROM jsonb_each(platforms::jsonb)
   WHERE value->>'followers' IS NOT NULL),
  0
)
WHERE platforms IS NOT NULL;

-- Auto-update trigger on platforms change
CREATE OR REPLACE FUNCTION update_creator_total_followers()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.total_followers := COALESCE(
    (SELECT SUM((value->>'followers')::bigint)
     FROM jsonb_each(NEW.platforms::jsonb)
     WHERE value->>'followers' IS NOT NULL),
    0
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_total_followers ON creators;
CREATE TRIGGER trg_update_total_followers
  BEFORE INSERT OR UPDATE OF platforms ON creators
  FOR EACH ROW EXECUTE FUNCTION update_creator_total_followers();

-- ============================================================
-- 3. Indexes for filtering and searching
-- ============================================================
-- Trigram indexes for ILIKE text search on Hebrew text
CREATE INDEX IF NOT EXISTS idx_users_profiles_name_trgm
  ON users_profiles USING GIN (display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_creators_bio_trgm
  ON creators USING GIN (bio gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_creators_city_trgm
  ON creators USING GIN (city gin_trgm_ops);

-- GIN index for array containment (niches filter)
CREATE INDEX IF NOT EXISTS idx_creators_niches_gin
  ON creators USING GIN (niches);

-- B-tree indexes for equality filters
CREATE INDEX IF NOT EXISTS idx_creators_tier
  ON creators (tier);
CREATE INDEX IF NOT EXISTS idx_creators_gender
  ON creators (gender);
CREATE INDEX IF NOT EXISTS idx_creators_country
  ON creators (country);
CREATE INDEX IF NOT EXISTS idx_creators_age_range
  ON creators (age_range);

-- Sort indexes
CREATE INDEX IF NOT EXISTS idx_creators_total_followers
  ON creators (total_followers DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_creator_metrics_avg_rating
  ON creator_metrics (average_rating DESC NULLS LAST);

-- ============================================================
-- 4. Paginated catalog RPC with server-side filtering + sorting
-- ============================================================
CREATE OR REPLACE FUNCTION get_creator_catalog_page(
  p_limit INT DEFAULT 24,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL,
  p_niche TEXT DEFAULT NULL,
  p_tier TEXT DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_age_range TEXT DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  p_sort TEXT DEFAULT 'recent',
  p_favorite_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_results JSON;
  v_total BIGINT;
  v_search TEXT := NULLIF(TRIM(COALESCE(p_search, '')), '');
BEGIN
  -- Count total matching creators
  SELECT COUNT(*)
  INTO v_total
  FROM creators c
  JOIN users_profiles up ON up.user_id = c.user_id
  LEFT JOIN creator_metrics cm ON cm.creator_id = c.user_id
  WHERE
    (v_search IS NULL OR
      up.display_name ILIKE '%' || v_search || '%' OR
      c.bio ILIKE '%' || v_search || '%' OR
      c.city ILIKE '%' || v_search || '%')
    AND (p_niche IS NULL OR p_niche = ANY(c.niches))
    AND (p_tier IS NULL OR COALESCE(c.tier, 'starter') = p_tier)
    AND (p_gender IS NULL OR c.gender = p_gender)
    AND (p_country IS NULL OR c.country = p_country)
    AND (p_age_range IS NULL OR c.age_range = p_age_range)
    AND (p_min_rating IS NULL OR COALESCE(cm.average_rating, 0) >= p_min_rating)
    AND (p_favorite_ids IS NULL OR c.user_id = ANY(p_favorite_ids));

  -- Fetch page of results
  SELECT COALESCE(json_agg(row_data), '[]'::json)
  INTO v_results
  FROM (
    SELECT json_build_object(
      'user_id', c.user_id,
      'bio', c.bio,
      'city', c.city,
      'niches', c.niches,
      'tier', c.tier,
      'platforms', c.platforms,
      'gender', c.gender,
      'country', c.country,
      'age_range', c.age_range,
      'verified_at', c.verified_at,
      'created_at', c.created_at,
      'occupations', c.occupations,
      'portfolio_links', c.portfolio_links,
      'highlights', c.highlights,
      'total_followers', c.total_followers,
      'users_profiles', json_build_object(
        'display_name', up.display_name,
        'avatar_url', up.avatar_url,
        'language', up.language
      ),
      'creator_metrics', CASE WHEN cm.creator_id IS NOT NULL THEN
        json_build_array(json_build_object(
          'average_rating', cm.average_rating,
          'total_tasks', cm.total_tasks,
          'approval_rate', cm.approval_rate,
          'on_time_rate', cm.on_time_rate,
          'on_time_deliveries', cm.on_time_deliveries,
          'late_deliveries', cm.late_deliveries,
          'approved_tasks', cm.approved_tasks,
          'rejected_tasks', cm.rejected_tasks
        ))
      ELSE '[]'::json END,
      'portfolio_preview', COALESCE((
        SELECT json_agg(pi_obj)
        FROM (
          SELECT json_build_object(
            'id', pi.id,
            'media_url', pi.media_url,
            'media_type', pi.media_type,
            'title', pi.title
          ) AS pi_obj
          FROM portfolio_items pi
          WHERE pi.creator_id = c.user_id
          ORDER BY pi.created_at DESC
          LIMIT 5
        ) pi_sub
      ), '[]'::json)
    ) AS row_data
    FROM creators c
    JOIN users_profiles up ON up.user_id = c.user_id
    LEFT JOIN creator_metrics cm ON cm.creator_id = c.user_id
    WHERE
      (v_search IS NULL OR
        up.display_name ILIKE '%' || v_search || '%' OR
        c.bio ILIKE '%' || v_search || '%' OR
        c.city ILIKE '%' || v_search || '%')
      AND (p_niche IS NULL OR p_niche = ANY(c.niches))
      AND (p_tier IS NULL OR COALESCE(c.tier, 'starter') = p_tier)
      AND (p_gender IS NULL OR c.gender = p_gender)
      AND (p_country IS NULL OR c.country = p_country)
      AND (p_age_range IS NULL OR c.age_range = p_age_range)
      AND (p_min_rating IS NULL OR COALESCE(cm.average_rating, 0) >= p_min_rating)
      AND (p_favorite_ids IS NULL OR c.user_id = ANY(p_favorite_ids))
    ORDER BY
      CASE WHEN p_sort = 'rating' THEN COALESCE(cm.average_rating, 0) END DESC NULLS LAST,
      CASE WHEN p_sort = 'followers' THEN c.total_followers END DESC NULLS LAST,
      c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ) sub;

  RETURN json_build_object(
    'creators', v_results,
    'total', v_total,
    'hasMore', (p_offset + p_limit) < v_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_creator_catalog_page(INT, INT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, UUID[]) TO authenticated;

-- ============================================================
-- 5. Filter options RPC (distinct values for dropdowns)
-- ============================================================
CREATE OR REPLACE FUNCTION get_catalog_filter_options()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_countries JSON;
  v_age_ranges JSON;
BEGIN
  SELECT COALESCE(json_agg(val), '[]'::json)
  INTO v_countries
  FROM (SELECT DISTINCT country AS val FROM creators WHERE country IS NOT NULL AND country != '' ORDER BY country) sub;

  SELECT COALESCE(json_agg(val), '[]'::json)
  INTO v_age_ranges
  FROM (SELECT DISTINCT age_range AS val FROM creators WHERE age_range IS NOT NULL AND age_range != '' ORDER BY age_range) sub;

  RETURN json_build_object(
    'countries', v_countries,
    'ageRanges', v_age_ranges
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_catalog_filter_options() TO authenticated;
