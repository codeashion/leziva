"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Product } from "@/shared/types";
import { useWishlist } from "@/context/wishlist-context";
import { useToast } from "@/context/toast-context";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { success, info } = useToast() as {
    success: (t: string, m?: string) => void;
    info?: (t: string, m?: string) => void;
    toast: (t: string, m?: string) => void;
  };
  const [isHovered, setIsHovered] = useState(false);

  const primaryImage = product.images[0]?.url || "/images/catalog/cat_sarees.jpg";
  const secondaryImage = product.images[1]?.url;
  const isWishlisted = isInWishlist(product.id);

  const firstVariant = product.variants[0];
  const price = firstVariant?.price || 0;
  const compareAtPrice = firstVariant?.compareAtPrice;

  // Calculate discount percentage
  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    if (!isWishlisted) {
      success("Saved to Wishlist", `${product.title} has been added.`);
    } else if (info) {
      info("Removed from Wishlist", `${product.title} has been removed.`);
    }
  };

  return (
    <article
      className="group relative flex flex-col bg-white border border-[#E2DDD3]/60 rounded-xs overflow-hidden transition-all duration-300 hover:shadow-editorial-md hover:border-[#226192]/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Frame */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[3/4] w-full overflow-hidden bg-[#EAE6DE]"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Image
          src={primaryImage}
          alt={product.images[0]?.altText || product.title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover object-center transition-all duration-700 ease-editorial ${
            secondaryImage && isHovered ? "opacity-0 scale-105" : "opacity-100 scale-100"
          }`}
        />

        {secondaryImage && (
          <Image
            src={secondaryImage}
            alt={product.images[1]?.altText || `${product.title} Detail`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover object-center transition-all duration-700 ease-editorial ${
              isHovered ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          />
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {discountPercent && (
            <span className="bg-[#EF8557] text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-2xs shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-[#226192] text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-2xs shadow-xs">
              Atelier Pick
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-2.5 right-2.5 z-10 p-2 rounded-full backdrop-blur-md transition-all duration-200 ${
            isWishlisted
              ? "bg-[#EF8557] text-white shadow-md"
              : "bg-white/80 text-[#1A1D20] hover:bg-white hover:text-[#EF8557]"
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-75 ${
              isWishlisted ? "fill-white" : ""
            }`}
          />
        </button>
      </Link>

      {/* Product Details */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between bg-white">
        <div className="space-y-1">
          {/* Category Tag */}
          <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#226192]">
            {product.category?.name || "Atelier Silhouette"}
          </span>

          {/* Product Title */}
          <h3 className="font-serif text-sm sm:text-base font-medium text-[#1A1D20] line-clamp-1 group-hover:text-[#226192] transition-colors">
            <Link href={`/products/${product.slug}`} className="focus:outline-none focus-visible:underline">
              {product.title}
            </Link>
          </h3>
        </div>

        {/* Colors & Pricing */}
        <div className="pt-3 border-t border-[#E2DDD3]/40 mt-3 flex items-center justify-between gap-2">
          {/* Pricing */}
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-sm sm:text-base font-bold text-[#1A1D20]">
              ₹{price.toLocaleString("en-IN")}
            </span>
            {compareAtPrice && compareAtPrice > price && (
              <span className="text-xs text-[#5A6065] line-through">
                ₹{compareAtPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Color preview dots */}
          {product.variants.length > 0 && (
            <div className="flex items-center -space-x-1" aria-label="Available Colors">
              {product.variants.slice(0, 3).map((v) => (
                <span
                  key={v.id}
                  title={v.colorName}
                  className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                  style={{ backgroundColor: v.colorHex }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
