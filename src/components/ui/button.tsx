import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "outline" | "ghost" | "editorial";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none tracking-wide cursor-pointer";

    const variantStyles = {
      primary:
        "bg-[#226192] text-white hover:bg-[#1b4f77] focus-visible:ring-[#226192] shadow-xs active:scale-[0.99]",
      accent:
        "bg-[#EF8557] text-white hover:bg-[#e8713d] focus-visible:ring-[#EF8557] shadow-xs active:scale-[0.99]",
      outline:
        "border border-[#226192] text-[#226192] bg-transparent hover:bg-[#226192]/5 focus-visible:ring-[#226192]",
      ghost:
        "text-[#226192] hover:bg-[#EAE6DE]/50 focus-visible:ring-[#226192]",
      editorial:
        "bg-[#1A1D20] text-[#EAE6DE] hover:bg-[#226192] uppercase tracking-[0.15em] text-xs font-semibold focus-visible:ring-[#1A1D20]",
    };

    const sizeStyles = {
      sm: "h-9 px-4 text-xs rounded-xs",
      md: "h-11 px-6 text-sm rounded-xs",
      lg: "h-13 px-8 text-base rounded-xs",
    };

    const combinedClassName = twMerge(
      clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )
    );

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string; [key: string]: unknown }>;
      return React.cloneElement(child, {
        className: twMerge(combinedClassName, child.props.className),
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={combinedClassName}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
