import React from "react";
import { Product } from "@/shared/types";
import { ProductCard } from "./product-card";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  emptyMessage?: string;
  onResetFilters?: () => void;
}

export function ProductGrid({
  products,
  isLoading = false,
  emptyMessage = "No handcrafted pieces match your selected criteria.",
  onResetFilters,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col bg-white border border-[#E2DDD3]/60 rounded-xs overflow-hidden animate-pulse"
          >
            <div className="aspect-[3/4] w-full bg-[#EAE6DE]" />
            <div className="p-4 space-y-3">
              <div className="h-3 w-1/3 bg-[#EAE6DE] rounded" />
              <div className="h-4 w-3/4 bg-[#EAE6DE] rounded" />
              <div className="h-4 w-1/2 bg-[#EAE6DE] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-20 px-6 text-center bg-white border border-[#E2DDD3] rounded-xs space-y-4 max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-full bg-[#EAE6DE] text-[#226192] flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6 text-[#EF8557]" />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-medium text-[#1A1D20]">
            No Atelier Pieces Found
          </h3>
          <p className="text-xs text-[#5A6065]">{emptyMessage}</p>
        </div>

        <div className="pt-2">
          {onResetFilters ? (
            <Button variant="outline" size="sm" onClick={onResetFilters}>
              Clear All Filters
            </Button>
          ) : (
            <Button variant="primary" size="sm" asChild>
              <Link href="/shop">Browse All Collections</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product, idx) => (
        <ProductCard key={product.id} product={product} priority={idx < 4} />
      ))}
    </div>
  );
}
