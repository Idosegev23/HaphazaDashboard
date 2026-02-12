import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface TextRevealProps {
  text: string;
  delay?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  align?: 'right' | 'center' | 'left';
  style?: React.CSSProperties;
}

export const TextReveal: React.FC<TextRevealProps> = ({
  text,
  delay = 0,
  fontSize = 24,
  color = '#212529',
  fontWeight = 600,
  align = 'right',
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const clipProgress = interpolate(entrance, [0, 1], [100, 0]);
  const translateY = interpolate(entrance, [0, 1], [15, 0]);

  return (
    <div
      style={{
        overflow: 'hidden',
        direction: 'rtl',
        textAlign: align,
        ...style,
      }}
    >
      <div
        style={{
          fontSize,
          fontWeight,
          color,
          lineHeight: 1.5,
          transform: `translateY(${translateY}px)`,
          clipPath: `inset(0 ${align === 'right' ? 0 : clipProgress}% 0 ${align === 'right' ? clipProgress : 0}%)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};
