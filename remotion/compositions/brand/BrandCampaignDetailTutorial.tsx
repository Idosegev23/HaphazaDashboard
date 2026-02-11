import React from 'react';
import { useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { TutorialScene } from '../../components/TutorialScene';
import { StepCard } from '../../components/StepCard';
import { TextReveal } from '../../components/TextReveal';
import { ScreenMockup } from '../../components/ScreenMockup';

export const BrandCampaignDetailTutorial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <TutorialScene
      title="ניהול קמפיין - מרכז הבקרה"
      subtitle="כל מה שצריך לנהל, במקום אחד"
    >
      {/* Section 1: Tabs Overview */}
      <Sequence from={0} durationInFrames={10 * fps}>
        <TextReveal
          text="📑 הטאבים שלכם"
          fontSize={26}
          color="#f2cc0d"
          fontWeight={700}
          delay={5}
        />
        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            { icon: '📋', name: 'סקירה', desc: 'מבט-על על הקמפיין' },
            { icon: '✏️', name: 'פרטים', desc: 'עריכת הגדרות ומוצרים' },
            { icon: '👥', name: 'משפיענים', desc: 'סקירה ואישור בקשות' },
            { icon: '📦', name: 'משלוחים', desc: 'מעקב משלוח מוצרים' },
            { icon: '🎬', name: 'תכנים', desc: 'צפייה ואישור תכנים' },
            { icon: '💰', name: 'תשלומים', desc: 'מעקב וניהול תשלומים' },
          ].map((tab, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: '12px 16px',
                width: '30%',
                direction: 'rtl',
              }}
            >
              <div style={{ fontSize: 20 }}>{tab.icon}</div>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginTop: 4 }}>
                {tab.name}
              </div>
              <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{tab.desc}</div>
            </div>
          ))}
        </div>
      </Sequence>

      {/* Section 2: Details Tab */}
      <Sequence from={10 * fps} durationInFrames={8 * fps}>
        <TextReveal
          text="✏️ טאב פרטים - עריכת הקמפיין"
          fontSize={26}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon="📝"
            title="עריכת פרטי הקמפיין"
            description="עדכנו שם, מטרה, תיאור ותקציב. שמרו שינויים בלחיצה"
            delay={15}
            highlight
          />
          <StepCard
            stepNumber={2}
            icon="📦"
            title="ניהול מוצרים"
            description="הוסיפו ומחקו מוצרים שנשלחים למשפיענים"
            delay={35}
          />
          <StepCard
            stepNumber={3}
            icon="🚀"
            title="פרסום הקמפיין"
            description="קמפיין בסטטוס טיוטה? פרסמו אותו כדי שמשפיענים יוכלו להגיש בקשות"
            delay={50}
          />
        </div>
      </Sequence>

      {/* Section 3: Influencers & Content */}
      <Sequence from={18 * fps} durationInFrames={10 * fps}>
        <TextReveal
          text="👥 משפיענים ותכנים"
          fontSize={26}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
          <div style={{ flex: 1 }}>
            <StepCard
              stepNumber={1}
              icon="✅"
              title="אישור/דחייה"
              description="בדקו כל בקשה, הגדירו מחיר מותאם אישית ואשרו או דחו"
              delay={15}
              highlight
            />
          </div>
          <div style={{ flex: 1 }}>
            <StepCard
              stepNumber={2}
              icon="🎬"
              title="צפייה בתכנים"
              description="צפו בתמונות וסרטונים שהועלו ואשרו אותם"
              delay={30}
            />
          </div>
        </div>
      </Sequence>

      {/* Section 4: Shipping & Payments */}
      <Sequence from={28 * fps} durationInFrames={12 * fps}>
        <TextReveal
          text="📦💰 משלוחים ותשלומים"
          fontSize={26}
          color="#f2cc0d"
          fontWeight={700}
          delay={0}
        />
        <div style={{ marginTop: 20 }}>
          <StepCard
            stepNumber={1}
            icon="📦"
            title="מעקב משלוחים"
            description="ראו סטטוס כל משלוח - ממתין, נשלח, התקבל. הזינו מספרי מעקב"
            delay={15}
          />
          <StepCard
            stepNumber={2}
            icon="💰"
            title="ניהול תשלומים"
            description="צפו במסמכים, העלו אסמכתאות תשלום ועקבו אחרי סטטוס כל תשלום"
            delay={35}
            highlight
          />
        </div>
        <TextReveal
          text="💡 טיפ: ניתן להעלות אסמכתת תשלום ישירות מהטאב כדי לעדכן סטטוס"
          fontSize={16}
          color="#cbc190"
          delay={55}
          style={{ marginTop: 20 }}
        />
      </Sequence>
    </TutorialScene>
  );
};
