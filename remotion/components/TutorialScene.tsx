import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from 'remotion';

interface TutorialSceneProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  showTitle?: boolean;
}

export const TutorialScene: React.FC<TutorialSceneProps> = ({
  title,
  subtitle,
  children,
  showTitle = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const titleSpring = spring({
    frame: frame - 5,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const subtitleSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1A1A1A',
        opacity: bgOpacity,
        fontFamily: 'Arial, Helvetica, sans-serif',
        direction: 'rtl',
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'radial-gradient(ellipse at top right, rgba(242, 204, 13, 0.08) 0%, transparent 60%)',
        }}
      />

      {/* Gold accent line at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #f2cc0d, #d4a30a, #f2cc0d)',
          transform: `scaleX(${titleSpring})`,
          transformOrigin: 'right',
        }}
      />

      {/* LEADERS branding */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 30,
          opacity: interpolate(frame, [10, 25], [0, 0.6], {
            extrapolateRight: 'clamp',
          }),
          color: '#f2cc0d',
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 3,
        }}
      >
        LEADERS
      </div>

      {/* Title section */}
      {showTitle && title && (
        <div
          style={{
            position: 'absolute',
            top: 50,
            right: 60,
            left: 60,
            textAlign: 'right',
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: '#ffffff',
              transform: `translateY(${interpolate(titleSpring, [0, 1], [30, 0])}px)`,
              opacity: titleSpring,
              lineHeight: 1.3,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 20,
                color: '#cbc190',
                marginTop: 10,
                transform: `translateY(${interpolate(subtitleSpring, [0, 1], [20, 0])}px)`,
                opacity: subtitleSpring,
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      )}

      {/* Content area */}
      <div
        style={{
          position: 'absolute',
          top: showTitle && title ? 160 : 30,
          right: 40,
          left: 40,
          bottom: 40,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
