import React from 'react';
import { useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { TutorialScene } from '../../components/TutorialScene';
import { StepCard } from '../../components/StepCard';
import { TextReveal } from '../../components/TextReveal';
import { ScreenMockup } from '../../components/ScreenMockup';

export const BrandDashboardTutorial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <TutorialScene
      title="לוח הבקרה של המותג"
      subtitle="ניהול מהיר וחכם של כל הפעילות שלך"
    >
      {/* Section 1: Overview */}
      <Sequence from={0} durationInFrames={8 * fps}>
        <div style={{ display: 'flex', gap: 30, marginTop: 20 }}>
          <div style={{ flex: 1 }}>
            <StepCard
              stepNumber={1}
              icon="📊"
              title="סטטיסטיקות מהירות"
              description="בחלק העליון של הדשבורד תראו סיכום מספרי: קמפיינים פעילים, בקשות ממתינות, תכנים לאישור ותשלומים"
              delay={10}
              highlight
            />
            <StepCard
              stepNumber={2}
              icon="🔔"
              title="התראות ופעולות"
              description="כרטיסי פעולה צבעוניים מראים מה דורש תשומת לב מיידית"
              delay={30}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <ScreenMockup delay={15} title="LEADERS Dashboard" scale={0.95}>
              <div style={{ direction: 'rtl', padding: 10 }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
                  {[
                    { label: 'קמפיינים פעילים', value: '3', color: '#f2cc0d' },
                    { label: 'בקשות ממתינות', value: '12', color: '#4ade80' },
                    { label: 'תכנים לאישור', value: '5', color: '#60a5fa' },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        background: '#2A2A2A',
                        borderRadius: 10,
                        padding: '12px 10px',
                        textAlign: 'center',
                        border: `1px solid ${stat.color}33`,
                      }}
                    >
                      <div style={{ color: stat.color, fontSize: 22, fontWeight: 800 }}>
                        {stat.value}
                      </div>
                      <div style={{ color: '#888', fontSize: 10, marginTop: 4 }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScreenMockup>
          </div>
        </div>
      </Sequence>

      {/* Section 2: Quick Actions */}
      <Sequence from={8 * fps} durationInFrames={8 * fps}>
        <TextReveal
          text="⚡ פעולות מהירות"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ display: 'flex', gap: 20, marginTop: 30 }}>
          <StepCard
            stepNumber={1}
            icon="➕"
            title="יצירת קמפיין חדש"
            description="לחצו על 'צור קמפיין' כדי להתחיל קמפיין חדש מאפס"
            delay={15}
            highlight
          />
          <StepCard
            stepNumber={2}
            icon="👁️"
            title="צפייה בבקשות"
            description="לחצו על כרטיס בקשה כדי לעבור ישירות לסקירת המשפיען"
            delay={30}
          />
        </div>
      </Sequence>

      {/* Section 3: Navigation */}
      <Sequence from={16 * fps} durationInFrames={14 * fps}>
        <TextReveal
          text="🧭 ניווט בממשק"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 30 }}>
          <StepCard
            stepNumber={1}
            icon="📊"
            title="לוח בקרה"
            description="מבט-על על הפעילות - כאן אתם נמצאים עכשיו"
            delay={15}
            highlight
          />
          <StepCard
            stepNumber={2}
            icon="🎯"
            title="הקמפיינים שלי"
            description="ניהול מלא של כל הקמפיינים - מכאן תנהלו הכל: משפיענים, תכנים, משלוחים ותשלומים"
            delay={30}
          />
        </div>
        <TextReveal
          text="💡 טיפ: כל הניהול נמצא תחת הקמפיין עצמו - אין צורך לנווט לעמודים נפרדים!"
          fontSize={16}
          color="#cbc190"
          delay={55}
          style={{ marginTop: 20 }}
        />
      </Sequence>
    </TutorialScene>
  );
};
