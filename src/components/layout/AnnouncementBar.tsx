"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "@/context/StoreContext";
import { Sparkles, X, Gift, ShieldCheck } from "lucide-react";

const ANNOUNCEMENT_MESSAGES = [
  "Free express shipping on all domestic orders above ₹999 | Use Code: FESTIVE15 for 15% off",
  "Heritage Handlooms Certified: 100% Authentic Varanasi & Kanchipuram Pure Silks",
  "Complimentary 7-Day Doorstep Reverse Pickup & Exchange Across India",
];

export function AnnouncementBar() {
  const { brandConfig } = useStore();
  const [dismissed, setDismissed] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % ANNOUNCEMENT_MESSAGES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  if (dismissed) return null;

  return (
    <aside
      aria-label="Promotional Announcement"
      className="bg-[#102B3A] text-[#F8F5EF] text-xs font-medium tracking-wide py-2.5 px-4 transition-all relative z-50 border-b border-[#226192]/30 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1 flex items-center justify-center gap-2 text-center h-4.5 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="flex items-center gap-2"
            >
              {currentIdx === 0 && <Sparkles className="w-3.5 h-3.5 text-[#EF8557] animate-pulse" />}
              {currentIdx === 1 && <Gift className="w-3.5 h-3.5 text-[#EF8557]" />}
              {currentIdx === 2 && <ShieldCheck className="w-3.5 h-3.5 text-green-400" />}
              <span className="opacity-95 text-[11px] sm:text-xs">
                {currentIdx === 0 ? brandConfig.announcement : ANNOUNCEMENT_MESSAGES[currentIdx]}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <button
          onClick={() => setDismissed(true)}
          className="text-[#F8F5EF]/60 hover:text-white transition-colors p-1 cursor-pointer"
          aria-label="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
