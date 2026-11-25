"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "@/types";
import { useStore } from "@/context/StoreContext";
import { Heart, Eye, ShoppingBag, Check } from "lucide-react";
import { LUXURY_EASE } from "@/lib/animations";

interface ProductCardProps {
  product: Product;
  showSizes?: boolean;
}

export function ProductCard({ product, showSizes = true }: ProductCardProps) {
  const { isInWishlist, toggleWishlist, addToCart, openQuickView } = useStore();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.colorName);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "Free Size");
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);

  const wishlisted = isInWishlist(product.id);
  const hasSecondaryImage = product.images.length > 1;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, selectedColor, selectedSize, 1);
    setIsAddedFeedback(true);
    setTimeout(() => setIsAddedFeedback(false), 1400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: LUXURY_EASE }}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col bg-[#F8F5EF] rounded-2xl overflow-hidden border border-[#DED6CB]/80 hover:border-[#226192]/40 transition-all duration-300 shadow-sm hover:shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container with Crossfade & Slow Hover Zoom */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EAE6DE]">
        <Link href={`/products/${product.slug}`} className="block w-full h-full relative">
          {/* Primary Image */}
          <img
            src={product.images[0]}
            alt={product.name}
            className={`w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-106 ${
              hasSecondaryImage && isHovered ? "opacity-0" : "opacity-100"
            }`}
            loading="lazy"
          />

          {/* Secondary Image with Smooth Fade on Hover */}
          {hasSecondaryImage && (
            <img
              src={product.images[1]}
              alt={`${product.name} alternate angle`}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-106 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
            />
          )}
        </Link>

        {/* Discount Badge */}
        {product.discountPercentage && product.discountPercentage > 0 && (
          <div className="absolute top-3 left-3 bg-[#EF8557] text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md tracking-wider uppercase">
            {product.discountPercentage}% OFF
          </div>
        )}

        {/* Wishlist Button with Scale Bounce Micro-interaction */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-colors shadow-md ${
            wishlisted
              ? "bg-[#EF8557] text-white"
              : "bg-white/85 text-[#171717] hover:bg-white hover:text-[#EF8557]"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 transition-colors ${wishlisted ? "fill-white" : ""}`} />
        </motion.button>

        {/* Quick View & Add to Bag Floating Action Bar */}
        <div
          className={`absolute inset-x-3 bottom-3 flex gap-2 transition-all duration-300 ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
          }`}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openQuickView(product);
            }}
            className="flex-1 py-2.5 px-3 bg-[#102B3A]/95 hover:bg-[#102B3A] text-white text-[11px] font-semibold uppercase tracking-wider rounded-xl backdrop-blur-md flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-[0.98]"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
          
          <button
            onClick={handleQuickAdd}
            title="Quick Add to Bag"
            className={`p-2.5 rounded-xl transition-all shadow-lg text-white active:scale-[0.95] flex items-center justify-center ${
              isAddedFeedback ? "bg-[#168454]" : "bg-[#EF8557] hover:bg-[#DF7446]"
            }`}
          >
            {isAddedFeedback ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Category Tag */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#77716A] mb-1">
            {product.categoryDisplayName}
          </p>

          {/* Product Name */}
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-serif text-sm sm:text-base font-semibold text-[#171717] hover:text-[#226192] transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Price Row */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-base font-bold text-[#102B3A]">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-[#77716A] line-through">
                ₹{product.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>

        {/* Color Swatches */}
        {product.availableColors && product.availableColors.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            {product.availableColors.map((col) => (
              <button
                key={col.name}
                onClick={() => setSelectedColor(col.name)}
                title={col.name}
                aria-label={`Select color ${col.name}`}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  selectedColor === col.name
                    ? "scale-125 ring-2 ring-[#102B3A] ring-offset-1"
                    : "opacity-80 hover:opacity-100 hover:scale-110"
                }`}
                style={{ backgroundColor: col.hex }}
              />
            ))}
          </div>
        )}

        {/* Sizes Pills */}
        {showSizes && product.sizes && product.sizes.length > 1 && (
          <div className="mt-3 pt-3 border-t border-[#DED6CB]/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {product.sizes.map((sz) => (
              <button
                key={sz}
                onClick={() => setSelectedSize(sz)}
                className={`text-[10px] font-medium px-2 py-0.5 rounded border transition-all ${
                  selectedSize === sz
                    ? "bg-[#102B3A] text-white border-[#102B3A]"
                    : "bg-white text-[#77716A] border-[#DED6CB] hover:border-[#171717]"
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
