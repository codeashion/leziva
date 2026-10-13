import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "ivory" | "editorial" | "subtle";
}

export function Card({
  className = "",
  variant = "default",
  children,
  ...props
}: CardProps) {
  const baseStyles =
    "rounded-sm border transition-shadow duration-300 overflow-hidden";

  const variantStyles = {
    default: "bg-white border-[#E2DDD3] shadow-[0_2px_12px_rgba(34,97,146,0.04)]",
    ivory: "bg-[#EAE6DE]/40 border-[#DDD7CB] shadow-sm",
    editorial: "bg-[#1A1D20] text-[#EAE6DE] border-[#2E3338]",
    subtle: "bg-[#FDFBF7] border-dashed border-[#DDD7CB]",
  };

  return (
    <div
      className={twMerge(clsx(baseStyles, variantStyles[variant], className))}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge("p-6 pb-3 space-y-1.5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={twMerge(
        "font-serif text-xl font-semibold tracking-wide text-[#1A1D20]",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge("p-6 pt-3", className)} {...props}>
      {children}
    </div>
  );
}
