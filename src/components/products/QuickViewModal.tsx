"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "@/context/StoreContext";
import { X, Star, Heart, Check, Plus, Minus, ArrowRight, ShieldCheck } from "lucide-react";
import { modalPop, LUXURY_EASE } from "@/lib/animations";

export function QuickViewModal() {
  const { quickViewProduct, closeQuickView, addToCart, isInWishlist, toggleWishlist } = useStore();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const wishlisted = isInWishlist(product.id);
  const currentColor = selectedColor || product.colorName;
  const currentSize = selectedSize || product.sizes[0] || "Free Size";

  const handleAddToCart = () => {
    addToCart(product, currentColor, currentSize, quantity);
    setIsAddedFeedback(true);
    setTimeout(() => {
      setIsAddedFeedback(false);
      closeQuickView();
    }, 500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={closeQuickView}
    >
      <motion.div
        variants={modalPop}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative w-full max-w-4xl bg-[#F8F5EF] rounded-3xl shadow-2xl border border-[#DED6CB] overflow-hidden max-h-[90vh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeQuickView}
          className="absolute top-4 right-4 z-10 p-2.5 text-[#171717]/70 hover:text-[#171717] bg-white/80 hover:bg-white rounded-full transition-all shadow-md cursor-pointer"
          aria-label="Close Quick View"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gallery Column with Crossfade */}
        <div className="md:w-1/2 p-6 flex flex-col items-center justify-between bg-[#EAE6DE]/50">
          <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-inner bg-[#EAE6DE] relative">
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedImageIndex}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: LUXURY_EASE }}
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
            </AnimatePresence>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2.5 mt-4 overflow-x-auto py-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-14 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedImageIndex === idx
                      ? "border-[#EF8557] scale-105 shadow-sm"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Column */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest font-semibold text-[#77716A]">
                {product.categoryDisplayName} • {product.fabric}
              </span>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => toggleWishlist(product.id)}
                className="p-1.5 text-[#171717] hover:text-[#EF8557] transition-colors cursor-pointer"
                title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
              >
                <Heart className={`w-5 h-5 ${wishlisted ? "fill-[#EF8557] text-[#EF8557]" : ""}`} />
              </motion.button>
            </div>

            <h2 className="mt-2 text-2xl font-serif font-bold text-[#102B3A]">{product.name}</h2>

            {/* Ratings */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-[#171717]">{product.rating}</span>
              <span className="text-xs text-[#77716A]">({product.reviewCount} reviews)</span>
            </div>

            {/* Pricing */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-serif font-bold text-[#102B3A]">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-[#77716A] line-through">
                  ₹{product.originalPrice.toLocaleString("en-IN")}
                </span>
              )}
              {product.discountPercentage && (
                <span className="text-xs font-bold text-[#EF8557] bg-[#EF8557]/10 px-2 py-0.5 rounded-full uppercase">
                  {product.discountPercentage}% OFF
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-[#77716A] leading-relaxed line-clamp-3">
              {product.description}
            </p>

            {/* Color Selection */}
            {product.availableColors && product.availableColors.length > 0 && (
              <div className="mt-5">
                <label className="text-xs font-semibold text-[#171717] block mb-2">
                  Color: <span className="text-[#77716A] font-normal">{currentColor}</span>
                </label>
                <div className="flex items-center gap-2.5">
                  {product.availableColors.map((col) => (
                    <motion.button
                      key={col.name}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedColor(col.name)}
                      className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                        currentColor === col.name
                          ? "border-[#102B3A] ring-2 ring-[#EF8557] scale-105"
                          : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: col.hex }}
                    >
                      {currentColor === col.name && (
                        <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-5">
                <label className="text-xs font-semibold text-[#171717] block mb-2">Select Size</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((sz) => (
                    <motion.button
                      key={sz}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                        currentSize === sz
                          ? "bg-[#102B3A] text-white border-[#102B3A] shadow-xs"
                          : "bg-white text-[#171717] border-[#DED6CB] hover:border-[#102B3A]"
                      }`}
                    >
                      {sz}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mt-5 flex items-center gap-4">
              <label className="text-xs font-semibold text-[#171717]">Quantity</label>
              <div className="flex items-center border border-[#DED6CB] rounded-xl bg-white shadow-2xs">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-1.5 text-[#77716A] hover:text-[#171717] cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-xs font-bold text-[#171717]">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-1.5 text-[#77716A] hover:text-[#171717] cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[11px] text-[#168454] font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#168454] animate-ping" />
                In Stock ({product.stockCount} left)
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 pt-5 border-t border-[#DED6CB] space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              className={`w-full py-3.5 text-white font-medium text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                isAddedFeedback ? "bg-[#168454]" : "bg-[#EF8557] hover:bg-[#DF7446]"
              }`}
            >
              {isAddedFeedback ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Bag!</span>
                </>
              ) : (
                <>
                  <span>Add to Bag</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            <div className="flex items-center justify-between text-xs">
              <Link
                href={`/products/${product.slug}`}
                onClick={closeQuickView}
                className="text-[#226192] hover:text-[#102B3A] font-semibold underline underline-offset-4"
              >
                View Complete Product Details →
              </Link>
              <span className="text-[#77716A] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#168454]" /> Verified Authentic
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
