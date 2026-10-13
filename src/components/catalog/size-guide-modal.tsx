"use client";

import React, { useState, useEffect } from "react";
import { X, Ruler } from "lucide-react";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  const [unit, setUnit] = useState<"in" | "cm">("in");

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Atelier Size Guide"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl bg-[#FDFBF7] rounded-xs shadow-2xl border border-[#E2DDD3] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-[#E2DDD3] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-[#226192]" />
            <h3 className="font-serif text-lg font-semibold text-[#1A1D20]">
              Atelier Size &amp; Measurement Guide
            </h3>
          </div>

          <div className="flex items-center gap-4">
            <div className="inline-flex rounded-xs border border-[#E2DDD3] p-0.5 bg-[#F6F4F0] text-xs">
              <button
                onClick={() => setUnit("in")}
                className={`px-2.5 py-1 rounded-2xs font-medium transition-colors ${
                  unit === "in"
                    ? "bg-[#226192] text-white"
                    : "text-[#5A6065] hover:text-[#1A1D20]"
                }`}
              >
                Inches
              </button>
              <button
                onClick={() => setUnit("cm")}
                className={`px-2.5 py-1 rounded-2xs font-medium transition-colors ${
                  unit === "cm"
                    ? "bg-[#226192] text-white"
                    : "text-[#5A6065] hover:text-[#1A1D20]"
                }`}
              >
                CM
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-[#5A6065] hover:text-[#1A1D20]"
              aria-label="Close size guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 text-xs text-[#1A1D20]">
          {/* Sarees */}
          <div className="space-y-2">
            <h4 className="font-serif text-sm font-semibold text-[#226192]">
              1. Sarees (Standard Atelier Dimensions)
            </h4>
            <p className="text-[#5A6065]">
              All LEZIVA sarees come with standard 5.5 meters body length plus an unstitched 0.8 meter blouse fabric piece (total 6.3 meters). Width is 45 inches ({unit === "in" ? '45"' : "114 cm"}). Fits all heights and body contours.
            </p>
          </div>

          {/* Lehengas & Dresses */}
          <div className="space-y-2">
            <h4 className="font-serif text-sm font-semibold text-[#226192]">
              2. Lehengas &amp; Dresses Standard Sizing
            </h4>
            <div className="overflow-x-auto border border-[#E2DDD3] rounded-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#EAE6DE]/50 border-b border-[#E2DDD3] font-semibold text-[#226192]">
                    <th className="p-2.5">Size</th>
                    <th className="p-2.5">Bust ({unit})</th>
                    <th className="p-2.5">Waist ({unit})</th>
                    <th className="p-2.5">Hip ({unit})</th>
                    <th className="p-2.5">Lehenga Length ({unit})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD3]/50">
                  <tr>
                    <td className="p-2.5 font-bold">XS</td>
                    <td className="p-2.5">{unit === "in" ? '32"' : "81 cm"}</td>
                    <td className="p-2.5">{unit === "in" ? '26"' : "66 cm"}</td>
                    <td className="p-2.5">{unit === "in" ? '36"' : "91 cm"}</td>
                    <td className="p-2.5">{unit === "in" ? '42"' : "106 cm"}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">S</td>
                    <td className="p-2.5">{unit === "in" ? '34"' : "86 cm"}</td>
                    <td className="p-2.5">{unit === "in" ? '28"' : "71 cm"}</td>
                    <td className="p-2.5">{unit === "in" ? '38"' : "96 cm"}</td>
                    <td className="p-2.5">{unit === "in" ? '42"' : "106 cm"}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">M</td>
                    <td className="p-2.5">{unit === "in" ? '36"' : "91 cm"}</td>
                    <td className="p-2.5">{unit === "in" ? '30"' : "76 cm"}</td>
                    <td className="p-2.5">{unit === "in" ? '40"' : "101 cm"}</td>
                    <td className="p-2.5">{unit === "in" ? '43"' : "109 cm"}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">L</td>
                    <td className="p-2.5">{unit === "in" ? '38"' : "96 cm"}</td>
                    <td className="p-2.5">{unit === "in" ? '32"' : "81 cm"}</td>
                    <td className="p-2.5">{unit === "in" ? '42"' : "106 cm"}</td>
                    <td className="p-2.5">{unit === "in" ? '43"' : "109 cm"}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">XL</td>
                    <td className="p-2.5">{unit === "in" ? '40"' : "101 cm"}</td>
                    <td className="p-2.5">{unit === "in" ? '34"' : "86 cm"}</td>
                    <td className="p-2.5">{unit === "in" ? '44"' : "111 cm"}</td>
                    <td className="p-2.5">{unit === "in" ? '44"' : "111 cm"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#EAE6DE]/30 p-4 rounded-xs border border-[#E2DDD3]/60 space-y-1">
            <h5 className="font-semibold text-[#1A1D20]">Bespoke Custom Tailoring</h5>
            <p className="text-[#5A6065]">
              Every bridal and couture piece includes 2 inches of margin on both sides for effortless alteration by your local tailor or our Surat atelier concierge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
