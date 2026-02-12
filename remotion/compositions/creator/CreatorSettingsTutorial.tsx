import React from 'react';
import { useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { TutorialScene } from '../../components/TutorialScene';
import { StepCard } from '../../components/StepCard';
import { TextReveal } from '../../components/TextReveal';

export const CreatorSettingsTutorial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <TutorialScene
      title="הגדרות פרופיל"
      subtitle="עדכנו את הפרופיל, הפלטפורמות והרשתות החברתיות"
    >
      {/* Section 1: Profile */}
      <Sequence from={0} durationInFrames={10 * fps}>
        <TextReveal
          text=" פרטים אישיים"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={5}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon=""
            title="תמונת פרופיל"
            description="העלו תמונה מקצועית - מותגים רואים אותה כשסוקרים את הבקשה שלכם"
            delay={15}
            highlight
          />
          <StepCard
            stepNumber={2}
            icon="️"
            title="שם ותיאור"
            description="עדכנו את השם המלא וכתבו ביו קצר על עצמכם ותחומי ההתמחות"
            delay={35}
          />
        </div>
      </Sequence>

      {/* Section 2: Social Links */}
      <Sequence from={10 * fps} durationInFrames={8 * fps}>
        <TextReveal
          text=" רשתות חברתיות"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon=""
            title="Instagram"
            description="הוסיפו את שם המשתמש שלכם באינסטגרם"
            delay={15}
          />
          <StepCard
            stepNumber={2}
            icon=""
            title="TikTok"
            description="קישור לפרופיל TikTok - קריטי לקמפיינים של וידאו קצר"
            delay={30}
            highlight
          />
          <StepCard
            stepNumber={3}
            icon=""
            title="YouTube"
            description="אם יש לכם ערוץ - הוסיפו את הקישור"
            delay={45}
          />
        </div>
      </Sequence>

      {/* Section 3: Tips */}
      <Sequence from={18 * fps} durationInFrames={7 * fps}>
        <TextReveal
          text="⭐ טיפים לפרופיל מנצח"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon=""
            title="מלאו הכל"
            description="פרופיל מלא מגדיל את הסיכוי לאישור ב-3x לפחות"
            delay={15}
            highlight
          />
          <StepCard
            stepNumber={2}
            icon=""
            title="עדכנו באופן קבוע"
            description="כשהנתונים שלכם גדלים - עדכנו! מותגים בודקים מספרים"
            delay={30}
          />
        </div>
        <TextReveal
          text=" כל שינוי נשמר אוטומטית - אין צורך ללחוץ 'שמור'"
          fontSize={16}
          color="#cbc190"
          delay={45}
          style={{ marginTop: 20 }}
        />
      </Sequence>
    </TutorialScene>
  );
};
