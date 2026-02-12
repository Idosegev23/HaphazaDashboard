"use client";

import { cn } from "@/lib/utils/cn";

interface EligibilityGateBannerProps {
  trackingNumber?: string;
  shipmentStatus: "processing" | "shipped" | "delivered";
  progress: number;
  className?: string;
}

export function EligibilityGateBanner({
  trackingNumber,
  shipmentStatus,
  progress,
  className,
}: EligibilityGateBannerProps) {
  const statusLabels = {
    processing: "בעיבוד",
    shipped: "נשלח",
    delivered: "נמסר",
  };

  return (
    <section
      className={cn(
        "rounded-xl border border-border-dark bg-surface-dark/50 overflow-hidden relative group",
        className
      )}
    >
      {/* Status Accent Line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>

      <div className="p-6 md:p-8 flex flex-col gap-8">
        {/* Alert Header */}
        <div className="flex flex-col md:flex-row justify-between gap-6 items-start">
          <div className="flex gap-4">
            <div className="bg-primary/10 p-3 rounded-full text-primary h-fit">
              <span className="material-symbols-outlined">lock_clock</span>
            </div>
            <div className="flex flex-col gap-2 max-w-2xl">
              <h1 className="text-2xl md:text-3xl font-bold text-[#212529] tracking-tight">
                המשימות נעולות כרגע
              </h1>
              <p className="text-text-muted leading-relaxed">
                כדי להבטיח אותנטיות התוכן, ניתן להתחיל במשימות רק לאחר שהמוצר
                נשלח. המשימות יפתחו אוטומטית כאשר סטטוס המשלוח יתעדכן ל"נשלח".
              </p>
            </div>
          </div>

          {/* Tracking Widget */}
          {trackingNumber && (
            <div className="flex flex-col gap-3 p-4 rounded-lg bg-background-dark border border-border-dark min-w-[280px]">
              <div className="flex items-center gap-3 text-primary">
                <span className="material-symbols-outlined">local_shipping</span>
                <span className="text-sm font-bold uppercase tracking-wider">
                  {statusLabels[shipmentStatus]}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-text-muted text-xs">מספר מעקב</p>
                <div className="flex items-center justify-between">
                  <p className="text-[#212529] font-mono text-sm">{trackingNumber}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(trackingNumber)}
                    className="text-primary hover:text-[#212529] transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      content_copy
                    </span>
                  </button>
                </div>
              </div>
              <a
                className="text-xs font-bold text-primary hover:underline mt-1"
                href="#"
              >
                עקוב אחר החבילה ←
              </a>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between text-xs font-medium text-text-muted px-1">
            <span className={progress >= 25 ? "text-primary" : ""}>
              הזמנה בוצעה
            </span>
            <span className={progress >= 35 ? "text-primary" : ""}>בעיבוד</span>
            <span className={progress >= 75 ? "text-primary" : ""}>נשלח</span>
            <span className={progress >= 100 ? "text-primary" : ""}>נמסר</span>
          </div>
          <div className="h-2 w-full bg-background-dark rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-[#342f18]"></div>
            <div
              className="absolute top-0 left-0 h-full bg-primary rounded-full shadow-[0_0_10px_rgba(242,204,13,0.5)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </section>
  );
}
