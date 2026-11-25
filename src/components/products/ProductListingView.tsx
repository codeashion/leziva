"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/products/ProductCard";
import {
  ChevronRight,
  SlidersHorizontal,
  X,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";

interface ProductListingViewProps {
  initialCategory?: string;
  categoryTitle?: string;
  categorySubtitle?: string;
}

export function ProductListingView({
  initialCategory,
  categoryTitle,
  categorySubtitle,
}: ProductListingViewProps) {
  const { products } = useStore();

  // Filters state
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [priceMax, setPriceMax] = useState<number>(30000);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Available filter options
  const categoryOptions = [
    { id: "sarees", name: "Sarees", count: 120 },
    { id: "kurtas", name: "Kurtas & Sets", count: 80 },
    { id: "lehengas", name: "Lehengas", count: 45 },
    { id: "mens", name: "Men's Wear", count: 30 },
    { id: "kids", name: "Kids' Festive", count: 64 },
    { id: "accessories", name: "Accessories", count: 28 },
  ];

  const fabricOptions = ["Silk", "Cotton", "Georgette", "Organza", "Chiffon", "Linen"];
  const occasionOptions = ["Wedding", "Festive", "Party", "Casual", "Office Wear"];

  const colorPalette = [
    { name: "Pink", hex: "#D81B60" },
    { name: "Blue", hex: "#1E3A8A" },
    { name: "Green", hex: "#047857" },
    { name: "Gold", hex: "#D97706" },
    { name: "Wine", hex: "#881337" },
    { name: "Ivory", hex: "#F3E8D0" },
    { name: "Orange", hex: "#FB923C" },
  ];

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(p.category) &&
        !selectedCategories.includes(p.category.toLowerCase())
      ) {
        return false;
      }
      // Fabric filter
      if (
        selectedFabrics.length > 0 &&
        !selectedFabrics.some((f) => p.fabric.toLowerCase().includes(f.toLowerCase()))
      ) {
        return false;
      }
      // Occasion filter
      if (
        selectedOccasions.length > 0 &&
        !selectedOccasions.some((o) => p.occasion.toLowerCase().includes(o.toLowerCase()))
      ) {
        return false;
      }
      // Color filter
      if (
        selectedColor &&
        !p.colorName.toLowerCase().includes(selectedColor.toLowerCase()) &&
        !p.primaryColor.toLowerCase().includes(selectedColor.toLowerCase())
      ) {
        return false;
      }
      // Price filter
      if (p.price > priceMax) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "newest") return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [products, selectedCategories, selectedFabrics, selectedOccasions, selectedColor, priceMax, sortBy]);

  const activeFiltersCount =
    (selectedCategories.length > 0 ? selectedCategories.length : 0) +
    selectedFabrics.length +
    selectedOccasions.length +
    (selectedColor ? 1 : 0) +
    (priceMax < 30000 ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedFabrics([]);
    setSelectedOccasions([]);
    setSelectedColor("");
    setPriceMax(30000);
    setSortBy("featured");
  };

  const title = categoryTitle || (initialCategory ? initialCategory.toUpperCase() : "All Collections");
  const subtitle =
    categorySubtitle || "Six yards of elegance, curated for every celebration and heirloom moment.";

  return (
    <div className="bg-[#EAE6DE] min-h-screen pb-20">
      {/* Breadcrumb Navigation */}
      <div className="bg-[#F8F5EF] border-b border-[#DED6CB] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center text-xs text-[#77716A] space-x-2">
            <Link href="/" className="hover:text-[#102B3A] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/collections" className="hover:text-[#102B3A] transition-colors">
              Collections
            </Link>
            {initialCategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#102B3A] font-semibold capitalize">
                  {initialCategory}
                </span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Editorial Collection Header + Campaign Banner matching UI reference 02 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-10">
          <div className="lg:col-span-7 bg-[#F8F5EF] p-8 rounded-2xl border border-[#DED6CB] flex flex-col justify-center">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#EF8557] mb-2 block">
              HERITAGE ARCHIVES
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#102B3A]">
              {title}
            </h1>
            <p className="mt-3 text-sm text-[#77716A] max-w-lg leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Promotional Banner inside header */}
          <div className="lg:col-span-5 relative rounded-2xl overflow-hidden shadow-md border border-[#DED6CB] group min-h-[180px]">
            <img
              src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
              alt="Ethereal Sarees Campaign"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#102B3A]/90 via-[#102B3A]/60 to-transparent p-6 flex flex-col justify-center text-white">
              <span className="text-[10px] uppercase tracking-widest text-[#EF8557] font-bold">
                SEASONAL HIGHLIGHT
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-1">
                Ethereal Sarees
              </h3>
              <p className="text-xs text-white/80 mt-1">Grace in every drape.</p>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#EF8557] group-hover:underline">
                  <span>Shop Edit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Control Bar (Sort + Filter Pills + Mobile Filter Trigger) */}
        <div className="bg-[#F8F5EF] border border-[#DED6CB] rounded-xl p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Filter Sheet Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 bg-[#102B3A] text-white text-xs font-semibold uppercase tracking-wider rounded-lg"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters ({activeFiltersCount})</span>
            </button>

            <span className="text-xs text-[#77716A]">
              Showing <strong className="text-[#102B3A]">{filteredProducts.length}</strong> creations
            </span>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-[#EF8557] font-semibold hover:underline hidden sm:inline-block"
              >
                Clear all filters ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 ml-auto">
            <label htmlFor="sortBy" className="text-xs font-medium text-[#77716A]">
              Sort by:
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-[#DED6CB] text-xs font-semibold text-[#102B3A] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#EF8557]"
            >
              <option value="featured">Featured Collections</option>
              <option value="newest">New Arrivals First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Customer Rating</option>
            </select>
          </div>
        </div>

        {/* Main Listing Layout: Left Sidebar + Right Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 bg-[#F8F5EF] p-6 rounded-2xl border border-[#DED6CB] space-y-6 sticky top-28">
            <div className="flex items-center justify-between pb-4 border-b border-[#DED6CB]">
              <h3 className="font-serif text-base font-bold text-[#102B3A] flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#EF8557]" />
                <span>Filters</span>
              </h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-[#EF8557] font-medium hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Categories */}
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-[#171717] mb-3">
                Categories
              </p>
              <div className="space-y-2 text-xs">
                {categoryOptions.map((cat) => {
                  const isChecked = selectedCategories.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      className="flex items-center justify-between cursor-pointer hover:text-[#EF8557]"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedCategories((prev) =>
                              isChecked ? prev.filter((c) => c !== cat.id) : [...prev, cat.id]
                            );
                          }}
                          className="rounded border-[#DED6CB] text-[#EF8557] focus:ring-[#EF8557]"
                        />
                        <span className={isChecked ? "font-semibold text-[#102B3A]" : "text-[#77716A]"}>
                          {cat.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#77716A]/70">({cat.count})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Price Range Slider */}
            <div className="pt-4 border-t border-[#DED6CB]">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs uppercase tracking-wider font-bold text-[#171717]">
                  Price Range
                </p>
                <span className="text-xs font-bold text-[#102B3A]">
                  Up to ₹{priceMax.toLocaleString("en-IN")}
                </span>
              </div>
              <input
                type="range"
                min="900"
                max="30000"
                step="500"
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full accent-[#EF8557] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#77716A] mt-1">
                <span>₹900</span>
                <span>₹30,000</span>
              </div>
            </div>

            {/* Color Swatches */}
            <div className="pt-4 border-t border-[#DED6CB]">
              <p className="text-xs uppercase tracking-wider font-bold text-[#171717] mb-3">
                Color
              </p>
              <div className="flex flex-wrap gap-2">
                {colorPalette.map((col) => (
                  <button
                    key={col.name}
                    onClick={() => setSelectedColor(selectedColor === col.name ? "" : col.name)}
                    title={col.name}
                    className={`w-6 h-6 rounded-full border transition-all ${
                      selectedColor === col.name
                        ? "scale-125 ring-2 ring-[#102B3A] ring-offset-2"
                        : "opacity-85 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: col.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Fabric Checkboxes */}
            <div className="pt-4 border-t border-[#DED6CB]">
              <p className="text-xs uppercase tracking-wider font-bold text-[#171717] mb-3">
                Fabric
              </p>
              <div className="space-y-2 text-xs">
                {fabricOptions.map((fab) => {
                  const isChecked = selectedFabrics.includes(fab);
                  return (
                    <label key={fab} className="flex items-center gap-2 cursor-pointer text-[#77716A] hover:text-[#171717]">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedFabrics((prev) =>
                            isChecked ? prev.filter((f) => f !== fab) : [...prev, fab]
                          );
                        }}
                        className="rounded border-[#DED6CB] text-[#EF8557] focus:ring-[#EF8557]"
                      />
                      <span className={isChecked ? "font-semibold text-[#102B3A]" : ""}>
                        {fab}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Occasion Checkboxes */}
            <div className="pt-4 border-t border-[#DED6CB]">
              <p className="text-xs uppercase tracking-wider font-bold text-[#171717] mb-3">
                Occasion
              </p>
              <div className="space-y-2 text-xs">
                {occasionOptions.map((occ) => {
                  const isChecked = selectedOccasions.includes(occ);
                  return (
                    <label key={occ} className="flex items-center gap-2 cursor-pointer text-[#77716A] hover:text-[#171717]">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedOccasions((prev) =>
                            isChecked ? prev.filter((o) => o !== occ) : [...prev, occ]
                          );
                        }}
                        className="rounded border-[#DED6CB] text-[#EF8557] focus:ring-[#EF8557]"
                      />
                      <span className={isChecked ? "font-semibold text-[#102B3A]" : ""}>
                        {occ}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Product Grid (4 columns on desktop, 2 on mobile) */}
          <div className="lg:col-span-9">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} showSizes={false} />
                ))}
              </div>
            ) : (
              <div className="bg-[#F8F5EF] rounded-2xl border border-[#DED6CB] p-12 text-center space-y-4">
                <Sparkles className="w-10 h-10 text-[#EF8557] mx-auto opacity-70" />
                <h3 className="font-serif text-xl font-bold text-[#102B3A]">
                  No Garments Match These Exact Filters
                </h3>
                <p className="text-xs text-[#77716A] max-w-sm mx-auto">
                  Try adjusting the price range or resetting fabric and color filters to discover our archives.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 bg-[#102B3A] text-white text-xs font-semibold uppercase tracking-wider rounded-lg"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Fullscreen Sheet */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden flex justify-end">
          <div className="w-full max-w-sm bg-[#F8F5EF] h-full overflow-y-auto p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#DED6CB]">
                <h3 className="font-serif text-lg font-bold text-[#102B3A]">Filters & Sort</h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 text-[#171717] hover:text-[#EF8557]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category options in mobile sheet */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2">Category</p>
                <div className="space-y-1.5 text-xs">
                  {categoryOptions.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => {
                          setSelectedCategories((prev) =>
                            prev.includes(cat.id) ? prev.filter((c) => c !== cat.id) : [...prev, cat.id]
                          );
                        }}
                      />
                      <span>{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price slider in mobile sheet */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span>Price Up to</span>
                  <span>₹{priceMax.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range"
                  min="900"
                  max="30000"
                  step="500"
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full accent-[#EF8557]"
                />
              </div>

              {/* Fabric in mobile sheet */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2">Fabric</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {fabricOptions.map((fab) => (
                    <label key={fab} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedFabrics.includes(fab)}
                        onChange={() => {
                          setSelectedFabrics((prev) =>
                            prev.includes(fab) ? prev.filter((f) => f !== fab) : [...prev, fab]
                          );
                        }}
                      />
                      <span>{fab}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#DED6CB] flex gap-3">
              <button
                onClick={clearAllFilters}
                className="flex-1 py-3 border border-[#DED6CB] text-xs font-semibold uppercase rounded-lg"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-3 bg-[#EF8557] text-white text-xs font-semibold uppercase rounded-lg shadow-md"
              >
                Apply ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
