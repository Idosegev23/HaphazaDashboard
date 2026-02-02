'use client';

import { ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

interface DrawerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: 'right' | 'left';
}

/**
 * Slide-in drawer panel (RTL aware)
 * Used for detail views and forms
 */
export function DrawerPanel({ isOpen, onClose, title, children, side = 'right' }: DrawerPanelProps) {
  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 bottom-0 w-full max-w-2xl bg-[#1E1E1E] border-l border-[#494222] z-50 transition-transform duration-300 ease-out overflow-y-auto',
          side === 'right' ? 'right-0' : 'left-0',
          isOpen
            ? 'translate-x-0'
            : side === 'right'
            ? 'translate-x-full'
            : '-translate-x-full'
        )}
      >
        {/* Header */}
        {title && (
          <div className="sticky top-0 bg-[#1E1E1E] border-b border-[#494222] px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-[#cbc190] hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </>
  );
}
