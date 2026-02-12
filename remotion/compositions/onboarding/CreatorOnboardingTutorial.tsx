import React from 'react';
import { useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { TutorialScene } from '../../components/TutorialScene';
import { StepCard } from '../../components/StepCard';
import { TextReveal } from '../../components/TextReveal';

export const CreatorOnboardingTutorial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <TutorialScene
      title="ברוכים הבאים, יוצרים!"
      subtitle="המדריך הראשון שלכם לפלטפורמת LEADERS"
    >
      {/* Section 1: First Steps */}
      <Sequence from={0} durationInFrames={10 * fps}>
        <TextReveal
          text=" הצעדים הראשונים"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={5}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon=""
            title="השלימו את הפרופיל"
            description="מלאו שם, תיאור, תמונה וקישורים לרשתות - מותגים בודקים את הפרופיל לפני אישור!"
            delay={15}
            highlight
          />
          <StepCard
            stepNumber={2}
            icon=""
            title="חברו רשתות חברתיות"
            description="הוסיפו Instagram, TikTok, YouTube - ככל שיש יותר, כך הסיכוי לאישור גדל"
            delay={35}
          />
          <StepCard
            stepNumber={3}
            icon=""
            title="גלשו בקמפיינים"
            description="חפשו קמפיינים שמתאימים לתחום ההתמחות שלכם"
            delay={55}
          />
        </div>
      </Sequence>

      {/* Section 2: Apply & Work */}
      <Sequence from={10 * fps} durationInFrames={10 * fps}>
        <TextReveal
          text=" הגשה ועבודה"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon=""
            title="הגישו בקשה"
            description="כתבו הודעה אישית למותג - הסבירו למה אתם הבחירה הנכונה"
            delay={15}
            highlight
          />
          <StepCard
            stepNumber={2}
            icon=""
            title="קבלו מוצרים"
            description="אם אושרתם - הזינו כתובת למשלוח ואשרו קבלת החבילה"
            delay={35}
          />
          <StepCard
            stepNumber={3}
            icon=""
            title="צרו תוכן"
            description="עבדו לפי הבריף, העלו תכנים, וקבלו פידבק מהמותג"
            delay={55}
          />
        </div>
      </Sequence>

      {/* Section 3: Growth */}
      <Sequence from={20 * fps} durationInFrames={10 * fps}>
        <TextReveal
          text=" צמיחה בפלטפורמה"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon="⭐"
            title="מערכת דירוגים"
            description="ככל שתשלימו יותר קמפיינים בהצלחה - הדירוג עולה ומותגים מגיעים אליכם!"
            delay={15}
          />
          <StepCard
            stepNumber={2}
            icon=""
            title="Bronze → Silver → Gold → Platinum"
            description="כל רמה פותחת קמפיינים בלעדיים עם תשלום גבוה יותר"
            delay={35}
            highlight
          />
          <StepCard
            stepNumber={3}
            icon=""
            title="תשלומים"
            description="אחרי אישור תוכן - התשלום מתבצע דרך הפלטפורמה. הכל מתועד ושקוף"
            delay={55}
          />
        </div>
        <TextReveal
          text=" בהצלחה! אנחנו כאן לעזור בכל שלב"
          fontSize={16}
          color="#cbc190"
          delay={70}
          style={{ marginTop: 20 }}
        />
      </Sequence>
    </TutorialScene>
  );
};
