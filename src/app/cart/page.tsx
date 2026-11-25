"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  Truck,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function CartPage() {
  const {
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

  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");

  const freeShippingThreshold = brandConfig.freeShippingThreshold;
  const progressToFreeShipping = Math.min(
    100,
    Math.round((cartSubtotal / freeShippingThreshold) * 100)
  );
  const remaining = Math.max(0, freeShippingThreshold - cartSubtotal);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const res = applyCoupon(couponCode);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponError("");
      setCouponCode("");
    }
  };

  return (
    <div className="bg-[#EAE6DE] min-h-screen pb-20">
      {/* Breadcrumb */}
      <div className="bg-[#F8F5EF] border-b border-[#DED6CB] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center text-xs text-[#77716A] space-x-2">
            <Link href="/" className="hover:text-[#102B3A]">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#102B3A] font-semibold">Shopping Bag</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#102B3A]">
              My Shopping Bag
            </h1>
            <p className="text-xs text-[#77716A] mt-1">
              Review your luxury selections before proceed to secure checkout.
            </p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-[#77716A] hover:text-[#EF8557] underline transition-colors"
            >
              Clear Bag
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="bg-[#F8F5EF] rounded-2xl border border-[#DED6CB] p-12 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#EAE6DE] flex items-center justify-center mx-auto text-[#77716A]">
              <ShoppingBag className="w-8 h-8 opacity-60" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#102B3A]">
              Your Bag is Empty
            </h2>
            <p className="text-xs text-[#77716A]">
              Discover our timeless handloom Banarasi sarees, opulent bridal lehengas, and royal festive couture.
            </p>
            <div className="pt-2">
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#102B3A] text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#1A3E54] transition-colors"
              >
                <span>Browse Collections</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Items Column */}
            <div className="lg:col-span-8 space-y-4">
              {/* Shipping Notification Banner */}
              <div className="bg-[#102B3A] text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5 text-xs">
                  <Truck className="w-5 h-5 text-[#EF8557] shrink-0" />
                  <span>
                    {cartSubtotal >= freeShippingThreshold
                      ? "You have qualified for complimentary express delivery across India!"
                      : `Add ₹${remaining.toLocaleString("en-IN")} more to unlock free express shipping.`}
                  </span>
                </div>
                <div className="w-full sm:w-32 bg-white/20 h-2 rounded-full overflow-hidden shrink-0">
                  <div
                    className="bg-[#EF8557] h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressToFreeShipping}%` }}
                  />
                </div>
              </div>

              {/* Items Card */}
              <div className="bg-[#F8F5EF] rounded-2xl border border-[#DED6CB] divide-y divide-[#DED6CB] overflow-hidden shadow-sm">
                {cart.map((item, index) => (
                  <div
                    key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}-${index}`}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-lg overflow-hidden bg-[#EAE6DE] border border-[#DED6CB] shrink-0">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-[#77716A]">
                          {item.product.categoryDisplayName}
                        </span>
                        <Link href={`/products/${item.product.slug}`}>
                          <h3 className="font-serif text-base font-bold text-[#102B3A] hover:text-[#EF8557] transition-colors">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-[#77716A] mt-0.5">
                          Color: <strong>{item.selectedColor}</strong> • Size:{" "}
                          <strong>{item.selectedSize}</strong>
                        </p>
                        <p className="text-xs font-semibold text-[#102B3A] mt-1 sm:hidden">
                          ₹{item.product.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-[#DED6CB] rounded-lg bg-white">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.selectedColor,
                              item.selectedSize,
                              item.quantity - 1
                            )
                          }
                          className="p-1.5 text-[#77716A] hover:text-[#102B3A]"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-[#171717]">
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
                          className="p-1.5 text-[#77716A] hover:text-[#102B3A]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right">
                        <p className="font-serif text-base font-bold text-[#102B3A]">
                          ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                        </p>
                        <button
                          onClick={() =>
                            removeFromCart(item.product.id, item.selectedColor, item.selectedSize)
                          }
                          className="text-xs text-red-600 hover:underline flex items-center gap-1 mt-1 justify-end ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Summary Column */}
            <div className="lg:col-span-4 bg-[#F8F5EF] p-6 sm:p-7 rounded-2xl border border-[#DED6CB] shadow-md space-y-6 sticky top-28">
              <h2 className="font-serif text-xl font-bold text-[#102B3A] pb-3 border-b border-[#DED6CB]">
                Order Summary
              </h2>

              {/* Coupon Form */}
              <div>
                {appliedCoupon ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-green-800">Coupon: {appliedCoupon.code}</p>
                      <p className="text-green-700 text-[11px]">{appliedCoupon.description}</p>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-red-500 hover:text-red-700 font-semibold text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#171717] block">
                      Promotional Voucher
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. FESTIVE15"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value);
                          setCouponError("");
                        }}
                        className="w-full px-3 py-2 bg-white border border-[#DED6CB] rounded-lg text-xs uppercase placeholder:normal-case placeholder-[#77716A] focus:outline-none focus:ring-1 focus:ring-[#EF8557]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#102B3A] text-white text-xs font-semibold rounded-lg hover:bg-[#1A3E54] transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-red-600 mt-1">{couponError}</p>
                    )}
                  </form>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs text-[#77716A] pt-4 border-t border-[#DED6CB]">
                <div className="flex justify-between">
                  <span>Bag Subtotal ({cartCount} items)</span>
                  <span className="font-semibold text-[#171717]">
                    ₹{cartSubtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-700 font-semibold">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
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
                <div className="flex justify-between text-base font-bold text-[#102B3A] pt-3 border-t border-[#DED6CB]">
                  <span>Total Amount</span>
                  <span className="font-serif text-xl">₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Checkout Action */}
              <Link
                href="/checkout"
                className="w-full py-4 bg-[#EF8557] hover:bg-[#DF7446] text-white font-medium text-xs sm:text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-[#EF8557]/20 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="flex items-center justify-center gap-2 text-xs text-[#77716A] pt-2">
                <ShieldCheck className="w-4 h-4 text-[#168454]" />
                <span>Safe 256-Bit Encrypted Indian Payment Gateway</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
