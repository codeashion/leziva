"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Trash2, ShoppingBag } from "lucide-react";
import { useWishlist } from "@/context/wishlist-context";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/context/toast-context";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const { items, removeFromWishlist, wishlistCount } = useWishlist();
  const { addItem } = useCart();
  const { success } = useToast();

  const handleMoveToCart = (product: (typeof items)[0]) => {
    const variant = product.variants[0];
    if (variant) {
      addItem(product, variant, 1);
      removeFromWishlist(product.id);
      success("Moved to Bag", `${product.title} has been moved to your shopping bag.`);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#EAE6DE] flex items-center justify-center text-[#EF8557] mx-auto">
          <Heart className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-normal text-[#1A1D20]">
          Your Wishlist is Empty
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6065] max-w-md mx-auto">
          Save your favourite sarees, bespoke lehengas, and evening silhouettes for later review.
        </p>
        <div className="pt-4">
          <Button variant="primary" size="lg" asChild>
            <Link href="/shop">Discover Atelier Pieces</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-[#E2DDD3] pb-4">
        <h1 className="font-serif text-3xl text-[#1A1D20] font-normal">
          My Atelier Wishlist ({wishlistCount} {wishlistCount === 1 ? "piece" : "pieces"})
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {items.map((product) => {
          const primaryImg = product.images[0]?.url || "/images/catalog/cat_sarees.jpg";
          const firstVariant = product.variants[0];
          const price = firstVariant?.price || 0;

          return (
            <div
              key={product.id}
              className="bg-white border border-[#E2DDD3] rounded-xs overflow-hidden flex flex-col justify-between group shadow-xs"
            >
              <div className="relative aspect-[3/4] bg-[#EAE6DE]">
                <Image
                  src={primaryImg}
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
                <button
                  onClick={() => removeFromWishlist(product.id)}
                  aria-label="Remove from wishlist"
                  className="absolute top-2.5 right-2.5 p-2 bg-white/90 hover:bg-white text-[#5A6065] hover:text-[#D92D20] rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#226192] font-semibold">
                    {product.category?.name || "Atelier"}
                  </span>
                  <h3 className="font-serif text-sm font-medium text-[#1A1D20] line-clamp-1 mt-0.5">
                    <Link href={`/products/${product.slug}`} className="hover:text-[#226192]">
                      {product.title}
                    </Link>
                  </h3>
                  <span className="font-serif text-sm font-bold text-[#1A1D20] block mt-1">
                    ₹{price.toLocaleString("en-IN")}
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleMoveToCart(product)}
                  className="w-full bg-[#226192] text-white text-[11px] uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Move to Bag</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
