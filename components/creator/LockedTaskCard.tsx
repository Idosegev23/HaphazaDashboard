"use client";

import { cn } from "@/lib/utils/cn";

interface LockedTaskCardProps {
  title: string;
  description: string;
  icon: string;
  lockReason?: string;
  className?: string;
}

export function LockedTaskCard({
  title,
  description,
  icon,
  lockReason = 'ממתין לסטטוס "נשלח"',
  className,
}: LockedTaskCardProps) {
  return (
    <div
      className={cn(
        "relative group/task overflow-hidden rounded-lg bg-surface-dark border border-border-dark p-4 md:p-5 flex items-center justify-between opacity-60 hover:opacity-70 transition-opacity cursor-not-allowed select-none",
        className
      )}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-background-dark/50 z-10"></div>

      <div className="flex items-center gap-4 z-20 relative">
        <div className="bg-background-dark p-3 rounded text-text-muted">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className="flex flex-col">
          <h3 className="text-base font-bold text-[#212529]">{title}</h3>
          <p className="text-sm text-text-muted">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-6 z-20 relative">
        <div className="hidden md:flex flex-col items-end gap-1">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
            סטטוס
          </span>
          <span className="text-sm font-medium text-[#212529] flex items-center gap-1">
            <span className="material-symbols-outlined text-base">lock</span>
            נעול
          </span>
        </div>
        <button
          className="size-10 flex items-center justify-center rounded bg-background-dark text-text-muted"
          disabled
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {/* Tooltip on hover */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-[#212529] text-xs py-1 px-3 rounded opacity-0 group-hover/task:opacity-100 transition-opacity z-30 pointer-events-none whitespace-nowrap shadow-lg border border-border-dark">
        {lockReason}
      </div>
    </div>
  );
}
