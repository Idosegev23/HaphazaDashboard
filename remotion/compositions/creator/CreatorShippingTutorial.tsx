import React from 'react';
import { useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { TutorialScene } from '../../components/TutorialScene';
import { StepCard } from '../../components/StepCard';
import { TextReveal } from '../../components/TextReveal';
import { ScreenMockup } from '../../components/ScreenMockup';

export const CreatorShippingTutorial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <TutorialScene
      title="משלוחים וקבלת מוצרים"
      subtitle="איך למסור כתובת, לעקוב ולאשר קבלת משלוח"
    >
      {/* Section 1: Address */}
      <Sequence from={0} durationInFrames={10 * fps}>
        <div style={{ display: 'flex', gap: 30, marginTop: 10 }}>
          <div style={{ flex: 1 }}>
            <StepCard
              stepNumber={1}
              icon="📍"
              title="הזנת כתובת"
              description="כשאושרתם לקמפיין שדורש משלוח - מלאו את הכתובת המלאה: רחוב, מספר בית, עיר ומיקוד"
              delay={10}
              highlight
            />
            <StepCard
              stepNumber={2}
              icon="📱"
              title="פרטי קשר"
              description="ודאו שמספר הטלפון נכון - חברת המשלוח תשתמש בו"
              delay={35}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <ScreenMockup delay={15} title="משלוחים">
              <div style={{ direction: 'rtl' }}>
                <div
                  style={{
                    background: 'rgba(242, 204, 13, 0.08)',
                    border: '1px solid #f2cc0d44',
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ color: '#f2cc0d', fontSize: 12, fontWeight: 700 }}>
                    ⏳ ממתין לכתובת
                  </div>
                  <div style={{ color: '#fff', fontSize: 11, marginTop: 4 }}>
                    קמפיין שמפו טבעי
                  </div>
                </div>
                <div
                  style={{
                    background: '#2A2A2A',
                    borderRadius: 8,
                    padding: 10,
                    fontSize: 11,
                    color: '#888',
                  }}
                >
                  <div>שם מלא: ________</div>
                  <div>רחוב: ________</div>
                  <div>עיר: ________</div>
                </div>
              </div>
            </ScreenMockup>
          </div>
        </div>
      </Sequence>

      {/* Section 2: Tracking */}
      <Sequence from={10 * fps} durationInFrames={10 * fps}>
        <TextReveal
          text="📦 מעקב משלוח"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon="📬"
            title="הכתובת נשלחה"
            description="אחרי ששלחתם כתובת, הסטטוס משתנה ל'ממתין למשלוח'"
            delay={15}
          />
          <StepCard
            stepNumber={2}
            icon="🚚"
            title="נשלח!"
            description="כשהמותג שולח את המוצר, תקבלו מספר מעקב (אם זמין)"
            delay={35}
            highlight
          />
          <StepCard
            stepNumber={3}
            icon="📱"
            title="עקבו אחרי המשלוח"
            description="אם יש מספר מעקב - הוא יוצג כאן עם קישור לחברת המשלוחים"
            delay={50}
          />
        </div>
      </Sequence>

      {/* Section 3: Confirm Delivery */}
      <Sequence from={20 * fps} durationInFrames={10 * fps}>
        <TextReveal
          text="✅ אישור קבלה"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon="📦"
            title="קיבלתם את החבילה?"
            description="לחצו 'אישור קבלת משלוח' כדי לעדכן את המותג"
            delay={15}
            highlight
          />
          <StepCard
            stepNumber={2}
            icon="🔓"
            title="המשימה נפתחת!"
            description="ברגע שתאשרו קבלה - המשימה נפתחת לעבודה ותוכלו להתחיל ליצור תוכן"
            delay={35}
          />
        </div>
        <TextReveal
          text="💡 חשוב: אשרו קבלה רק כשהמוצר באמת הגיע אליכם"
          fontSize={16}
          color="#cbc190"
          delay={55}
          style={{ marginTop: 20 }}
        />
      </Sequence>
    </TutorialScene>
  );
};
