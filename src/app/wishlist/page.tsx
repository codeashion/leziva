"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/products/ProductCard";
import { Heart, ArrowRight, ChevronRight, ShoppingBag } from "lucide-react";

export default function WishlistPage() {
  const { wishlist, products } = useStore();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

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
            <span className="text-[#102B3A] font-semibold">My Wishlist</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#102B3A]">
            My Wishlist ({wishlistedProducts.length})
          </h1>
          <p className="text-xs text-[#77716A] mt-1">
            Curated pieces saved for your upcoming celebrations and weddings.
          </p>
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="bg-[#F8F5EF] rounded-2xl border border-[#DED6CB] p-12 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#EAE6DE] flex items-center justify-center mx-auto text-[#77716A]">
              <Heart className="w-8 h-8 opacity-60" />
            </div>
            <h2 className="font-serif text-xl font-bold text-[#102B3A]">
              Your Wishlist is Empty
            </h2>
            <p className="text-xs text-[#77716A]">
              Tap the heart icon on any saree, lehenga, or kurta to save your favorite garments here.
            </p>
            <div className="pt-2">
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#EF8557] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-md"
              >
                <span>Discover Creations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {wishlistedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} showSizes={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
