import React from 'react';
import { useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { TutorialScene } from '../../components/TutorialScene';
import { StepCard } from '../../components/StepCard';
import { TextReveal } from '../../components/TextReveal';
import { ScreenMockup } from '../../components/ScreenMockup';

export const CreatorCampaignsTutorial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <TutorialScene
      title="גלישה בקמפיינים"
      subtitle="איך למצוא קמפיינים שמתאימים לך ולהגיש בקשה"
    >
      {/* Section 1: Browse */}
      <Sequence from={0} durationInFrames={10 * fps}>
        <div style={{ display: 'flex', gap: 30, marginTop: 10 }}>
          <div style={{ flex: 1 }}>
            <StepCard
              stepNumber={1}
              icon=""
              title="עיון בקמפיינים"
              description="כל הקמפיינים הפתוחים מוצגים כאן עם פרטים: מותג, מטרה, תקציב ודדליין"
              delay={10}
              highlight
            />
            <StepCard
              stepNumber={2}
              icon=""
              title="פרטי הקמפיין"
              description="לחצו על קמפיין כדי לראות את הבריף המלא, המוצרים והדרישות"
              delay={35}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <ScreenMockup delay={15} title="קמפיינים זמינים">
              <div style={{ direction: 'rtl' }}>
                {['קמפיין שמפו טבעי', 'קמפיין ספורט קיץ', 'קמפיין אופנה'].map((name, i) => (
                  <div
                    key={i}
                    style={{
                      background: i === 0 ? 'rgba(242, 204, 13, 0.08)' : '#f8f9fa',
                      borderRadius: 10,
                      padding: '10px 14px',
                      marginBottom: 8,
                      border: i === 0 ? '1px solid #f2cc0d44' : '1px solid #333',
                    }}
                  >
                    <div style={{ color: '#212529', fontSize: 13, fontWeight: 600 }}>{name}</div>
                    <div style={{ color: '#6c757d', fontSize: 10, marginTop: 4 }}>
                      {i === 0 ? '₪500 · 7 ימים' : i === 1 ? '₪800 · 14 ימים' : 'גמיש · 30 ימים'}
                    </div>
                  </div>
                ))}
              </div>
            </ScreenMockup>
          </div>
        </div>
      </Sequence>

      {/* Section 2: Apply */}
      <Sequence from={10 * fps} durationInFrames={10 * fps}>
        <TextReveal
          text=" הגשת בקשה"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon="️"
            title="כתבו למה אתם מתאימים"
            description="הסבירו למותג למה בחרתם בקמפיין ומה הערך שאתם יכולים להביא"
            delay={15}
            highlight
          />
          <StepCard
            stepNumber={2}
            icon=""
            title="קישורים ודוגמאות"
            description="הוסיפו קישורים לעבודות קודמות או תיק עבודות - זה מגדיל סיכויי אישור!"
            delay={35}
          />
          <StepCard
            stepNumber={3}
            icon=""
            title="שלחו את הבקשה"
            description="לחצו 'שלח בקשה' - המותג יקבל התראה ויסקור אותה"
            delay={55}
          />
        </div>
      </Sequence>

      {/* Section 3: After Applying */}
      <Sequence from={20 * fps} durationInFrames={10 * fps}>
        <TextReveal
          text="⏳ מה קורה אחרי?"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon=""
            title="ממתין לתשובה"
            description="הבקשה שלכם ממתינה אצל המותג. תקבלו התראה ברגע שיהיה עדכון"
            delay={15}
          />
          <StepCard
            stepNumber={2}
            icon=""
            title="אושר!"
            description="אם אושרתם - תיפתח משימה חדשה עם כל ההנחיות. מוצרים יישלחו אליכם"
            delay={35}
            highlight
          />
          <StepCard
            stepNumber={3}
            icon=""
            title="נדחה"
            description="לא נורא - המשיכו לגלוש בקמפיינים אחרים ולהגיש בקשות"
            delay={50}
          />
        </div>
      </Sequence>
    </TutorialScene>
  );
};
