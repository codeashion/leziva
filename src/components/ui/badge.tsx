import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "brand" | "accent" | "neutral" | "gold" | "success" | "sale";
}

export function Badge({
  className = "",
  variant = "brand",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wider uppercase transition-colors";

  const variantStyles = {
    brand: "bg-[#226192]/10 text-[#226192] border border-[#226192]/20",
    accent: "bg-[#EF8557]/15 text-[#EF8557] border border-[#EF8557]/30",
    neutral: "bg-[#EAE6DE] text-[#1A1D20] border border-[#DDD7CB]",
    gold: "bg-[#D4AF37]/15 text-[#B8860B] border border-[#D4AF37]/30",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    sale: "bg-rose-50 text-rose-700 border border-rose-200 font-semibold",
  };

  return (
    <span
      className={twMerge(clsx(baseStyles, variantStyles[variant], className))}
      {...props}
    >
      {children}
    </span>
  );
}
