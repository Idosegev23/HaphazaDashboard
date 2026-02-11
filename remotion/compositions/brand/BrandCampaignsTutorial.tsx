import React from 'react';
import { useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { TutorialScene } from '../../components/TutorialScene';
import { StepCard } from '../../components/StepCard';
import { TextReveal } from '../../components/TextReveal';
import { ScreenMockup } from '../../components/ScreenMockup';

export const BrandCampaignsTutorial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <TutorialScene
      title="ניהול קמפיינים"
      subtitle="איך ליצור, לפרסם ולנהל קמפיינים בפלטפורמה"
    >
      {/* Section 1: Campaign List */}
      <Sequence from={0} durationInFrames={10 * fps}>
        <div style={{ display: 'flex', gap: 30, marginTop: 10 }}>
          <div style={{ flex: 1 }}>
            <StepCard
              stepNumber={1}
              icon="📋"
              title="רשימת הקמפיינים"
              description="כאן מופיעים כל הקמפיינים שלכם: טיוטות, פעילים, וסגורים. לחצו על כל קמפיין כדי לנהל אותו"
              delay={10}
              highlight
            />
            <StepCard
              stepNumber={2}
              icon="🏷️"
              title="סינון לפי סטטוס"
              description="השתמשו בסינון כדי לראות רק קמפיינים פעילים, טיוטות או ארכיון"
              delay={35}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <ScreenMockup delay={15} title="הקמפיינים שלי">
              <div style={{ direction: 'rtl' }}>
                {['קמפיין שמפו טבעי', 'קמפיין קרם לחות', 'קמפיין ספורט'].map((name, i) => (
                  <div
                    key={i}
                    style={{
                      background: i === 0 ? 'rgba(242, 204, 13, 0.08)' : '#2A2A2A',
                      borderRadius: 10,
                      padding: '10px 14px',
                      marginBottom: 8,
                      border: i === 0 ? '1px solid #f2cc0d44' : '1px solid #333',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: '#fff', fontSize: 13 }}>{name}</span>
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: i === 0 ? '#4ade8033' : i === 1 ? '#f2cc0d33' : '#666',
                        color: i === 0 ? '#4ade80' : i === 1 ? '#f2cc0d' : '#aaa',
                      }}
                    >
                      {i === 0 ? 'פעיל' : i === 1 ? 'טיוטה' : 'ארכיון'}
                    </span>
                  </div>
                ))}
              </div>
            </ScreenMockup>
          </div>
        </div>
      </Sequence>

      {/* Section 2: Create New Campaign */}
      <Sequence from={10 * fps} durationInFrames={12 * fps}>
        <TextReveal
          text="🆕 יצירת קמפיין חדש"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon="✏️"
            title="מלאו את פרטי הקמפיין"
            description="שם, מטרה, תיאור ותקציב. הגדירו מחיר קבוע או השאירו גמיש לקביעה בעת אישור כל משפיען"
            delay={15}
            highlight
          />
          <StepCard
            stepNumber={2}
            icon="📦"
            title="הוסיפו מוצרים"
            description="הוסיפו את המוצרים שנשלחים למשפיענים - שם, תיאור וכתובת לרכישה"
            delay={35}
          />
          <StepCard
            stepNumber={3}
            icon="🚀"
            title="פרסמו את הקמפיין"
            description="לחצו 'פרסם קמפיין' כדי שמשפיענים יוכלו להגיש בקשות להצטרף"
            delay={55}
          />
        </div>
      </Sequence>

      {/* Section 3: Campaign Management */}
      <Sequence from={22 * fps} durationInFrames={13 * fps}>
        <TextReveal
          text="⚙️ ניהול מרכזי"
          fontSize={28}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon="🎯"
            title="הכל תחת הקמפיין"
            description="לחצו על קמפיין כדי לנהל: משפיענים, תכנים, משלוחים ותשלומים - הכל ממקום אחד"
            delay={15}
            highlight
          />
          <StepCard
            stepNumber={2}
            icon="📊"
            title="מעקב בזמן אמת"
            description="עקבו אחרי סטטוס כל שלב - מרגע הגשת הבקשה ועד לתשלום הסופי"
            delay={35}
          />
        </div>
        <TextReveal
          text="💡 טיפ: מהדף הזה אפשר ללחוץ על כל קמפיין כדי לפתוח את מרכז הניהול המלא"
          fontSize={16}
          color="#cbc190"
          delay={60}
          style={{ marginTop: 20 }}
        />
      </Sequence>
    </TutorialScene>
  );
};
