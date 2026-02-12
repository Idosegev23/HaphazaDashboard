'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { tutorialRegistry } from '@/remotion/tutorialRegistry';
import { createClient } from '@/lib/supabase/client';

interface TutorialPopupProps {
  tutorialKey: string;
}

export const TutorialPopup: React.FC<TutorialPopupProps> = ({ tutorialKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState<boolean | null>(null); // null = loading
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const playerRef = useRef<PlayerRef>(null);

  const meta = tutorialRegistry[tutorialKey];

  // Check if tutorial was dismissed
  useEffect(() => {
    const checkDismissed = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsDismissed(true); // Not logged in, don't show
        return;
      }

      const { data } = await (supabase as any)
        .from('tutorial_dismissed')
        .select('id')
        .eq('user_id', user.id)
        .eq('tutorial_key', tutorialKey)
        .maybeSingle();

      if (data) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
        setIsOpen(true); // Auto-show on first visit
      }
    };

    checkDismissed();
  }, [tutorialKey]);

  // Handle "don't show again"
  const handleDismiss = async () => {
    setIsOpen(false);
    
    if (dontShowAgain) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await (supabase as any).from('tutorial_dismissed').insert({
          user_id: user.id,
          tutorial_key: tutorialKey,
        });
        
        if (!error) {
          setIsDismissed(true); // Only set if successfully saved
        }
      }
    }
    
    // Pause player
    if (playerRef.current) {
      playerRef.current.pause();
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  // Lazy load the composition
  const lazyComponent = useCallback(() => {
    if (!meta) return Promise.resolve({ default: () => null });
    return meta.importFn();
  }, [tutorialKey]);

  // Don't render anything if no meta found
  if (!meta) return null;

  // Still loading dismissed state
  if (isDismissed === null) return null;

  return (
    <>
      {/* Floating help button - always visible when popup is closed */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2 
            bg-white border-2 border-[#f2cc0d] text-[#f2cc0d] 
            rounded-full px-4 py-3 shadow-lg
            hover:bg-[#f2cc0d] hover:text-[#121212] 
            transition-all duration-300 hover:scale-105
            group"
          title="צפה במדריך"
        >
          <span className="text-sm font-bold">מדריך</span>
        </button>
      )}

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
        >
          {/* Backdrop click to close */}
          <div
            className="absolute inset-0"
            onClick={handleDismiss}
          />

          {/* Modal content */}
          <div
            className="relative z-10 w-full max-w-4xl bg-white rounded-2xl overflow-hidden 
              border border-[#dee2e6] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#dee2e6] bg-[#f8f9fa]">
              <div className="flex items-center gap-3" dir="rtl">
                <h3 className="text-[#212529] font-bold text-lg">{meta.title}</h3>
              </div>
              <button
                onClick={handleDismiss}
                className="text-[#6c757d] hover:text-[#212529] transition-colors p-1 rounded-lg 
                  hover:bg-[#dee2e6]/50"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Player */}
            <div className="bg-white">
              <Player
                ref={playerRef}
                lazyComponent={lazyComponent}
                durationInFrames={meta.durationInFrames}
                compositionWidth={meta.width}
                compositionHeight={meta.height}
                fps={meta.fps}
                controls
                autoPlay
                style={{
                  width: '100%',
                  aspectRatio: `${meta.width} / ${meta.height}`,
                }}
                clickToPlay
                doubleClickToFullscreen
                showVolumeControls={false}
              />
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-6 py-4 border-t border-[#dee2e6] bg-[#f8f9fa]"
              dir="rtl"
            >
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-5 h-5 rounded border-[#dee2e6] bg-white accent-[#f2cc0d] 
                    cursor-pointer"
                />
                <span className="text-[#6c757d] text-sm group-hover:text-[#212529] transition-colors">
                  אל תציג מדריך זה שוב
                </span>
              </label>

              <button
                onClick={handleDismiss}
                className="px-5 py-2 bg-[#f2cc0d] text-[#121212] font-bold rounded-lg 
                  hover:bg-[#dcb900] transition-colors text-sm"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
