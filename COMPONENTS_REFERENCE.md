# LEADERS - רשימת קומפוננטות

## Layout Components

### StageShell
מעטפת ראשית לכל הדפים.
```tsx
import { StageShell } from "@/components/layout/StageShell";

<StageShell>
  {children}
</StageShell>
```

### TopNav
תפריט עליון responsive עם תמיכה ב-RTL ותפקידים. במובייל מתגלה כתפריט המבורגר.
```tsx
import { TopNav } from "@/components/layout/TopNav";

<TopNav user={user} />
```

### DrawerPanel
פאנל צדדי נשלף (תומך RTL).
```tsx
import { DrawerPanel } from "@/components/layout/DrawerPanel";

<DrawerPanel isOpen={isOpen} onClose={handleClose} side="right">
  {content}
</DrawerPanel>
```

---

## UI Components

### Button
כפתור עם וריאנטים שונים.
```tsx
import { Button } from "@/components/ui/Button";

<Button variant="default">לחץ כאן</Button>
<Button variant="outline">מתאר</Button>
<Button variant="ghost">שקוף</Button>
```

### Card
כרטיס עם אפקט glass.
```tsx
import { Card } from "@/components/ui/Card";

<Card>
  {content}
</Card>
```

### Input
שדה קלט עם תווית ותמיכה בשגיאות.
```tsx
import { Input } from "@/components/ui/Input";

<Input 
  label="אימייל" 
  type="email" 
  value={email} 
  onChange={(e) => setEmail(e.target.value)} 
/>
```

---

## Creator Components

### EligibilityGateBanner
באנר המציג סטטוס נעילת משימות עם מעקב משלוח.
```tsx
import { EligibilityGateBanner } from "@/components/creator/EligibilityGateBanner";

<EligibilityGateBanner
  trackingNumber="1Z999AA10123456784"
  shipmentStatus="processing"
  progress={35}
/>
```

**Props:**
- `trackingNumber?: string` - מספר מעקב
- `shipmentStatus: "processing" | "shipped" | "delivered"` - סטטוס משלוח
- `progress: number` - אחוז התקדמות (0-100)
- `className?: string`

### LockedTaskCard
כרטיס משימה נעולה עם tooltip.
```tsx
import { LockedTaskCard } from "@/components/creator/LockedTaskCard";

<LockedTaskCard
  title="סרטון פתיחת אריזה"
  description="Instagram Reel • 30-60s"
  icon="videocam"
  lockReason='ממתין לסטטוס "נשלח"'
/>
```

**Props:**
- `title: string` - כותרת המשימה
- `description: string` - תיאור המשימה
- `icon: string` - שם אייקון Material Symbols
- `lockReason?: string` - סיבת הנעילה (ברירת מחדל: 'ממתין לסטטוס "נשלח"')
- `className?: string`

### ShipmentCard
כרטיס משלוח עם סטטוסים שונים ופעולות.
```tsx
import { ShipmentCard } from "@/components/creator/ShipmentCard";

<ShipmentCard
  brandName="Nike"
  brandLogo="https://..."
  campaignTitle="קמפיין ריצה קיץ 2024"
  productDescription="Air Zoom Pegasus 40"
  productImage="https://..."
  status="action_required"
  onAction={() => console.log("Action")}
/>
```

**Props:**
- `brandName: string` - שם המותג
- `brandLogo?: string` - לוגו המותג (אופציונלי)
- `campaignTitle: string` - כותרת הקמפיין
- `productDescription: string` - תיאור המוצר
- `productImage: string` - תמונת המוצר
- `status: "action_required" | "processing" | "shipped" | "delivered"` - סטטוס המשלוח
- `onAction?: () => void` - פעולה בלחיצה על הכפתור
- `className?: string`

**סטטוסים:**
- `action_required` - דרושה פעולה (כתום, אנימציה)
- `processing` - בעיבוד (אפור, נעול)
- `shipped` - נשלח (כחול, פעיל)
- `delivered` - נמסר (ירוק, הושלם)

### AddressCard
כרטיס כתובת עם אפשרות עריכה.
```tsx
import { AddressCard } from "@/components/creator/AddressCard";

<AddressCard
  label="מטה הסטודיו"
  name="ג'יין דו"
  addressLines={[
    "שד' היוצרים 101, דירה 4B",
    "לוס אנג'לס, CA 90028",
    "ארצות הברית"
  ]}
  isDefault={true}
  onEdit={() => console.log("Edit")}
/>
```

**Props:**
- `label: string` - תווית הכתובת
- `name: string` - שם המקבל
- `addressLines: string[]` - שורות הכתובת
- `isDefault?: boolean` - האם זו כתובת ברירת מחדל
- `onEdit?: () => void` - פעולת עריכה
- `className?: string`

---

## Hooks

### useUser
Hook למשתמש נוכחי עם תפקידים.
```tsx
import { useUser } from "@/hooks/use-user";

const { user, loading } = useUser();

if (loading) return <div>טוען...</div>;
if (!user) redirect("/auth/login");
```

**Returns:**
- `user: UserWithRole | null` - המשתמש הנוכחי
- `loading: boolean` - האם בטעינה

### useRealtime
Hook לעדכונים בזמן אמת.
```tsx
import { useRealtime } from "@/hooks/use-realtime";

const { data, loading } = useRealtime({
  table: "tasks",
  filter: { creator_id: user.id },
});
```

---

## Utilities

### cn (classnames)
פונקציה למיזוג class names.
```tsx
import { cn } from "@/lib/utils/cn";

<div className={cn(
  "base-class",
  isActive && "active-class",
  className
)} />
```

---

## עיצוב וצבעים

### צבעים ראשיים
```css
--primary: #f2cc0d (זהב)
--background-dark: #232010
--surface-dark: #2e2a1b
--border-dark: #494222
--text-muted: #cbc190
```

### Material Symbols
השתמש ב-Material Symbols Outlined:
```tsx
<span className="material-symbols-outlined">icon_name</span>
```

אייקונים נפוצים:
- `lock_clock` - נעילת זמן
- `local_shipping` - משלוח
- `videocam` - וידאו
- `rate_review` - ביקורת
- `tag` - תג
- `warning` - אזהרה
- `check_circle` - סימון
- `notifications` - התראות

---

## דוגמאות שימוש

### דף עם משימות נעולות
```tsx
import { EligibilityGateBanner } from "@/components/creator/EligibilityGateBanner";
import { LockedTaskCard } from "@/components/creator/LockedTaskCard";

export default function LockedTasksPage() {
  return (
    <div>
      <EligibilityGateBanner
        trackingNumber="1Z999AA10123456784"
        shipmentStatus="processing"
        progress={35}
      />
      
      <div className="grid gap-3">
        <LockedTaskCard
          title="סרטון פתיחת אריזה"
          description="Instagram Reel • 30-60s"
          icon="videocam"
        />
        <LockedTaskCard
          title="פוסט ביקורת"
          description="TikTok • >60s"
          icon="rate_review"
        />
      </div>
    </div>
  );
}
```

### דף ניהול משלוחים
```tsx
import { ShipmentCard } from "@/components/creator/ShipmentCard";
import { AddressCard } from "@/components/creator/AddressCard";

export default function ShippingPage() {
  return (
    <div>
      <AddressCard
        label="כתובת ראשית"
        name="ג'יין דו"
        addressLines={["רחוב 123", "תל אביב", "ישראל"]}
        isDefault={true}
        onEdit={() => {}}
      />
      
      <ShipmentCard
        brandName="Nike"
        campaignTitle="קמפיין קיץ"
        productDescription="נעלי ריצה"
        productImage="https://..."
        status="action_required"
        onAction={() => {}}
      />
    </div>
  );
}
```

---

## טיפים

1. **RTL Support**: כל הקומפוננטות תומכות ב-RTL אוטומטית דרך `next-intl`.
2. **Dark Mode**: כל הקומפוננטות מעוצבות ל-dark mode כברירת מחדל.
3. **Responsive**: כל הקומפוננטות responsive עם breakpoints של Tailwind.
4. **Accessibility**: השתמש ב-`aria-*` attributes כשצריך.
5. **Material Symbols**: טען את הפונט ב-`<head>` של הדף.

---

זהו! כל הקומפוננטות מוכנות לשימוש ומתועדות.
