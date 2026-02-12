import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface ScreenMockupProps {
  children: React.ReactNode;
  delay?: number;
  title?: string;
  scale?: number;
}

export const ScreenMockup: React.FC<ScreenMockupProps> = ({
  children,
  delay = 0,
  title,
  scale = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const scaleValue = interpolate(entrance, [0, 1], [0.9, scale]);
  const opacity = entrance;

  return (
    <div
      style={{
        transform: `scale(${scaleValue})`,
        opacity,
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #dee2e6',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
        background: '#ffffff',
      }}
    >
      {/* Window title bar */}
      <div
        style={{
          height: 36,
          background: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: 8,
          borderBottom: '1px solid #dee2e6',
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
        {title && (
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              color: '#6c757d',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {title}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          padding: 20,
          minHeight: 200,
          background: '#ffffff',
        }}
      >
        {children}
      </div>
    </div>
  );
};
