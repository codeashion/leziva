import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BRAND_IDENTITY } from "@/config/brand";

interface LogoProps {
  variant?: "full" | "compact" | "symbol";
  className?: string;
  asLink?: boolean;
  priority?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({
  variant = "full",
  className = "",
  asLink = true,
  priority = false,
  size = "md",
}: LogoProps) {
  const sizeClasses = {
    sm: "h-8 sm:h-9",
    md: "h-11 sm:h-12",
    lg: "h-14 sm:h-16",
  };

  const content = (
    <div className={`flex items-center select-none ${className}`}>
      {variant === "symbol" ? (
        <div className="relative w-10 h-10 aspect-square">
          <Image
            src={BRAND_IDENTITY.assets.logoSymbol}
            alt="LEZIVA Monogram"
            width={40}
            height={40}
            className="w-full h-full object-contain"
            priority={priority}
          />
        </div>
      ) : (
        <div className={`relative ${sizeClasses[size]} w-auto aspect-[300/111] flex items-center`}>
          <Image
            src={BRAND_IDENTITY.assets.logoOfficial}
            alt="LEZIVA — Unique. Elegant. Authentic."
            width={300}
            height={111}
            className="h-full w-auto object-contain"
            priority={priority}
          />
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link
        href="/"
        aria-label="LEZIVA - Return to home"
        className="inline-flex items-center transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226192] rounded"
      >
        {content}
      </Link>
    );
  }

  return content;
}
