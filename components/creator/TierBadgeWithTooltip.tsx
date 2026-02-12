'use client';

import { useState } from 'react';
import { TierBadge } from '@/components/ui/TierBadge';

type TierInfo = {
  name: string;
  description: string;
  requirements: string;
  benefits: string[];
  color: string;
};

const TIER_INFO: Record<string, TierInfo> = {
  starter: {
    name: 'Starter',
    description: 'רמת התחלה ליוצרות תוכן חדשות',
    requirements: '0-2 עבודות מאושרות',
    benefits: [
      'גישה לקמפיינים פתוחים',
      'תמיכה בסיסית',
      'אימון והדרכה ראשונית',
    ],
    color: '#8B7355',
  },
  verified: {
    name: 'Verified',
    description: 'יוצרת תוכן מאומתת עם ניסיון',
    requirements: '3-7 עבודות מאושרות',
    benefits: [
      'עדיפות בקמפיינים',
      'תשלום מהיר יותר',
      'גישה לקמפיינים בלעדיים',
      'תמיכה מתקדמת',
    ],
    color: '#C0C0C0',
  },
  pro: {
    name: 'Pro',
    description: 'יוצרת תוכן מקצועית ומנוסה',
    requirements: '8-15 עבודות מאושרות',
    benefits: [
      'עדיפות ראשונה בקמפיינים',
      'תשלום מיידי',
      'גישה לכל הקמפיינים',
      'מחירים גבוהים יותר',
      'תמיכה VIP',
    ],
    color: '#FFD700',
  },
  elite: {
    name: 'Elite',
    description: 'יוצרת תוכן מובילה במערכת',
    requirements: '+16 עבודות מאושרות',
    benefits: [
      'גישה מוקדמת לקמפיינים חדשים',
      'תשלום מיידי + בונוסים',
      'שיתופי פעולה ארוכי טווח',
      'מחירים פרימיום',
      'מנהל אישי ייעודי',
      'הזמנות לאירועים בלעדיים',
    ],
    color: '#E5E4E2',
  },
};

type Props = {
  tier: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

export function TierBadgeWithTooltip({ tier, showLabel = true, size = 'md' }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tierInfo = TIER_INFO[tier] || TIER_INFO.starter;

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-help"
      >
        <TierBadge tier={tier as any} showLabel={showLabel} />
      </div>

      {showTooltip && (
        <div 
          className="absolute z-50 w-80 bg-white border-2 border-[#f2cc0d] rounded-lg shadow-2xl p-4 bottom-full mb-2 left-1/2 transform -translate-x-1/2"
          style={{ pointerEvents: 'none' }}
        >
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-[#f2cc0d]"></div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#dee2e6]">
              <h3 className="text-xl font-bold text-[#212529]">{tierInfo.name}</h3>
              <div className="text-2xl">
                {tier === 'starter' && '🌱'}
                {tier === 'verified' && '✅'}
                {tier === 'pro' && '⭐'}
                {tier === 'elite' && '👑'}
              </div>
            </div>

            <div>
              <p className="text-[#6c757d] text-sm">{tierInfo.description}</p>
            </div>

            <div className="bg-[#f8f9fa] rounded-lg p-3 border border-[#dee2e6]">
              <h4 className="text-[#212529] font-bold text-sm mb-1">📊 דרישות</h4>
              <p className="text-[#6c757d] text-sm">{tierInfo.requirements}</p>
            </div>

            <div>
              <h4 className="text-[#212529] font-bold text-sm mb-2">🎁 יתרונות</h4>
              <ul className="space-y-1">
                {tierInfo.benefits.map((benefit, idx) => (
                  <li key={idx} className="text-[#6c757d] text-xs flex items-start gap-2">
                    <span className="text-[#f2cc0d] mt-0.5">•</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-[#dee2e6]">
              <p className="text-[#6c757d] text-xs italic text-center">
                הדרגה מתעדכנת אוטומטית לפי ביצועים
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
