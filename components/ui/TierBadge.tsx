'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

export type TierLevel = 'bronze' | 'silver' | 'gold';

interface TierBadgeProps {
  tier: TierLevel;
  showTooltip?: boolean;
  className?: string;
}

const TIER_CONFIG = {
  bronze: {
    label: 'ברונזה',
    icon: '🥉',
    color: 'from-amber-700 to-amber-900',
    borderColor: 'border-amber-700',
    textColor: 'text-amber-700',
    description: '0-10 משימות מאושרות',
  },
  silver: {
    label: 'כסף',
    icon: '🥈',
    color: 'from-gray-300 to-gray-500',
    borderColor: 'border-gray-400',
    textColor: 'text-gray-400',
    description: '11-50 משימות מאושרות',
  },
  gold: {
    label: 'זהב',
    icon: '🥇',
    color: 'from-yellow-400 to-yellow-600',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-500',
    description: '50+ משימות מאושרות',
  },
};

export function TierBadge({ tier, showTooltip = true, className }: TierBadgeProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const config = TIER_CONFIG[tier];

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2',
          'bg-gradient-to-r',
          config.color,
          config.borderColor,
          'cursor-help transition-all hover:scale-105'
        )}
        onMouseEnter={() => showTooltip && setTooltipVisible(true)}
        onMouseLeave={() => showTooltip && setTooltipVisible(false)}
        onClick={() => showTooltip && setTooltipVisible(!tooltipVisible)}
      >
        <span className="text-lg">{config.icon}</span>
        <span className="text-white font-bold text-sm">{config.label}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && tooltipVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-[#1E1E1E] border-2 border-[#494222] rounded-lg px-4 py-3 shadow-xl min-w-[250px]">
            <div className="text-white font-bold mb-2 flex items-center gap-2">
              <span className="text-xl">{config.icon}</span>
              <span>דרגת {config.label}</span>
            </div>
            <div className="text-[#cbc190] text-sm mb-3">
              {config.description}
            </div>
            
            <div className="border-t border-[#494222] pt-2 space-y-1 text-xs">
              <div className="flex items-center gap-2 text-[#cbc190]">
                <span>🥉</span>
                <span>ברונזה: 0-10 משימות</span>
              </div>
              <div className="flex items-center gap-2 text-[#cbc190]">
                <span>🥈</span>
                <span>כסף: 11-50 משימות</span>
              </div>
              <div className="flex items-center gap-2 text-[#cbc190]">
                <span>🥇</span>
                <span>זהב: 50+ משימות</span>
              </div>
            </div>
          </div>
          {/* Arrow */}
          <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-[#494222] mx-auto"></div>
        </div>
      )}
    </div>
  );
}

// Helper function to determine tier based on completed tasks
export function getTierFromTaskCount(completedTasks: number): TierLevel {
  if (completedTasks >= 50) return 'gold';
  if (completedTasks >= 11) return 'silver';
  return 'bronze';
}
