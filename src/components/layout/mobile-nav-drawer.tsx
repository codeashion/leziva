"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { X, Heart, ShoppingBag, User, Search, ChevronRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
  wishlistCount: number;
  cartCount: number;
}

export function MobileNavDrawer({
  isOpen,
  onClose,
  onOpenSearch,
  wishlistCount,
  cartCount,
}: MobileNavDrawerProps) {
  // ESC key handler and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

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

  if (!isOpen) return null;

  const navLinks = [
    { label: "Shop All Collections", href: "/shop" },
    { label: "Sarees & Drapes", href: "/categories/sarees" },
    { label: "Bridal & Festive Lehengas", href: "/categories/lehengas" },
    { label: "Contemporary Dresses", href: "/categories/dresses" },
    { label: "Kurtis & Anarkali Sets", href: "/categories/kurtis" },
    { label: "Heirloom Bridal Couture", href: "/categories/bridal-couture" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
      className="fixed inset-0 z-50 flex"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer content */}
      <div className="relative z-10 w-full max-w-xs sm:max-w-sm bg-[#FDFBF7] h-full shadow-2xl flex flex-col justify-between border-r border-[#E2DDD3] animate-in slide-in-from-left duration-300">
        <div className="p-6 border-b border-[#E2DDD3] flex items-center justify-between">
          <Logo variant="full" size="sm" />
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-2 text-[#5A6065] hover:text-[#1A1D20] rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226192]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search button trigger */}
        <div className="p-4 border-b border-[#E2DDD3]/60 bg-[#F6F4F0]">
          <button
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-white border border-[#DDD7CB] rounded-sm text-xs text-[#5A6065] hover:border-[#226192] transition-colors"
          >
            <Search className="w-4 h-4 text-[#226192]" />
            <span>Search sarees, lehengas, silhouettes...</span>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex items-center justify-between py-3 text-sm font-medium text-[#1A1D20] hover:text-[#226192] border-b border-[#E2DDD3]/40 transition-colors"
            >
              <span>{link.label}</span>
              <ChevronRight className="w-4 h-4 text-[#5A6065]" />
            </Link>
          ))}
        </nav>

        {/* Drawer footer actions */}
        <div className="p-6 border-t border-[#E2DDD3] bg-[#F6F4F0] space-y-3">
          <Link
            href="/account"
            onClick={onClose}
            className="flex items-center gap-3 text-xs font-medium text-[#1A1D20] hover:text-[#226192] transition-colors"
          >
            <User className="w-4 h-4 text-[#226192]" />
            <span>Customer Account</span>
          </Link>

          <Link
            href="/wishlist"
            onClick={onClose}
            className="flex items-center justify-between text-xs font-medium text-[#1A1D20] hover:text-[#226192] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-[#EF8557]" />
              <span>Wishlist</span>
            </div>
            {wishlistCount > 0 && (
              <span className="bg-[#EF8557] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            onClick={onClose}
            className="flex items-center justify-between text-xs font-medium text-[#1A1D20] hover:text-[#226192] transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4 text-[#226192]" />
              <span>Shopping Bag</span>
            </div>
            {cartCount > 0 && (
              <span className="bg-[#226192] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
