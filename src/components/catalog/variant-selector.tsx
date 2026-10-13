"use client";

import React from "react";
import { ProductVariant } from "@/shared/types";
import { Check } from "lucide-react";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant;
  onSelectVariant: (variant: ProductVariant) => void;
  onOpenSizeGuide: () => void;
}

export function VariantSelector({
  variants,
  selectedVariant,
  onSelectVariant,
  onOpenSizeGuide,
}: VariantSelectorProps) {
  // Extract unique colors
  const uniqueColors = Array.from(
    new Map(variants.map((v) => [v.colorName, v])).values()
  );

  // Extract unique sizes
  const uniqueSizes = Array.from(
    new Map(variants.map((v) => [v.size, v])).values()
  );

  const handleColorChange = (colorName: string) => {
    // Find variant with matching color and preferred size
    const matched =
      variants.find(
        (v) => v.colorName === colorName && v.size === selectedVariant.size
      ) || variants.find((v) => v.colorName === colorName);

    if (matched) onSelectVariant(matched);
  };

  const handleSizeChange = (size: ProductVariant["size"]) => {
    const matched =
      variants.find(
        (v) => v.size === size && v.colorName === selectedVariant.colorName
      ) || variants.find((v) => v.size === size);

    if (matched) onSelectVariant(matched);
  };

  return (
    <div className="space-y-6">
      {/* Color Selector */}
      {uniqueColors.length > 1 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#5A6065] uppercase tracking-wider font-medium">
              Color: <strong className="text-[#1A1D20]">{selectedVariant.colorName}</strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {uniqueColors.map((colorVar) => {
              const isSelected = selectedVariant.colorName === colorVar.colorName;
              return (
                <button
                  key={colorVar.id}
                  onClick={() => handleColorChange(colorVar.colorName)}
                  className={`group relative flex items-center gap-2 px-3 py-1.5 border rounded-xs transition-all ${
                    isSelected
                      ? "border-[#226192] bg-[#F6F4F0] ring-1 ring-[#226192]"
                      : "border-[#E2DDD3] bg-white hover:border-[#226192]/60"
                  }`}
                  aria-label={`Select color ${colorVar.colorName}`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                    style={{ backgroundColor: colorVar.colorHex }}
                  />
                  <span className="text-xs font-medium text-[#1A1D20]">
                    {colorVar.colorName}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#226192]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#5A6065] uppercase tracking-wider font-medium">
            Size: <strong className="text-[#1A1D20]">{selectedVariant.size}</strong>
          </span>
          <button
            onClick={onOpenSizeGuide}
            className="text-[#226192] hover:underline font-medium"
          >
            Size Guide
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {uniqueSizes.map((sizeVar) => {
            const isSelected = selectedVariant.size === sizeVar.size;
            const inStock = sizeVar.inventoryQuantity > 0;

            return (
              <button
                key={sizeVar.id}
                disabled={!inStock}
                onClick={() => handleSizeChange(sizeVar.size)}
                className={`min-w-12 h-10 px-3 flex items-center justify-center text-xs font-semibold rounded-xs border transition-all ${
                  isSelected
                    ? "border-[#226192] bg-[#226192] text-white shadow-xs"
                    : inStock
                    ? "border-[#E2DDD3] bg-white text-[#1A1D20] hover:border-[#226192]"
                    : "border-[#E2DDD3]/50 bg-[#F6F4F0] text-[#5A6065]/40 line-through cursor-not-allowed"
                }`}
                aria-label={`Size ${sizeVar.size} ${!inStock ? "(Out of Stock)" : ""}`}
              >
                {sizeVar.size === "FREE_SIZE" ? "Free Size (6.3m)" : sizeVar.size}
              </button>
            );
          })}
        </div>

        {/* Stock status indicator */}
        <div className="text-[11px] pt-1">
          {selectedVariant.inventoryQuantity > 0 ? (
            <span className="text-emerald-700 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              In stock — Ready for express atelier dispatch
            </span>
          ) : (
            <span className="text-rose-600 font-medium">
              Made-to-order (7-10 days craftsmanship window)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
