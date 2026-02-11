# בדיקת בעיית התשלום - 100 vs 98 ש"ח

## תיאור הבעיה
QA דיווח שמותג הגדיר 100 ש"ח אבל המשפיען רואה 98 ש"ח.

## ממצאי בדיקת הקוד

### 1. יצירת משימה (שורה 226 ב-`app/brand/applications/[id]/page.tsx`)
```typescript
payment_amount: appData.campaigns?.fixed_price || 0,
```

**ממצא:** הקוד מעתיק את `fixed_price` מהקמפיין ישירות ל-`payment_amount` של המשימה. **אין שום ניכוי או חישוב!**

### 2. חיפוש קוד אחר עמלות/הנחות
חיפשתי את המילים: `commission`, `discount`, `fee`, `עמלה`

**ממצא:** אין שום אזכור של עמלות או הנחות בכל הקוד!

### 3. תהליך יצירת התשלום (שורה 281 ב-`app/brand/tasks/[id]/page.tsx`)
```typescript
const paymentAmount = task?.payment_amount || 0;
```

**ממצא:** כשהמותג מאשר תוכן, הקוד לוקח את `payment_amount` ישירות מהמשימה, בלי שינויים.

---

## מסקנות

**הקוד תקין!** אין שום מקום בקוד שמפחית את הסכום מ-100 ל-98.

האפשרויות היחידות:
1. ❌ **טעות בהזנת נתונים:** המותג הזין 98 ולא 100 (או מישהו ערך את הנתונים ידנית ב-DB)
2. ❌ **בעיה בנתונים קיימים:** אם הבעיה נצפתה בדאטה ישנה לפני תיקוני הקוד האחרונים

---

## 🔍 שאילתות בדיקה ל-Supabase

### שאילתה 1: בדוק את הקמפיין
```sql
SELECT 
  id,
  title,
  fixed_price,
  created_at
FROM campaigns
WHERE fixed_price = 100 OR fixed_price = 98
ORDER BY created_at DESC
LIMIT 5;
```

### שאילתה 2: בדוק את המשימות
```sql
SELECT 
  t.id,
  t.title,
  t.payment_amount as task_payment,
  c.fixed_price as campaign_price,
  c.title as campaign_title
FROM tasks t
JOIN campaigns c ON c.id = t.campaign_id
WHERE t.payment_amount != c.fixed_price
  OR t.payment_amount IN (98, 100)
  OR c.fixed_price IN (98, 100)
ORDER BY t.created_at DESC
LIMIT 10;
```

### שאילתה 3: בדוק אי-התאמות בין קמפיין למשימה
```sql
SELECT 
  t.id,
  t.title,
  t.payment_amount,
  c.fixed_price,
  ABS(t.payment_amount - c.fixed_price) as difference
FROM tasks t
JOIN campaigns c ON c.id = t.campaign_id
WHERE t.payment_amount != c.fixed_price
ORDER BY difference DESC
LIMIT 10;
```

---

## ✅ המלצות

1. **הרץ את השאילתות לעיל** ב-Supabase SQL Editor כדי לזהות את המקור של הבעיה
2. **אם יש נתונים ישנים עם אי-התאמה**, הרץ:
   ```sql
   -- תיקון אוטומטי של כל המשימות
   UPDATE tasks t
   SET payment_amount = c.fixed_price
   FROM campaigns c
   WHERE t.campaign_id = c.id
     AND t.payment_amount != c.fixed_price;
   ```
3. **וודא שאין שינויים ידניים** לנתונים בעתיד
4. **צור משימה חדשה** לאחר התיקונים ובדוק שהסכום נכון

---

## 🔐 הגנה עתידית

כדי למנוע בעיות כאלה בעתיד, ניתן להוסיף CHECK CONSTRAINT:

```sql
-- הוספת constraint שבודק שה-payment_amount תואם ל-fixed_price
ALTER TABLE tasks
ADD CONSTRAINT check_payment_matches_campaign
CHECK (
  payment_amount IS NULL 
  OR payment_amount = (
    SELECT fixed_price 
    FROM campaigns 
    WHERE id = tasks.campaign_id
  )
);
```

**אזהרה:** ה-constraint הזה עלול לגרום לבעיות אם רוצים גמישות לשנות מחירים למשימות ספציפיות.
