"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Product, Category } from "@/shared/types";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SlidersHorizontal, ChevronDown, X } from "lucide-react";

interface ShopContentProps {
  initialProducts: Product[];
  categories: Category[];
  total: number;
  initialCategory?: string;
  initialSort?: string;
  initialSearch?: string;
}

export function ShopContent({
  initialProducts,
  categories,
  total,
  initialCategory,
  initialSort = "recommended",
  initialSearch,
}: ShopContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "");
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

  const handleApplyFilters = (newCat?: string, newSort?: string) => {
    const params = new URLSearchParams();
    const cat = newCat !== undefined ? newCat : selectedCategory;
    const sort = newSort !== undefined ? newSort : selectedSort;

    if (cat) params.set("category", cat);
    if (sort && sort !== "recommended") params.set("sort", sort);
    if (initialSearch) params.set("q", initialSearch);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);

    router.push(`/shop?${params.toString()}`);
    setIsFilterDrawerOpen(false);
  };

  const handleResetFilters = () => {
    setSelectedCategory("");
    setSelectedSort("recommended");
    setMinPrice("");
    setMaxPrice("");
    router.push("/shop");
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar: Count, Mobile Filter Trigger, Sort Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-[#E2DDD3]">
        <div className="flex items-center gap-2 text-xs text-[#5A6065]">
          <span>Showing</span>
          <strong className="text-[#1A1D20] font-semibold">{total}</strong>
          <span>atelier pieces</span>
          {initialCategory && (
            <span className="inline-flex items-center gap-1 bg-[#EAE6DE] px-2 py-0.5 rounded-full text-[#226192] font-medium ml-2">
              {categories.find((c) => c.slug === initialCategory)?.name || initialCategory}
              <button
                onClick={() => {
                  setSelectedCategory("");
                  handleApplyFilters("", selectedSort);
                }}
                className="hover:text-black"
                aria-label="Remove category filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Trigger */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="sm:hidden flex items-center gap-2 px-3 py-2 border border-[#E2DDD3] rounded-xs text-xs font-medium text-[#1A1D20]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#226192]" />
            <span>Filters</span>
          </button>

          {/* Sort Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={selectedSort}
              onChange={(e) => {
                setSelectedSort(e.target.value);
                handleApplyFilters(selectedCategory, e.target.value);
              }}
              className="appearance-none bg-white border border-[#E2DDD3] rounded-xs px-3.5 py-2 pr-8 text-xs font-medium text-[#1A1D20] focus:outline-none focus:border-[#226192] cursor-pointer"
              aria-label="Sort products by"
            >
              <option value="recommended">Featured / Curated</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#5A6065] absolute right-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Content Layout: Sidebar + Grid */}
      <div className="flex gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden sm:block w-56 flex-shrink-0 space-y-6">
          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-[0.16em] font-semibold text-[#1A1D20]">
              Collections
            </h4>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => {
                  setSelectedCategory("");
                  handleApplyFilters("", selectedSort);
                }}
                className={`block w-full text-left py-1 transition-colors ${
                  !selectedCategory
                    ? "text-[#226192] font-semibold"
                    : "text-[#5A6065] hover:text-[#1A1D20]"
                }`}
              >
                All Silhouettes
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.slug);
                    handleApplyFilters(cat.slug, selectedSort);
                  }}
                  className={`block w-full text-left py-1 transition-colors ${
                    selectedCategory === cat.slug
                      ? "text-[#226192] font-semibold"
                      : "text-[#5A6065] hover:text-[#1A1D20]"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3 pt-4 border-t border-[#E2DDD3]/60">
            <h4 className="text-xs uppercase tracking-[0.16em] font-semibold text-[#1A1D20]">
              Price Range (₹)
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-[#E2DDD3] rounded-xs bg-white text-[#1A1D20]"
                aria-label="Minimum price"
              />
              <span className="text-[#5A6065] text-xs">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-[#E2DDD3] rounded-xs bg-white text-[#1A1D20]"
                aria-label="Maximum price"
              />
            </div>
            <button
              onClick={() => handleApplyFilters()}
              className="w-full py-1.5 bg-[#EAE6DE] hover:bg-[#DDD7CB] text-[#1A1D20] text-xs font-medium rounded-xs transition-colors"
            >
              Apply Price
            </button>
          </div>

          {/* Clear Filters */}
          {(selectedCategory || minPrice || maxPrice || selectedSort !== "recommended") && (
            <button
              onClick={handleResetFilters}
              className="w-full py-1.5 text-xs text-[#D92D20] hover:underline"
            >
              Reset All Filters
            </button>
          )}
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          <ProductGrid
            products={initialProducts}
            onResetFilters={handleResetFilters}
          />
        </main>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {isFilterDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter Options"
          className="fixed inset-0 z-50 flex sm:hidden"
        >
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setIsFilterDrawerOpen(false)}
          />
          <div className="relative z-10 w-full max-w-xs bg-[#FDFBF7] h-full p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2DDD3]">
              <h3 className="font-serif text-lg font-semibold text-[#1A1D20]">Filters</h3>
              <button onClick={() => setIsFilterDrawerOpen(false)}>
                <X className="w-5 h-5 text-[#5A6065]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#226192]">
                  Category
                </span>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`block w-full text-left py-1 text-xs ${
                      !selectedCategory ? "text-[#226192] font-bold" : "text-[#5A6065]"
                    }`}
                  >
                    All Silhouettes
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.slug)}
                      className={`block w-full text-left py-1 text-xs ${
                        selectedCategory === c.slug ? "text-[#226192] font-bold" : "text-[#5A6065]"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2DDD3] space-y-2">
              <button
                onClick={() => handleApplyFilters()}
                className="w-full bg-[#226192] text-white py-2.5 rounded-xs text-xs font-semibold uppercase tracking-wider"
              >
                Apply Filters
              </button>
              <button
                onClick={handleResetFilters}
                className="w-full text-xs text-[#5A6065] py-2"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
