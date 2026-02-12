'use client';

import { Card } from '@/components/ui/Card';
import { TierBadge } from '@/components/ui/TierBadge';

const TIERS = [
  {
    tier: 'starter',
    name: 'Starter',
    emoji: '🌱',
    requirements: '0-2 עבודות',
    description: 'רמת התחלה - גישה בסיסית לקמפיינים',
  },
  {
    tier: 'verified',
    name: 'Verified',
    emoji: '✅',
    requirements: '3-7 עבודות',
    description: 'יוצרת מאומתת - עדיפות בקמפיינים',
  },
  {
    tier: 'pro',
    name: 'Pro',
    emoji: '⭐',
    requirements: '8-15 עבודות',
    description: 'יוצרת מקצועית - תשלום מיידי ומחירים גבוהים',
  },
  {
    tier: 'elite',
    name: 'Elite',
    emoji: '👑',
    requirements: '+16 עבודות',
    description: 'יוצרת מובילה - גישה מוקדמת ובונוסים',
  },
];

export function TierLegend() {
  return (
    <Card className="bg-gradient-to-br from-[#2e2a1b] to-[#1E1E1E] border-2 border-[#f2cc0d]">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#dee2e6]">
        <h3 className="text-xl font-bold text-[#212529]">🏆 מדריך דרגות</h3>
        <span className="text-[#6c757d] text-sm">איך להתקדם?</span>
      </div>

      <div className="space-y-4">
        {TIERS.map((tier, idx) => (
          <div
            key={tier.tier}
            className="bg-white rounded-lg p-4 border border-[#dee2e6] hover:border-[#f2cc0d] transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">{tier.emoji}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <TierBadge tier={tier.tier as any} showLabel={true} />
                  <span className="text-[#6c757d] text-sm">({tier.requirements})</span>
                </div>
                <p className="text-[#6c757d] text-sm leading-relaxed">
                  {tier.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-[#dee2e6]">
        <div className="bg-[#f2cc0d]/10 rounded-lg p-4 border border-[#f2cc0d]/30">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h4 className="text-[#212529] font-bold mb-1">איך מתקדמים?</h4>
              <p className="text-[#6c757d] text-sm">
                הדרגה שלך מתעדכנת אוטומטית לפי מספר העבודות המאושרות, 
                איכות העבודה, עמידה בזמנים ותקשורת עם מותגים. 
                כל עבודה מאושרת מקרבת אותך לדרגה הבאה!
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
