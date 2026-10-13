import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-[#1A1D20]/80"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={twMerge(
              clsx(
                "flex h-11 w-full rounded-sm border bg-white px-3.5 py-2 text-sm text-[#1A1D20] placeholder:text-[#5A6065]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#226192] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
                error
                  ? "border-red-500 focus:ring-red-500"
                  : "border-[#D8D2C5] hover:border-[#226192]/50",
                className
              )
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#5A6065]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
