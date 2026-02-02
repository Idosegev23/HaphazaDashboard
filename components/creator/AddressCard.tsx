"use client";

import { cn } from "@/lib/utils/cn";

interface AddressCardProps {
  label: string;
  name: string;
  addressLines: string[];
  isDefault?: boolean;
  onEdit?: () => void;
  className?: string;
}

export function AddressCard({
  label,
  name,
  addressLines,
  isDefault = false,
  onEdit,
  className,
}: AddressCardProps) {
  return (
    <div className="w-full">
      <div
        className={cn(
          "flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark p-6 shadow-sm",
          className
        )}
      >
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary shrink-0">
            <span className="material-symbols-outlined text-[24px]">
              location_on
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold leading-tight">{label}</p>
              {isDefault && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/20 text-primary">
                  ברירת מחדל
                </span>
              )}
            </div>
            <div className="text-slate-500 dark:text-[#90adcb] text-base font-normal leading-normal">
              {name}
              <br />
              {addressLines.map((line, index) => (
                <span key={index}>
                  {line}
                  <br />
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="group flex items-center gap-2 cursor-pointer rounded-lg h-9 px-4 bg-transparent border border-slate-300 dark:border-slate-600 hover:border-primary dark:hover:border-primary text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-all text-sm font-bold w-full md:w-auto justify-center"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
          <span>ערוך פרטים</span>
        </button>
      </div>
    </div>
  );
}
