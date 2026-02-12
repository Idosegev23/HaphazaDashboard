"use client";

import { cn } from "@/lib/utils/cn";

interface ShipmentCardProps {
  brandName: string;
  brandLogo?: string;
  campaignTitle: string;
  productDescription: string;
  productImage: string;
  status: "action_required" | "processing" | "shipped" | "delivered";
  onAction?: () => void;
  className?: string;
}

export function ShipmentCard({
  brandName,
  brandLogo,
  campaignTitle,
  productDescription,
  productImage,
  status,
  onAction,
  className,
}: ShipmentCardProps) {
  const statusConfig = {
    action_required: {
      label: "דרושה פעולה",
      icon: "warning",
      color: "bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30",
      iconClass: "animate-pulse",
      actionLabel: "אשר כתובת",
      borderClass: "border-l-4 border-l-primary",
    },
    processing: {
      label: "בעיבוד",
      icon: "hourglass_top",
      color: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
      iconClass: "",
      actionLabel: "פרטים נעולים",
      borderClass: "",
    },
    shipped: {
      label: "נשלח",
      icon: "local_shipping",
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      iconClass: "",
      actionLabel: "עקוב אחר משלוח",
      borderClass: "border-l-4 border-l-blue-500",
    },
    delivered: {
      label: "נמסר",
      icon: "check_circle",
      color: "bg-green-500/10 text-green-600 border-green-200",
      iconClass: "",
      actionLabel: "צפה בפרטים",
      borderClass: "border-l-4 border-l-green-500",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row gap-5 p-5 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark shadow-sm hover:shadow-md transition-shadow",
        config.borderClass,
        status === "processing" && "opacity-90",
        className
      )}
    >
      {/* Product Image */}
      <div
        className={cn(
          "w-full md:w-32 aspect-video md:aspect-square rounded-lg bg-cover bg-center shrink-0 relative overflow-hidden group",
          status === "processing" && "grayscale-[50%]"
        )}
        style={{ backgroundImage: `url(${productImage})` }}
      >
        {status === "action_required" && (
          <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors"></div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 gap-2 justify-center">
        <div className="flex items-center gap-2 mb-1">
          {brandLogo ? (
            <div className="size-5 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <img
                alt={`${brandName} Logo`}
                className="w-full h-full object-contain p-0.5"
                src={brandLogo}
              />
            </div>
          ) : (
            <div className="size-5 rounded-full bg-primary flex items-center justify-center">
              <span className="text-[8px] text-background-dark font-bold">
                {brandName.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {brandName}
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-[#212529]">
          {campaignTitle}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
          מוצר: {productDescription}
        </p>
      </div>

      {/* Status & Action */}
      <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 md:gap-2 min-w-[160px] border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0 mt-2 md:mt-0">
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full border",
            config.color
          )}
        >
          <span className={cn("material-symbols-outlined text-[16px]", config.iconClass)}>
            {config.icon}
          </span>
          <span className="text-xs font-bold">{config.label}</span>
        </div>
        <button
          onClick={onAction}
          disabled={status === "processing"}
          className={cn(
            "flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-sm font-bold transition-all w-full md:w-auto",
            status === "action_required" &&
              "bg-primary hover:bg-blue-600 text-[#212529] shadow-lg shadow-blue-500/20",
            status === "processing" &&
              "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-not-allowed",
            (status === "shipped" || status === "delivered") &&
              "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
          )}
        >
          <span>{config.actionLabel}</span>
          {status === "action_required" && (
            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
