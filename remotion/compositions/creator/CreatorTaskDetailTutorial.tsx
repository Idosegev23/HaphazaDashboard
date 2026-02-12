import React from 'react';
import { useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { TutorialScene } from '../../components/TutorialScene';
import { StepCard } from '../../components/StepCard';
import { TextReveal } from '../../components/TextReveal';

export const CreatorTaskDetailTutorial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <TutorialScene
      title="עבודה על משימה"
      subtitle="איך להעלות תכנים, לעקוב אחרי דרישות ולהשלים"
    >
      {/* Section 1: Task Overview */}
      <Sequence from={0} durationInFrames={10 * fps}>
        <TextReveal
          text=" מבנה המשימה"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={5}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon=""
            title="בריף הקמפיין"
            description="בחלק העליון תמצאו את כל ההנחיות: מטרת הקמפיין, סגנון רצוי, דו-אנד-דונטס"
            delay={15}
            highlight
          />
          <StepCard
            stepNumber={2}
            icon=""
            title="רשימת Deliverables"
            description="פירוט מה בדיוק צריך ליצור: סרטון TikTok, פוסט Instagram, סטורי וכו'"
            delay={35}
          />
          <StepCard
            stepNumber={3}
            icon=""
            title="דדליין"
            description="מועד ההגשה הסופי - הקפידו להעלות לפני התאריך!"
            delay={55}
          />
        </div>
      </Sequence>

      {/* Section 2: Upload Content */}
      <Sequence from={10 * fps} durationInFrames={12 * fps}>
        <TextReveal
          text=" העלאת תכנים"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon=""
            title="בחרו קובץ"
            description="לחצו על כפתור ההעלאה ובחרו תמונה או סרטון מהמחשב שלכם"
            delay={15}
            highlight
          />
          <StepCard
            stepNumber={2}
            icon=""
            title="הוסיפו הערות"
            description="כתבו הערה או הסבר - למשל, 'גרסה ראשונה' או 'לפי הבריף המעודכן'"
            delay={35}
          />
          <StepCard
            stepNumber={3}
            icon=""
            title="שלחו לאישור"
            description="הקובץ נשלח למותג לסקירה. תקבלו התראה כשיהיה פידבק"
            delay={55}
          />
        </div>
      </Sequence>

      {/* Section 3: Revisions */}
      <Sequence from={22 * fps} durationInFrames={13 * fps}>
        <TextReveal
          text=" תיקונים ועדכונים"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon=""
            title="פידבק מהמותג"
            description="אם המותג מבקש שינויים, ההערות יופיעו כאן"
            delay={15}
          />
          <StepCard
            stepNumber={2}
            icon=""
            title="העלאת גרסה מתוקנת"
            description="העלו את הגרסה החדשה - המותג יראה את כל הגרסאות"
            delay={35}
            highlight
          />
          <StepCard
            stepNumber={3}
            icon=""
            title="אושר!"
            description="כשהתוכן מאושר - המשימה עוברת לסטטוס 'הושלם' והתשלום מתחיל"
            delay={55}
          />
        </div>
        <TextReveal
          text=" טיפ: שימרו על גרסאות מסודרות - זה עוזר גם לכם וגם למותג"
          fontSize={16}
          color="#cbc190"
          delay={70}
          style={{ marginTop: 20 }}
        />
      </Sequence>
    </TutorialScene>
  );
};
