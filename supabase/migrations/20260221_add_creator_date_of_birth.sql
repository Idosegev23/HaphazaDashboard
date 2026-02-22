-- Add date_of_birth column to creators table
-- This is the creator's actual birth date (separate from age_range which is target audience)
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Update the RPC to return date_of_birth and support p_city filter
CREATE OR REPLACE FUNCTION get_creator_catalog_page(
  p_limit INT DEFAULT 24,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL,
  p_niche TEXT DEFAULT NULL,
  p_tier TEXT DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_age_range TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
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
    AND (p_city IS NULL OR c.city = p_city)
    AND (p_min_rating IS NULL OR COALESCE(cm.average_rating, 0) >= p_min_rating)
    AND (p_favorite_ids IS NULL OR c.user_id = ANY(p_favorite_ids));

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
      'date_of_birth', c.date_of_birth,
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
      AND (p_city IS NULL OR c.city = p_city)
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

-- Update filter options to include cities
CREATE OR REPLACE FUNCTION get_catalog_filter_options()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_countries JSON;
  v_age_ranges JSON;
  v_cities JSON;
BEGIN
  SELECT COALESCE(json_agg(val), '[]'::json)
  INTO v_countries
  FROM (SELECT DISTINCT country AS val FROM creators WHERE country IS NOT NULL AND country != '' ORDER BY country) sub;

  SELECT COALESCE(json_agg(val), '[]'::json)
  INTO v_age_ranges
  FROM (SELECT DISTINCT age_range AS val FROM creators WHERE age_range IS NOT NULL AND age_range != '' ORDER BY age_range) sub;

  SELECT COALESCE(json_agg(val), '[]'::json)
  INTO v_cities
  FROM (SELECT DISTINCT city AS val FROM creators WHERE city IS NOT NULL AND city != '' ORDER BY city) sub;

  RETURN json_build_object(
    'countries', v_countries,
    'ageRanges', v_age_ranges,
    'cities', v_cities
  );
END;
$$;
