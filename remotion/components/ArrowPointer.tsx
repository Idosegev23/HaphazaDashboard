import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface ArrowPointerProps {
  x: number;
  y: number;
  label?: string;
  delay?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export const ArrowPointer: React.FC<ArrowPointerProps> = ({
  x,
  y,
  label,
  delay = 0,
  direction = 'left',
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pulse = interpolate(
    Math.sin((frame - delay) * 0.15),
    [-1, 1],
    [0.85, 1.15],
  );

  const arrowRotation: Record<string, number> = {
    left: 0,
    right: 180,
    up: 90,
    down: -90,
  };

  const bounceOffset = interpolate(
    Math.sin((frame - delay) * 0.12),
    [-1, 1],
    [-6, 6],
  );

  const xOffset = direction === 'left' || direction === 'right' ? bounceOffset : 0;
  const yOffset = direction === 'up' || direction === 'down' ? bounceOffset : 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: x + xOffset,
        top: y + yOffset,
        opacity,
        transform: `scale(${pulse})`,
        zIndex: 100,
      }}
    >
      {/* Arrow SVG */}
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        style={{
          transform: `rotate(${arrowRotation[direction]}deg)`,
          filter: 'drop-shadow(0 0 8px rgba(242, 204, 13, 0.6))',
        }}
      >
        <path
          d="M30 20L10 8v24l20-12z"
          fill="#f2cc0d"
        />
      </svg>

      {/* Optional label */}
      {label && (
        <div
          style={{
            position: 'absolute',
            top: direction === 'down' ? -30 : direction === 'up' ? 45 : -5,
            left: direction === 'right' ? -120 : direction === 'left' ? 45 : -40,
            whiteSpace: 'nowrap',
            background: 'rgba(242, 204, 13, 0.15)',
            border: '1px solid rgba(242, 204, 13, 0.4)',
            borderRadius: 8,
            padding: '4px 12px',
            color: '#f2cc0d',
            fontSize: 14,
            fontWeight: 600,
            direction: 'rtl',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};
