"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, ShoppingBag, User, Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { SearchModal } from "@/components/search/search-modal";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { CartDrawer } from "@/components/cart/cart-drawer";

export function Header() {
  const pathname = usePathname();
  const { itemCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navLinks = [
    { label: "Shop All", href: "/shop" },
    { label: "Sarees", href: "/categories/sarees" },
    { label: "Lehengas", href: "/categories/lehengas" },
    { label: "Dresses", href: "/categories/dresses" },
    { label: "Kurtis & Sets", href: "/categories/kurtis" },
    { label: "Bridal Couture", href: "/categories/bridal-couture" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E2DDD3] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-22 flex items-center justify-between gap-4">
          {/* Mobile Menu Hamburger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="p-2 -ml-2 text-[#1A1D20] hover:text-[#226192] rounded-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226192]"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Logo variant="full" size="md" priority />
          </div>

          {/* Desktop Navigation */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center space-x-7 text-xs font-medium tracking-[0.12em] uppercase"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-2 transition-colors relative ${
                    isActive
                      ? "text-[#226192] font-semibold"
                      : "text-[#1A1D20] hover:text-[#226192]"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#226192] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Header Action Controls */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Open product search"
              className="p-2 text-[#1A1D20] hover:text-[#226192] rounded-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226192]"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Customer Account */}
            <Link
              href="/account"
              aria-label="Customer account"
              className="p-2 text-[#1A1D20] hover:text-[#226192] rounded-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226192] hidden sm:inline-flex"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              aria-label={`Wishlist with ${wishlistCount} saved items`}
              className="p-2 text-[#1A1D20] hover:text-[#EF8557] rounded-sm transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EF8557]"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#EF8557] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Bag Trigger */}
            <button
              onClick={openCart}
              aria-label={`Shopping bag with ${itemCount} items`}
              className="p-2 text-[#1A1D20] hover:text-[#226192] rounded-sm transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226192]"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#226192] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in-50">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Global Modals & Drawers */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        onOpenSearch={() => setIsSearchOpen(true)}
        wishlistCount={wishlistCount}
        cartCount={itemCount}
      />
      <CartDrawer />
    </>
  );
}
