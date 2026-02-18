-- RPC function to get detailed creator profile data for the brand modal
-- Uses SECURITY DEFINER to bypass RLS on ratings/tasks tables
-- Returns only aggregated/anonymized data safe for brand viewing

CREATE OR REPLACE FUNCTION get_creator_profile_details(p_creator_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rating_breakdown JSON;
  v_reviews JSON;
  v_task_summary JSON;
BEGIN
  -- Rating breakdown (averages across all ratings for this creator's tasks)
  SELECT json_build_object(
    'quality', COALESCE(ROUND(AVG(r.quality)::numeric, 1), 0),
    'communication', COALESCE(ROUND(AVG(r.communication)::numeric, 1), 0),
    'on_time', COALESCE(ROUND(AVG(r.on_time)::numeric, 1), 0),
    'revision', COALESCE(ROUND(AVG(r.revision)::numeric, 1), 0),
    'totalRatings', COUNT(r.id)
  ) INTO v_rating_breakdown
  FROM ratings r
  JOIN tasks t ON r.task_id = t.id
  WHERE t.creator_id = p_creator_id;

  -- Recent reviews with notes (anonymized, last 5)
  SELECT COALESCE(json_agg(review_row), '[]'::json)
  INTO v_reviews
  FROM (
    SELECT
      r.note,
      r.quality,
      r.created_at
    FROM ratings r
    JOIN tasks t ON r.task_id = t.id
    WHERE t.creator_id = p_creator_id
      AND r.note IS NOT NULL
      AND r.note != ''
    ORDER BY r.created_at DESC
    LIMIT 5
  ) review_row;

  -- Task summary (no earnings for privacy)
  SELECT json_build_object(
    'total', COUNT(*),
    'approved', COUNT(*) FILTER (WHERE status IN ('approved', 'paid')),
    'inProgress', COUNT(*) FILTER (WHERE status IN ('in_production', 'uploaded', 'needs_edits')),
    'disputed', COUNT(*) FILTER (WHERE status = 'disputed')
  ) INTO v_task_summary
  FROM tasks
  WHERE creator_id = p_creator_id;

  RETURN json_build_object(
    'ratingBreakdown', v_rating_breakdown,
    'reviews', v_reviews,
    'taskSummary', v_task_summary
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_creator_profile_details(UUID) TO authenticated;
