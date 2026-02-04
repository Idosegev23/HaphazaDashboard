-- Migration: Simplify Pricing Model
-- מעבר ממודל טווח מחיר (min-max) למחיר קבוע יחיד
-- תאריך: 2026-02-04

BEGIN;

-- 1. הוספת עמודת מחיר קבוע לקמפיינים
ALTER TABLE public.campaigns
ADD COLUMN fixed_price NUMERIC(10, 2);

-- 2. העתקת נתונים קיימים (budget_min כברירת מחדל)
UPDATE public.campaigns
SET fixed_price = budget_min
WHERE budget_min IS NOT NULL;

-- 3. הסרת עמודות הטווח הישנות
ALTER TABLE public.campaigns
DROP COLUMN IF EXISTS budget_max,
DROP COLUMN IF EXISTS budget_min;

-- 4. הסרת עמודת המחיר המוצע מהמועמדות
-- (המשפיען כבר לא מציע מחיר, הוא מקבל את המחיר הקבוע)
ALTER TABLE public.applications
DROP COLUMN IF EXISTS proposed_price;

-- 5. עדכון payment_amount במשימות קיימות להיות מהמחיר הקבוע של הקמפיין
-- (במקרה שיש משימות קיימות)
UPDATE public.tasks t
SET payment_amount = c.fixed_price
FROM public.campaigns c
WHERE t.campaign_id = c.id
AND c.fixed_price IS NOT NULL
AND (t.payment_amount IS NULL OR t.payment_amount = 0);

-- 6. הוספת הערה למסד הנתונים
COMMENT ON COLUMN public.campaigns.fixed_price IS 'מחיר קבוע שהמותג מציע לכל משפיען - אין מו"מ על מחיר';

COMMIT;
