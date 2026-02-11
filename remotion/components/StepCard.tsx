import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  icon?: string;
  delay?: number;
  highlight?: boolean;
}

export const StepCard: React.FC<StepCardProps> = ({
  stepNumber,
  title,
  description,
  icon,
  delay = 0,
  highlight = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const scale = interpolate(entrance, [0, 1], [0.8, 1]);
  const opacity = entrance;
  const translateY = interpolate(entrance, [0, 1], [40, 0]);

  const glowPulse = highlight
    ? interpolate(
        Math.sin((frame - delay) * 0.1),
        [-1, 1],
        [0.3, 0.8],
      )
    : 0;

  return (
    <div
      style={{
        transform: `scale(${scale}) translateY(${translateY}px)`,
        opacity,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 20,
        padding: '20px 24px',
        background: highlight
          ? `rgba(242, 204, 13, ${0.05 + glowPulse * 0.05})`
          : 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        border: highlight
          ? '2px solid rgba(242, 204, 13, 0.5)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        direction: 'rtl',
        marginBottom: 12,
      }}
    >
      {/* Step number circle */}
      <div
        style={{
          minWidth: 48,
          height: 48,
          borderRadius: '50%',
          background: highlight
            ? 'linear-gradient(135deg, #f2cc0d, #d4a30a)'
            : 'linear-gradient(135deg, #333, #444)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: icon ? 24 : 20,
          fontWeight: 800,
          color: highlight ? '#1A1A1A' : '#f2cc0d',
          flexShrink: 0,
        }}
      >
        {icon || stepNumber}
      </div>

      {/* Text content */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 6,
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 16,
            color: '#a0a0a0',
            lineHeight: 1.6,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
};
