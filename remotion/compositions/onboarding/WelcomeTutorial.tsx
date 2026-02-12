import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  interpolate,
  spring,
} from 'remotion';
import { TutorialScene } from '../../components/TutorialScene';
import { StepCard } from '../../components/StepCard';
import { TextReveal } from '../../components/TextReveal';

export const WelcomeTutorial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  return (
    <TutorialScene showTitle={false}>
      {/* Section 1: Welcome */}
      <Sequence from={0} durationInFrames={10 * fps}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            direction: 'rtl',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: '#f2cc0d',
              transform: `scale(${logoScale})`,
              letterSpacing: 8,
              marginBottom: 20,
            }}
          >
            LEADERS
          </div>
          <TextReveal
            text="הפלטפורמה שמחברת מותגים ויוצרי תוכן"
            fontSize={28}
            color="#ffffff"
            fontWeight={600}
            align="center"
            delay={20}
          />
          <TextReveal
            text="ברוכים הבאים! בואו נכיר את הממשק"
            fontSize={20}
            color="#cbc190"
            align="center"
            delay={40}
          />
        </div>
      </Sequence>

      {/* Section 2: How it Works */}
      <Sequence from={10 * fps} durationInFrames={8 * fps}>
        <TextReveal
          text=" איך זה עובד?"
          fontSize={30}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
          align="center"
        />
        <div style={{ display: 'flex', gap: 20, marginTop: 30 }}>
          <StepCard
            stepNumber={1}
            icon=""
            title="מותג מפרסם קמפיין"
            description="מגדיר מטרה, מוצרים ותקציב"
            delay={15}
          />
          <StepCard
            stepNumber={2}
            icon=""
            title="יוצר מגיש בקשה"
            description="מגיש בקשה ומספר למה הוא מתאים"
            delay={30}
          />
          <StepCard
            stepNumber={3}
            icon=""
            title="שיתוף פעולה"
            description="מוצרים, תכנים ותשלום - הכל בפלטפורמה"
            delay={45}
          />
        </div>
      </Sequence>

      {/* Section 3: Get Started */}
      <Sequence from={18 * fps} durationInFrames={7 * fps}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            direction: 'rtl',
          }}
        >
          <TextReveal
            text=" בואו נתחיל!"
            fontSize={36}
            color="#f2cc0d"
            fontWeight={800}
            align="center"
            delay={0}
          />
          <TextReveal
            text="בכל עמוד תוכלו ללחוץ על כפתור העזרה לצפייה במדריך"
            fontSize={20}
            color="#cbc190"
            align="center"
            delay={20}
          />
          <TextReveal
            text="אפשר לסמן 'אל תציג שוב' כדי שלא יופיע אוטומטית"
            fontSize={18}
            color="#888"
            align="center"
            delay={35}
          />
        </div>
      </Sequence>
    </TutorialScene>
  );
};
