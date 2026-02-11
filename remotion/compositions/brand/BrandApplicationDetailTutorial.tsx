import React from 'react';
import { useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { TutorialScene } from '../../components/TutorialScene';
import { StepCard } from '../../components/StepCard';
import { TextReveal } from '../../components/TextReveal';
import { ScreenMockup } from '../../components/ScreenMockup';

export const BrandApplicationDetailTutorial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <TutorialScene
      title="סקירת בקשת משפיען"
      subtitle="איך לבדוק, לתמחר ולהחליט על כל משפיען"
    >
      {/* Section 1: Review Application */}
      <Sequence from={0} durationInFrames={10 * fps}>
        <div style={{ display: 'flex', gap: 30, marginTop: 10 }}>
          <div style={{ flex: 1 }}>
            <StepCard
              stepNumber={1}
              icon="👤"
              title="פרטי המשפיען"
              description="בחלק העליון תראו את שם המשפיען, תמונת פרופיל, דירוג ופלטפורמות פעילות"
              delay={10}
              highlight
            />
            <StepCard
              stepNumber={2}
              icon="💬"
              title="הודעת הבקשה"
              description="המשפיען כותב למה הוא מתאים לקמפיין. קראו בעיון לפני ההחלטה"
              delay={35}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <ScreenMockup delay={15} title="בקשת משפיען">
              <div style={{ direction: 'rtl', padding: 5 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f2cc0d, #d4a30a)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                    }}
                  >
                    👩
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>שרה כהן</div>
                    <div style={{ color: '#888', fontSize: 10 }}>⭐ 4.8 · Instagram, TikTok</div>
                  </div>
                </div>
                <div
                  style={{
                    background: '#2A2A2A',
                    borderRadius: 8,
                    padding: 10,
                    fontSize: 11,
                    color: '#ccc',
                    lineHeight: 1.6,
                  }}
                >
                  "אני יוצרת תוכן בתחום הביוטי עם 50K עוקבים..."
                </div>
              </div>
            </ScreenMockup>
          </div>
        </div>
      </Sequence>

      {/* Section 2: Custom Pricing */}
      <Sequence from={10 * fps} durationInFrames={12 * fps}>
        <TextReveal
          text="💰 תמחור גמיש"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon="🏷️"
            title="מחיר קבוע מהקמפיין"
            description="אם הגדרתם מחיר קבוע בהגדרות הקמפיין, הוא יוצג כברירת מחדל"
            delay={15}
          />
          <StepCard
            stepNumber={2}
            icon="💡"
            title="מחיר מותאם אישית"
            description="לחצו 'שנה מחיר' כדי להגדיר סכום ייחודי למשפיען זה - אידיאלי כשיש הבדלי ערך"
            delay={35}
            highlight
          />
          <StepCard
            stepNumber={3}
            icon="💵"
            title="אישור סופי"
            description="המחיר הסופי יוצג בחלון האישור לפני השליחה"
            delay={55}
          />
        </div>
      </Sequence>

      {/* Section 3: Approve / Reject */}
      <Sequence from={22 * fps} durationInFrames={13 * fps}>
        <TextReveal
          text="✅❌ אישור ודחייה"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
          <div style={{ flex: 1 }}>
            <StepCard
              stepNumber={1}
              icon="✅"
              title="אשר בקשה"
              description="אישור יוצר משימה אוטומטית למשפיען ומתחיל את תהליך העבודה"
              delay={15}
              highlight
            />
          </div>
          <div style={{ flex: 1 }}>
            <StepCard
              stepNumber={2}
              icon="❌"
              title="דחה בקשה"
              description="דחייה עם סיבה. אפשר לשנות החלטה מאוחר יותר!"
              delay={30}
            />
          </div>
        </div>
        <TextReveal
          text="💡 טיפ: גם אם דחיתם בקשה, ניתן לחזור ולאשר אותה בהמשך"
          fontSize={16}
          color="#cbc190"
          delay={55}
          style={{ marginTop: 25 }}
        />
      </Sequence>
    </TutorialScene>
  );
};
