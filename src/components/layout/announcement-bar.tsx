"use client";

import React, { useState } from "react";
import { Sparkles, X } from "lucide-react";

interface AnnouncementBarProps {
  message?: string;
  linkText?: string;
  linkHref?: string;
}

export function AnnouncementBar({
  message = "Complimentary Insured Express Delivery Across India on Orders Above ₹2,999",
  linkText,
  linkHref,
}: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Announcement"
      className="bg-[#164366] text-[#EAE6DE] px-4 py-2 text-xs font-medium tracking-[0.16em] uppercase flex items-center justify-between relative z-50 border-b border-[#226192]/40"
    >
      <div className="flex-1 flex items-center justify-center gap-2 text-center">
        <Sparkles className="w-3.5 h-3.5 text-[#EF8557] flex-shrink-0" />
        <span>{message}</span>
        {linkText && linkHref && (
          <a
            href={linkHref}
            className="underline underline-offset-4 hover:text-[#EF8557] transition-colors ml-1 font-semibold"
          >
            {linkText}
          </a>
        )}
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="text-[#EAE6DE]/70 hover:text-[#EAE6DE] p-1 transition-colors"
        aria-label="Dismiss announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </aside>
  );
}
