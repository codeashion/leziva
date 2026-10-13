"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";

export function CartDrawer() {
  const {
    items,
    itemCount,
    subtotal,
    isCartOpen,
    closeCart,
    removeItem,
    updateQuantity,
    isFreeShippingEligible,
    amountUntilFreeShipping,
    freeShippingThreshold,
  } = useCart();

  // Escape key support and scroll lock
  useEffect(() => {
    if (!isCartOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  const progressPercent = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative z-10 w-full max-w-md bg-[#FDFBF7] h-full shadow-2xl flex flex-col justify-between border-l border-[#E2DDD3] animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#E2DDD3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-semibold text-[#1A1D20]">
              Shopping Bag
            </h3>
            <span className="text-xs text-[#5A6065]">
              ({itemCount} {itemCount === 1 ? "piece" : "pieces"})
            </span>
          </div>
          <button
            onClick={closeCart}
            aria-label="Close shopping bag"
            className="p-1.5 text-[#5A6065] hover:text-[#1A1D20] rounded-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="bg-[#EAE6DE]/40 px-6 py-3 border-b border-[#E2DDD3] text-xs">
          {isFreeShippingEligible ? (
            <p className="text-emerald-700 font-medium">
              ✨ You have unlocked complimentary express atelier delivery!
            </p>
          ) : (
            <p className="text-[#5A6065]">
              Add{" "}
              <strong className="text-[#1A1D20]">
                ₹{amountUntilFreeShipping.toLocaleString("en-IN")}
              </strong>{" "}
              more to qualify for complimentary express delivery.
            </p>
          )}
          <div className="w-full bg-[#E2DDD3] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[#226192] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#EAE6DE] flex items-center justify-center text-[#226192]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="font-serif text-lg text-[#1A1D20]">
                  Your bag is currently empty
                </p>
                <p className="text-xs text-[#5A6065] max-w-xs">
                  Discover our handcrafted sarees, bespoke lehengas, and contemporary silhouettes.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={closeCart}
                asChild
              >
                <Link href="/shop">Explore Collections</Link>
              </Button>
            </div>
          ) : (
            items.map((item) => {
              const imgUrl = item.product.images[0]?.url || "/images/catalog/cat_sarees.jpg";
              return (
                <div
                  key={item.id}
                  className="flex gap-4 pb-4 border-b border-[#E2DDD3]/60 last:border-b-0"
                >
                  <div className="relative w-20 h-24 flex-shrink-0 bg-[#EAE6DE] rounded-xs overflow-hidden">
                    <Image
                      src={imgUrl}
                      alt={item.product.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.product.slug}`}
                          onClick={closeCart}
                          className="font-serif text-sm font-medium text-[#1A1D20] hover:text-[#226192] line-clamp-1 transition-colors"
                        >
                          {item.product.title}
                        </Link>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[#5A6065] hover:text-[#D92D20] p-1 transition-colors"
                          aria-label={`Remove ${item.product.title} from bag`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-[#5A6065] mt-0.5">
                        {item.variant.colorName} • Size {item.variant.size}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-[#E2DDD3] rounded-xs bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-[#F6F4F0] text-[#5A6065] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-semibold text-[#1A1D20]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-[#F6F4F0] text-[#5A6065] transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-sm font-semibold text-[#1A1D20]">
                        ₹{(item.variant.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer Actions */}
        {items.length > 0 && (
          <div className="p-6 border-t border-[#E2DDD3] bg-white space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#5A6065]">Subtotal</span>
              <span className="font-serif text-lg font-bold text-[#1A1D20]">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-[11px] text-[#5A6065]">
              Taxes calculated at checkout. Express shipping included.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="outline" size="md" asChild onClick={closeCart}>
                <Link href="/cart">View Full Bag</Link>
              </Button>

              <Button
                variant="primary"
                size="md"
                asChild
                onClick={closeCart}
                className="group"
              >
                <Link href="/checkout">
                  Checkout
                  <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
