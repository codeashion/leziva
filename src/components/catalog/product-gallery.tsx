"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ProductImage } from "@/shared/types";
import { ZoomIn } from "lucide-react";

interface ProductGalleryProps {
  images: ProductImage[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeImage = images[selectedIndex] || images[0];

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[3/4] w-full bg-[#EAE6DE] rounded-xs flex items-center justify-center text-xs text-[#5A6065]">
        No imagery available
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails list */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[600px] py-1">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-16 sm:w-20 aspect-[3/4] flex-shrink-0 bg-[#EAE6DE] rounded-xs overflow-hidden border-2 transition-all ${
                selectedIndex === idx
                  ? "border-[#226192] shadow-xs"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
              aria-label={`View ${img.altText || `${title} image ${idx + 1}`}`}
            >
              <Image
                src={img.url}
                alt={img.altText || `${title} thumbnail ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Feature Image */}
      <div className="relative flex-1 aspect-[3/4] bg-[#EAE6DE] rounded-xs overflow-hidden group">
        <Image
          src={activeImage.url}
          alt={activeImage.altText || `${title} view`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-center transition-transform duration-500 ease-editorial group-hover:scale-105"
        />

        <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-xs p-2 rounded-full text-[#1A1D20] opacity-0 group-hover:opacity-100 transition-opacity shadow-xs pointer-events-none">
          <ZoomIn className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
