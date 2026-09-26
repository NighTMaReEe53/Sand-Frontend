import React from "react";
import { cn, formatPrice } from "../../lib/utils";
import { Sparkles } from "lucide-react";

export interface CoursePriceProps {
  price?: number | string | null;
  isFree?: boolean;
  originalPrice?: number | string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showFreeBadge?: boolean;
  className?: string;
}

export const CoursePrice: React.FC<CoursePriceProps> = ({
  price,
  isFree,
  originalPrice,
  size = "md",
  showFreeBadge = true,
  className,
}) => {
  const numericPrice =
    typeof price === "string"
      ? parseFloat(price)
      : typeof price === "number"
      ? price
      : 0;
  const isFreeEffective = isFree || isNaN(numericPrice) || numericPrice === 0;

  const sizeClasses = {
    xs: {
      price: "text-xs font-bold",
      original: "text-[10px]",
      badge: "px-2 py-0.5 text-[10px]",
      currency: "text-[10px] font-normal mr-1",
    },
    sm: {
      price: "text-sm font-bold",
      original: "text-xs",
      badge: "px-2.5 py-0.5 text-xs",
      currency: "text-xs font-normal mr-1",
    },
    md: {
      price: "text-base sm:text-lg font-bold",
      original: "text-xs sm:text-sm",
      badge: "px-3 py-1 text-xs",
      currency: "text-xs sm:text-sm font-normal mr-1",
    },
    lg: {
      price: "text-xl sm:text-2xl font-bold font-amiri",
      original: "text-sm sm:text-base",
      badge: "px-3.5 py-1.5 text-sm font-bold",
      currency: "text-sm font-normal mr-1.5",
    },
    xl: {
      price: "text-3xl sm:text-4xl font-bold font-amiri",
      original: "text-base sm:text-lg",
      badge: "px-4 py-2 text-base font-bold",
      currency: "text-base font-normal mr-2",
    },
  };

  const currentSize = sizeClasses[size];

  if (isFreeEffective) {
    if (!showFreeBadge) {
      return (
        <span
          className={cn(
            "text-emerald-400 font-bold",
            currentSize.price,
            className
          )}
        >
          مجاني
        </span>
      );
    }

    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold tracking-wide shadow-sm",
          currentSize.badge,
          className
        )}
      >
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
        <span>مجاني</span>
      </div>
    );
  }

  const formattedNum = numericPrice.toLocaleString("ar-EG");
  const originalNum =
    originalPrice !== undefined && originalPrice !== null
      ? typeof originalPrice === "string"
        ? parseFloat(originalPrice)
        : originalPrice
      : null;

  return (
    <div className={cn("inline-flex items-baseline gap-2", className)}>
      <span
        className={cn(
          "var(--secondary) font-bold tracking-tight",
          currentSize.price
        )}
      >
        {formattedNum}
        <span className={cn("var(--primary)", currentSize.currency)}>
          جنيه
        </span>
      </span>

      {originalNum && originalNum > numericPrice && (
        <span
          className={cn(
            "text-ivory-muted/60 line-through font-normal",
            currentSize.original
          )}
        >
          {originalNum.toLocaleString("ar-EG")} جنيه
        </span>
      )}
    </div>
  );
};
