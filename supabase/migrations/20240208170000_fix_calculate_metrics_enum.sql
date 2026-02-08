-- Fix calculate_creator_metrics function to avoid enum error
-- "rejected" is not a valid task_status, so we use "disputed" instead

CREATE OR REPLACE FUNCTION calculate_creator_metrics(p_creator_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_tasks INTEGER;
    v_approved_tasks INTEGER;
    v_rejected_tasks INTEGER;
    v_on_time_deliveries INTEGER;
    v_late_deliveries INTEGER;
    v_approval_rate NUMERIC(5, 2);
    v_on_time_rate NUMERIC(5, 2);
    v_average_rating NUMERIC(3, 2);
    v_current_tier TEXT;
BEGIN
    -- חישוב סטטיסטיקות משימות
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'approved' OR status = 'paid'),
        COUNT(*) FILTER (WHERE status = 'disputed') -- Changed from 'rejected' to 'disputed'
    INTO v_total_tasks, v_approved_tasks, v_rejected_tasks
    FROM tasks
    WHERE creator_id = p_creator_id;

    -- חישוב עמידה בזמנים (סימולציה - צריך לעדכן לפי לוגיקה אמיתית)
    SELECT 
        COUNT(*) FILTER (WHERE status = 'approved' AND updated_at <= due_at),
        COUNT(*) FILTER (WHERE status = 'approved' AND updated_at > due_at)
    INTO v_on_time_deliveries, v_late_deliveries
    FROM tasks
    WHERE creator_id = p_creator_id AND due_at IS NOT NULL;

    -- חישוב אחוזים
    v_approval_rate := CASE 
        WHEN v_total_tasks > 0 THEN ROUND((v_approved_tasks::NUMERIC / v_total_tasks::NUMERIC) * 100, 2)
        ELSE 0
    END;

    v_on_time_rate := CASE 
        WHEN (v_on_time_deliveries + v_late_deliveries) > 0 
        THEN ROUND((v_on_time_deliveries::NUMERIC / (v_on_time_deliveries + v_late_deliveries)::NUMERIC) * 100, 2)
        ELSE 0
    END;

    -- חישוב דירוג ממוצע
    SELECT ROUND(AVG((quality + on_time + communication) / 3.0), 2)
    INTO v_average_rating
    FROM ratings r
    JOIN tasks t ON r.task_id = t.id
    WHERE t.creator_id = p_creator_id;

    v_average_rating := COALESCE(v_average_rating, 0);

    -- קביעת Tier לפי מספר משימות מאושרות
    v_current_tier := CASE
        WHEN v_approved_tasks >= 50 THEN 'platinum'
        WHEN v_approved_tasks >= 20 THEN 'gold'
        WHEN v_approved_tasks >= 10 THEN 'silver'
        WHEN v_approved_tasks >= 5 THEN 'bronze'
        ELSE 'novice'
    END;

    -- עדכון או יצירת רשומת מדדים
    INSERT INTO creator_metrics (
        creator_id,
        total_tasks,
        approved_tasks,
        rejected_tasks,
        on_time_deliveries,
        late_deliveries,
        approval_rate,
        on_time_rate,
        average_rating,
        last_updated
    ) VALUES (
        p_creator_id,
        v_total_tasks,
        v_approved_tasks,
        v_rejected_tasks,
        v_on_time_deliveries,
        v_late_deliveries,
        v_approval_rate,
        v_on_time_rate,
        v_average_rating,
        NOW()
    )
    ON CONFLICT (creator_id) DO UPDATE SET
        total_tasks = v_total_tasks,
        approved_tasks = v_approved_tasks,
        rejected_tasks = v_rejected_tasks,
        on_time_deliveries = v_on_time_deliveries,
        late_deliveries = v_late_deliveries,
        approval_rate = v_approval_rate,
        on_time_rate = v_on_time_rate,
        average_rating = v_average_rating,
        last_updated = NOW();

    -- עדכון tier במשפיען
    UPDATE creators
    SET tier = v_current_tier
    WHERE user_id = p_creator_id;
END;
$$;
