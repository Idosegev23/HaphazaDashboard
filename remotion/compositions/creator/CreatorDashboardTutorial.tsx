import React from 'react';
import { useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { TutorialScene } from '../../components/TutorialScene';
import { StepCard } from '../../components/StepCard';
import { TextReveal } from '../../components/TextReveal';
import { ScreenMockup } from '../../components/ScreenMockup';

export const CreatorDashboardTutorial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <TutorialScene
      title="לוח הבקרה של היוצר"
      subtitle="מבט-על על הפעילות, הדירוג והמשימות שלך"
    >
      {/* Section 1: Tier & Stats */}
      <Sequence from={0} durationInFrames={10 * fps}>
        <div style={{ display: 'flex', gap: 30, marginTop: 10 }}>
          <div style={{ flex: 1 }}>
            <StepCard
              stepNumber={1}
              icon=""
              title="דירוג (Tier)"
              description="הדירוג שלך מוצג בחלק העליון - ככל שתשלימו יותר קמפיינים בהצלחה, הדירוג עולה!"
              delay={10}
              highlight
            />
            <StepCard
              stepNumber={2}
              icon=""
              title="מדדים"
              description="מספר קמפיינים שהשתתפתם, אחוז אישור, ותכנים שהועלו"
              delay={35}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <ScreenMockup delay={15} title="LEADERS Creator">
              <div style={{ direction: 'rtl', textAlign: 'center', padding: 10 }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, #f2cc0d, #d4a30a)',
                    borderRadius: 12,
                    padding: '12px 20px',
                    display: 'inline-block',
                    marginBottom: 12,
                  }}
                >
                  <div style={{ color: '#ffffff', fontSize: 12, fontWeight: 700 }}>TIER</div>
                  <div style={{ color: '#ffffff', fontSize: 24, fontWeight: 900 }}>Silver</div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  {[
                    { label: 'קמפיינים', value: '8' },
                    { label: 'אישורים', value: '92%' },
                    { label: 'תכנים', value: '24' },
                  ].map((s, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#f8f9fa',
                        borderRadius: 8,
                        padding: '8px 14px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ color: '#f2cc0d', fontSize: 16, fontWeight: 800 }}>{s.value}</div>
                      <div style={{ color: '#6c757d', fontSize: 9 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </ScreenMockup>
          </div>
        </div>
      </Sequence>

      {/* Section 2: Recent Activity */}
      <Sequence from={10 * fps} durationInFrames={8 * fps}>
        <TextReveal
          text=" פעילות אחרונה"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon=""
            title="התראות"
            description="תראו כאן בקשות שאושרו, משימות חדשות, ותגובות ממותגים"
            delay={15}
            highlight
          />
          <StepCard
            stepNumber={2}
            icon="⏰"
            title="דדליינים"
            description="משימות עם מועד הגשה קרוב מודגשות - אל תפספסו!"
            delay={35}
          />
        </div>
      </Sequence>

      {/* Section 3: Quick Navigation */}
      <Sequence from={18 * fps} durationInFrames={12 * fps}>
        <TextReveal
          text=" לאן ממשיכים?"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ display: 'flex', gap: 15, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            { icon: '', title: 'קמפיינים', desc: 'חפשו והגישו בקשות' },
            { icon: '', title: 'משימות', desc: 'עבדו על תכנים' },
            { icon: '', title: 'משלוחים', desc: 'כתובת ואישור' },
            { icon: '️', title: 'הגדרות', desc: 'פרופיל ורשתות' },
          ].map((item, i) => (
            <StepCard
              key={i}
              stepNumber={i + 1}
              icon={item.icon}
              title={item.title}
              description={item.desc}
              delay={15 + i * 15}
              highlight={i === 0}
            />
          ))}
        </div>
      </Sequence>
    </TutorialScene>
  );
};
