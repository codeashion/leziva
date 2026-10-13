"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Tag } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    removeItem,
    updateQuantity,
    isFreeShippingEligible,
    amountUntilFreeShipping,
    freeShippingThreshold,
  } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [couponNotice, setCouponNotice] = useState<string | null>(null);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponNotice("Coupons and promotional codes will be activated in Phase 4 (Checkout & Payments).");
  };

  const progressPercent = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#EAE6DE] flex items-center justify-center text-[#226192] mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-normal text-[#1A1D20]">
          Your Shopping Bag is Empty
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6065] max-w-md mx-auto">
          Explore our collection of pure silk sarees, handcrafted lehengas, and contemporary silhouettes.
        </p>
        <div className="pt-4">
          <Button variant="primary" size="lg" asChild>
            <Link href="/shop">Explore Collections</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-[#E2DDD3] pb-4">
        <h1 className="font-serif text-3xl text-[#1A1D20] font-normal">
          Shopping Bag ({itemCount} {itemCount === 1 ? "piece" : "pieces"})
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Bag Items List */}
        <div className="lg:col-span-8 space-y-6">
          {/* Free Shipping Alert */}
          <div className="bg-[#EAE6DE]/40 p-4 rounded-xs border border-[#E2DDD3] text-xs">
            {isFreeShippingEligible ? (
              <p className="text-emerald-700 font-medium">
                ✨ Complimentary express atelier delivery unlocked for your order.
              </p>
            ) : (
              <p className="text-[#5A6065]">
                Add <strong className="text-[#1A1D20]">₹{amountUntilFreeShipping.toLocaleString("en-IN")}</strong> more to qualify for complimentary express delivery.
              </p>
            )}
            <div className="w-full bg-[#E2DDD3] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#226192] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="divide-y divide-[#E2DDD3] border-y border-[#E2DDD3]">
            {items.map((item) => {
              const imgUrl = item.product.images[0]?.url || "/images/catalog/cat_sarees.jpg";
              return (
                <div key={item.id} className="py-6 flex gap-4 sm:gap-6">
                  <div className="relative w-24 sm:w-28 aspect-[3/4] flex-shrink-0 bg-[#EAE6DE] rounded-xs overflow-hidden">
                    <Image
                      src={imgUrl}
                      alt={item.product.title}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <Link
                          href={`/products/${item.product.slug}`}
                          className="font-serif text-base sm:text-lg font-medium text-[#1A1D20] hover:text-[#226192] transition-colors"
                        >
                          {item.product.title}
                        </Link>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[#5A6065] hover:text-[#D92D20] p-1"
                          aria-label={`Remove ${item.product.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-xs text-[#5A6065] space-y-0.5 mt-1">
                        <p>
                          Color: <strong className="text-[#1A1D20]">{item.variant.colorName}</strong>
                        </p>
                        <p>
                          Size: <strong className="text-[#1A1D20]">{item.variant.size}</strong>
                        </p>
                        <p>SKU: {item.variant.sku}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-2">
                      <div className="flex items-center border border-[#E2DDD3] rounded-xs bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 hover:bg-[#F6F4F0] text-[#5A6065]"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3.5 text-xs font-semibold text-[#1A1D20]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 hover:bg-[#F6F4F0] text-[#5A6065]"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-serif text-base sm:text-lg font-bold text-[#1A1D20]">
                          ₹{(item.variant.price * item.quantity).toLocaleString("en-IN")}
                        </span>
                        <span className="block text-[11px] text-[#5A6065]">
                          ₹{item.variant.price.toLocaleString("en-IN")} each
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Link
              href="/shop"
              className="text-xs text-[#226192] hover:underline font-medium"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-[#E2DDD3] rounded-xs p-6 space-y-6 sticky top-28 shadow-xs">
            <h3 className="font-serif text-lg font-semibold text-[#1A1D20] border-b border-[#E2DDD3] pb-3">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs text-[#5A6065]">
              <div className="flex justify-between">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-semibold text-[#1A1D20]">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Insured Express Shipping</span>
                <span className="text-emerald-700 font-semibold">
                  {isFreeShippingEligible ? "Complimentary" : "₹150"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated GST (12% Silk Mark)</span>
                <span className="text-[#1A1D20]">Included in price</span>
              </div>
              <div className="pt-3 border-t border-[#E2DDD3] flex justify-between text-sm font-bold text-[#1A1D20]">
                <span>Estimated Total</span>
                <span className="font-serif text-xl">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="space-y-2 pt-2 border-t border-[#E2DDD3]">
              <label htmlFor="coupon" className="text-xs font-semibold text-[#1A1D20] block">
                Promo or Atelier Gift Card
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-[#5A6065] absolute left-3 top-3" />
                  <input
                    id="coupon"
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter code"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-[#FDFBF7] border border-[#E2DDD3] rounded-xs outline-none focus:border-[#226192] uppercase"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EAE6DE] hover:bg-[#DDD7CB] text-[#1A1D20] text-xs font-semibold rounded-xs transition-colors"
                >
                  Apply
                </button>
              </div>
              {couponNotice && (
                <p className="text-[11px] text-[#226192] bg-[#F6F4F0] p-2 rounded-xs border border-[#E2DDD3]">
                  ℹ️ {couponNotice}
                </p>
              )}
            </form>

            {/* Checkout Action */}
            <div className="space-y-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                asChild
                className="w-full bg-[#226192] hover:bg-[#164366] text-white h-12 text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2"
              >
                <Link href="/checkout">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#5A6065]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#226192]" />
                <span>256-Bit SSL Encrypted Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
