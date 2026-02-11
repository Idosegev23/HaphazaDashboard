import React from 'react';
import { useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { TutorialScene } from '../../components/TutorialScene';
import { StepCard } from '../../components/StepCard';
import { TextReveal } from '../../components/TextReveal';

export const BrandOnboardingTutorial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <TutorialScene
      title="ברוכים הבאים, מותגים!"
      subtitle="המדריך הראשון שלכם לפלטפורמת LEADERS"
    >
      {/* Section 1: First Steps */}
      <Sequence from={0} durationInFrames={10 * fps}>
        <TextReveal
          text="📌 הצעדים הראשונים"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={5}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon="🏢"
            title="מלאו את פרטי המותג"
            description="שם המותג, תיאור, לוגו ולינקים - ככל שהפרופיל מלא יותר, כך משפיענים ירגישו בטוחים יותר"
            delay={15}
            highlight
          />
          <StepCard
            stepNumber={2}
            icon="🎯"
            title="צרו את הקמפיין הראשון"
            description="לכו ל'הקמפיינים שלי' > 'צור קמפיין חדש' - הגדירו מטרה, מוצרים ותקציב"
            delay={35}
          />
          <StepCard
            stepNumber={3}
            icon="🚀"
            title="פרסמו!"
            description="אחרי שמילאתם הכל - לחצו 'פרסם' כדי שמשפיענים יתחילו להגיש בקשות"
            delay={55}
          />
        </div>
      </Sequence>

      {/* Section 2: Managing */}
      <Sequence from={10 * fps} durationInFrames={10 * fps}>
        <TextReveal
          text="⚙️ ניהול שוטף"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon="👥"
            title="סקרו בקשות"
            description="כל בקשה כוללת פרופיל המשפיען, סטטיסטיקות והודעה אישית"
            delay={15}
          />
          <StepCard
            stepNumber={2}
            icon="💰"
            title="תמחרו בגמישות"
            description="אפשר לקבוע מחיר קבוע לכולם או מחיר מותאם לכל משפיען"
            delay={35}
            highlight
          />
          <StepCard
            stepNumber={3}
            icon="📊"
            title="עקבו מהדשבורד"
            description="לוח הבקרה מראה סטטיסטיקות בזמן אמת על כל הקמפיינים"
            delay={55}
          />
        </div>
      </Sequence>

      {/* Section 3: Full Flow */}
      <Sequence from={20 * fps} durationInFrames={10 * fps}>
        <TextReveal
          text="🔄 הזרימה המלאה"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon="📋"
            title="קמפיין → בקשות → אישור"
            description="פרסום הקמפיין, קבלת בקשות ממשפיענים, סקירה ואישור"
            delay={15}
          />
          <StepCard
            stepNumber={2}
            icon="📦"
            title="משלוח → יצירה → אישור תוכן"
            description="שליחת מוצרים, המשפיען יוצר תוכן, אתם מאשרים או מבקשים שינוי"
            delay={35}
          />
          <StepCard
            stepNumber={3}
            icon="💰"
            title="תשלום"
            description="לאחר אישור התוכן - ניהול ותיעוד התשלום בפלטפורמה"
            delay={55}
            highlight
          />
        </div>
      </Sequence>
    </TutorialScene>
  );
};
