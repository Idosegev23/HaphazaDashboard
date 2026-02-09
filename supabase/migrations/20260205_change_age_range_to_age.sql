-- Migration: Change age_range (text) to age (integer)
-- תאריך: 2026-02-05
-- שינוי: משפיענים יכתבו את הגיל שלהם במספר מדויק במקום טווח

BEGIN;

-- הוספת עמודת age חדשה
ALTER TABLE public.creators
ADD COLUMN age INTEGER;

-- ניסיון להעתיק נתונים קיימים (אם age_range מכיל מספר)
-- למשל "25" או "18-24" -> ניקח את המספר הראשון
UPDATE public.creators
SET age = CAST(
  NULLIF(
    regexp_replace(age_range, '[^0-9].*$', ''),
    ''
  ) AS INTEGER
)
WHERE age_range IS NOT NULL
  AND age_range ~ '^[0-9]+';

-- הסרת עמודת age_range הישנה
ALTER TABLE public.creators
DROP COLUMN IF EXISTS age_range;

-- הוספת הערה
COMMENT ON COLUMN public.creators.age IS 'גיל המשפיען במספר מדויק (לא טווח)';

-- הוספת אילוץ סביר (גילאים 13-120)
ALTER TABLE public.creators
ADD CONSTRAINT age_reasonable_range CHECK (age IS NULL OR (age >= 13 AND age <= 120));

COMMIT;
