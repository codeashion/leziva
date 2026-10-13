"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import { Product } from "@/shared/types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open & handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    inputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Debounced search without synchronous setState in effect body
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/products?q=${encodeURIComponent(trimmed)}&limit=6`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const json = await res.json();
          setResults(json.data || []);
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          // fetch error
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  if (!isOpen) return null;

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search Catalog"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl bg-[#FDFBF7] rounded-xs shadow-2xl border border-[#E2DDD3] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-6 border-b border-[#E2DDD3] flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-[#226192] flex-shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search by silk, silhouette, zari, or occasion..."
            className="flex-1 text-base sm:text-lg bg-transparent border-none outline-none text-[#1A1D20] placeholder-[#5A6065]/60"
            aria-label="Search products"
          />
          {isLoading && <Loader2 className="w-5 h-5 text-[#226192] animate-spin flex-shrink-0" />}
          {query && !isLoading && (
            <button
              onClick={() => handleQueryChange("")}
              className="p-1 text-[#5A6065] hover:text-[#1A1D20]"
              aria-label="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs uppercase tracking-widest text-[#5A6065] hover:text-[#1A1D20] px-2 py-1 ml-2 font-medium"
          >
            Esc
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6">
          {query.trim() === "" ? (
            <div className="text-center py-8 text-[#5A6065] space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] font-medium text-[#226192]">
                Popular Atelier Searches
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {["Banarasi Silk", "Bridal Lehenga", "Chanderi Kurti", "Emerald Saree", "Fusion Gown"].map(
                  (term) => (
                    <button
                      key={term}
                      onClick={() => handleQueryChange(term)}
                      className="px-3 py-1.5 text-xs bg-[#EAE6DE]/50 hover:bg-[#EAE6DE] text-[#1A1D20] rounded-xs transition-colors"
                    >
                      {term}
                    </button>
                  )
                )}
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#5A6065] pb-2 border-b border-[#E2DDD3]/60">
                <span>Found {results.length} results</span>
                <Link
                  href={`/shop?q=${encodeURIComponent(query)}`}
                  onClick={onClose}
                  className="text-[#226192] hover:underline flex items-center gap-1 font-medium"
                >
                  View all results <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.map((product) => {
                  const primaryImg = product.images[0]?.url || "/images/catalog/cat_sarees.jpg";
                  const startingPrice = product.variants[0]?.price || 0;

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={onClose}
                      className="flex gap-3 p-2 rounded-xs hover:bg-[#F6F4F0] transition-colors border border-transparent hover:border-[#E2DDD3]"
                    >
                      <div className="relative w-16 h-20 flex-shrink-0 bg-[#EAE6DE] rounded-2xs overflow-hidden">
                        <Image
                          src={primaryImg}
                          alt={product.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span className="text-[10px] uppercase tracking-wider text-[#226192] font-medium">
                          {product.category?.name || "Atelier"}
                        </span>
                        <h4 className="text-xs font-serif font-medium text-[#1A1D20] truncate">
                          {product.title}
                        </h4>
                        <span className="text-xs font-semibold text-[#1A1D20] mt-1">
                          ₹{startingPrice.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#5A6065] space-y-2">
              <p className="text-sm font-serif">No atelier pieces found matching &ldquo;{query}&rdquo;</p>
              <p className="text-xs">Try searching for &quot;Silk&quot;, &quot;Lehenga&quot;, or &quot;Saree&quot;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
