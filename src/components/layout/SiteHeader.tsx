"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "@/context/StoreContext";
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  Shield,
  ArrowRight,
} from "lucide-react";
import { LUXURY_EASE } from "@/lib/animations";

export function SiteHeader({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const pathname = usePathname();
  const { brandConfig, cartCount, wishlistCount, openCart, products, openQuickView } = useStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSearchResults = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.categoryDisplayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.fabric.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 4)
    : [];

  const navLinks = [
    { name: "Women", href: "/collections/women" },
    { name: "Men", href: "/collections/men" },
    { name: "Kids", href: "/collections/kids" },
    { name: "Ethnic", href: "/collections/ethnic" },
    { name: "Accessories", href: "/collections/accessories" },
    { name: "Collections", href: "/collections" },
    { name: "Stories", href: "/#stories" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#EAE6DE]/90 backdrop-blur-md border-b border-[#DED6CB] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile Hamburger Menu */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={onOpenMobileMenu}
                aria-label="Open navigation menu"
                className="p-2 text-[#171717] hover:text-[#EF8557] transition-colors cursor-pointer"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Brand Logo */}
            <div className="flex items-center">
              <Link
                href="/"
                className="text-2xl sm:text-3xl font-serif font-bold tracking-[0.2em] uppercase text-[#102B3A] hover:opacity-90 transition-opacity"
              >
                {brandConfig.name}
              </Link>
            </div>

            {/* Desktop Navigation Links with Animated Underline */}
            <nav className="hidden lg:flex items-center space-x-7 text-sm font-medium tracking-wider text-[#171717]">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`relative py-1 transition-colors hover:text-[#EF8557] ${
                      isActive ? "text-[#EF8557] font-semibold" : "text-[#171717]/85"
                    }`}
                  >
                    <span>{link.name}</span>
                    {isActive && (
                      <motion.span
                        layoutId="navActiveUnderline"
                        className="absolute bottom-0 left-0 w-full h-[2px] bg-[#EF8557]"
                        transition={{ duration: 0.35, ease: LUXURY_EASE }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Action Icons */}
            <div className="flex items-center space-x-3 sm:space-x-5 text-[#171717]">
              {/* Search Toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.08 }}
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="Search Catalog"
                className="p-2 hover:text-[#EF8557] transition-colors rounded-full cursor-pointer"
              >
                <Search className="w-5 h-5" />
              </motion.button>

              {/* Wishlist Link with Animated Badge */}
              <Link
                href="/wishlist"
                aria-label="View Wishlist"
                className="p-2 hover:text-[#EF8557] transition-colors relative"
              >
                <Heart className="w-5 h-5" />
                <AnimatePresence>
                  {wishlistCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-1 right-1 bg-[#EF8557] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
                    >
                      {wishlistCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* Account / Admin Portal Link */}
              <Link
                href="/admin"
                aria-label="Admin Portal"
                title="Admin Dashboard"
                className="hidden sm:flex items-center gap-1.5 p-2 text-xs font-semibold uppercase tracking-wider text-[#102B3A] hover:text-[#EF8557] transition-all hover:scale-102 bg-[#F8F5EF] border border-[#DED6CB] rounded-full px-3 py-1.5 shadow-xs"
              >
                <Shield className="w-3.5 h-3.5 text-[#EF8557]" />
                <span>Admin</span>
              </Link>

              {/* Shopping Bag Button with Animated Count */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.06 }}
                onClick={openCart}
                aria-label="Open Shopping Bag"
                className="relative p-2.5 bg-[#102B3A] text-white rounded-full hover:bg-[#1A3E54] transition-all flex items-center justify-center shadow-md cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 bg-[#EF8557] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Live Search Drawer with Animated Height */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: LUXURY_EASE }}
              className="border-t border-[#DED6CB] bg-[#F8F5EF] overflow-hidden shadow-xl"
            >
              <div className="max-w-3xl mx-auto py-5 px-4">
                <div className="relative flex items-center">
                  <Search className="w-5 h-5 text-[#77716A] absolute left-3.5" />
                  <input
                    type="text"
                    placeholder="Search pure silk sarees, embroidered lehengas, kurtas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full pl-11 pr-10 py-3 bg-white border border-[#DED6CB] rounded-xl text-sm text-[#171717] placeholder-[#77716A] focus:outline-none focus:ring-2 focus:ring-[#EF8557] shadow-inner"
                  />
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="absolute right-3.5 text-[#77716A] hover:text-[#171717] p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Instant Search Results */}
                {searchQuery.trim() !== "" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3.5 bg-white border border-[#DED6CB] rounded-2xl p-3 shadow-lg"
                  >
                    {filteredSearchResults.length > 0 ? (
                      <div className="divide-y divide-[#EBE5DC]">
                        {filteredSearchResults.map((prod) => (
                          <div
                            key={prod.id}
                            className="py-2.5 flex items-center justify-between hover:bg-[#F8F5EF] px-3 rounded-xl cursor-pointer transition-colors"
                            onClick={() => {
                              setIsSearchOpen(false);
                              openQuickView(prod);
                            }}
                          >
                            <div className="flex items-center gap-3.5">
                              <img
                                src={prod.images[0]}
                                alt={prod.name}
                                className="w-12 h-14 object-cover rounded-lg border border-[#DED6CB]"
                              />
                              <div>
                                <p className="text-sm font-medium text-[#171717]">{prod.name}</p>
                                <p className="text-xs text-[#77716A]">
                                  {prod.categoryDisplayName} • {prod.fabric}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-[#102B3A]">
                                ₹{prod.price.toLocaleString("en-IN")}
                              </p>
                              <span className="text-[11px] text-[#EF8557] font-medium inline-flex items-center gap-0.5">
                                Quick View <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#77716A] py-3 text-center">
                        No luxury garments found matching &ldquo;{searchQuery}&rdquo;.
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
