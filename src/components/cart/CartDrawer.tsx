"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "@/context/StoreContext";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Tag,
  Truck,
  Sparkles,
} from "lucide-react";
import { LUXURY_EASE, drawerSlideRight } from "@/lib/animations";

export function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cart,
    cartCount,
    removeFromCart,
    updateQuantity,
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    cartSubtotal,
    discountAmount,
    shippingFee,
    taxAmount,
    cartTotal,
    brandConfig,
  } = useStore();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  const freeShippingThreshold = brandConfig.freeShippingThreshold;
  const progressToFreeShipping = Math.min(
    100,
    Math.round((cartSubtotal / freeShippingThreshold) * 100)
  );
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponError("");
      setCouponInput("");
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop with Smooth Fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
            onClick={closeCart}
          />

          {/* Slide-over Panel with Luxury Spring Physics */}
          <motion.div
            variants={drawerSlideRight}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-y-0 right-0 max-w-md w-full bg-[#F8F5EF] z-50 shadow-2xl flex flex-col border-l border-[#DED6CB]"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#DED6CB] flex items-center justify-between bg-[#EAE6DE]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#102B3A]" />
                <h2 className="font-serif text-lg font-bold text-[#102B3A]">
                  My Shopping Bag ({cartCount})
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-[#77716A] hover:text-[#EF8557] transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={closeCart}
                  className="p-1.5 text-[#171717] hover:text-[#EF8557] rounded-full transition-colors"
                  aria-label="Close bag"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Free Shipping Progress Indicator */}
            <div className="bg-[#102B3A] text-white px-6 py-3.5 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 font-medium">
                  <Truck className="w-4 h-4 text-[#EF8557]" />
                  {cartSubtotal >= freeShippingThreshold
                    ? "You unlocked FREE Express Delivery!"
                    : `Add ₹${remainingForFreeShipping.toLocaleString("en-IN")} more for FREE Delivery`}
                </span>
                <span className="font-bold text-[#EF8557]">{progressToFreeShipping}%</span>
              </div>
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  className="bg-[#EF8557] h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToFreeShipping}%` }}
                  transition={{ duration: 0.6, ease: LUXURY_EASE }}
                />
              </div>
            </div>

            {/* Cart Items List with Smooth Item Removal Animations */}
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#EBE5DC]">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#EAE6DE] flex items-center justify-center text-[#77716A]">
                    <ShoppingBag className="w-8 h-8 opacity-60" />
                  </div>
                  <div>
                    <p className="font-serif text-lg font-bold text-[#102B3A]">
                      Your bag is empty
                    </p>
                    <p className="text-xs text-[#77716A] mt-1 max-w-xs">
                      Explore our festive sarees, bridal lehengas, and royal heritage couture.
                    </p>
                  </div>
                  <button
                    onClick={closeCart}
                    className="px-6 py-2.5 bg-[#102B3A] text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-[#1A3E54] transition-all hover:scale-105 shadow-md"
                  >
                    Start Exploring
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {cart.map((item, index) => (
                    <motion.div
                      key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}-${index}`}
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, x: 20 }}
                      transition={{ duration: 0.35, ease: LUXURY_EASE }}
                      className="py-4 flex gap-4 overflow-hidden"
                    >
                      {/* Thumbnail */}
                      <div className="w-20 h-24 rounded-xl overflow-hidden bg-[#EAE6DE] shrink-0 border border-[#DED6CB]">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between">
                            <h4 className="font-serif text-sm font-semibold text-[#171717] line-clamp-1">
                              {item.product.name}
                            </h4>
                            <button
                              onClick={() =>
                                removeFromCart(item.product.id, item.selectedColor, item.selectedSize)
                              }
                              className="text-[#77716A] hover:text-red-600 transition-colors p-1"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-[#77716A] mt-0.5">
                            Color: {item.selectedColor} • Size: {item.selectedSize}
                          </p>
                          <p className="text-xs font-semibold text-[#102B3A] mt-1">
                            ₹{item.product.price.toLocaleString("en-IN")}
                          </p>
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-[#DED6CB] rounded-lg bg-white shadow-2xs">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.selectedColor,
                                  item.selectedSize,
                                  item.quantity - 1
                                )
                              }
                              className="p-1 text-[#77716A] hover:text-[#171717] transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-[#171717]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.selectedColor,
                                  item.selectedSize,
                                  item.quantity + 1
                                )
                              }
                              className="p-1 text-[#77716A] hover:text-[#171717] transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-xs font-bold text-[#102B3A]">
                            ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer & Checkout Area */}
            {cart.length > 0 && (
              <div className="px-6 py-5 border-t border-[#DED6CB] bg-[#EAE6DE]/70 space-y-4">
                {/* Coupon Code Section */}
                <div>
                  {appliedCoupon ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-between bg-green-50 border border-green-200 px-3 py-2 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-1.5 text-green-800 font-medium">
                        <Tag className="w-3.5 h-3.5 text-green-600" />
                        <span>Coupon <strong>{appliedCoupon.code}</strong> applied (-₹{discountAmount.toLocaleString("en-IN")})</span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Coupon Code (e.g. FESTIVE15)"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value);
                            setCouponError("");
                          }}
                          className="w-full pl-3 pr-2 py-2 bg-white border border-[#DED6CB] rounded-xl text-xs uppercase placeholder:normal-case placeholder-[#77716A] focus:outline-none focus:ring-1 focus:ring-[#EF8557]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#102B3A] text-white text-xs font-semibold rounded-xl hover:bg-[#1A3E54] transition-all hover:scale-102 active:scale-98 shadow-xs"
                      >
                        Apply
                      </button>
                    </form>
                  )}
                  {couponError && (
                    <p className="text-[11px] text-red-600 mt-1">{couponError}</p>
                  )}
                </div>

                {/* Price Calculations */}
                <div className="space-y-1.5 text-xs text-[#77716A]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-[#171717] font-medium">
                      ₹{cartSubtotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-700 font-medium">
                      <span>Discount</span>
                      <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {shippingFee === 0 ? (
                        <span className="text-green-700 font-semibold">FREE</span>
                      ) : (
                        `₹${shippingFee}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated GST (5%)</span>
                    <span>₹{taxAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#102B3A] pt-2 border-t border-[#DED6CB]">
                    <span>Total Amount</span>
                    <span className="font-serif text-base">₹{cartTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full py-4 bg-[#EF8557] hover:bg-[#DF7446] text-white font-medium text-xs tracking-wider uppercase rounded-xl transition-all duration-300 shadow-lg shadow-[#EF8557]/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Proceed to Checkout • ₹{cartTotal.toLocaleString("en-IN")}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
