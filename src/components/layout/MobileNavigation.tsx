"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "@/context/StoreContext";
import {
  X,
  Home,
  Grid,
  Heart,
  User,
  ShoppingBag,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { drawerSlideLeft, LUXURY_EASE } from "@/lib/animations";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavigation({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { brandConfig, wishlistCount, cartCount, openCart } = useStore();

  const links = [
    { name: "Women's Collection", href: "/collections/women", badge: "New" },
    { name: "Men's Attire", href: "/collections/men" },
    { name: "Kids' Festive", href: "/collections/kids" },
    { name: "Ethnic Heirloom", href: "/collections/ethnic", badge: "Trending" },
    { name: "Accessories & Bags", href: "/collections/accessories" },
    { name: "All Collections", href: "/collections" },
    { name: "Our Heritage Story", href: "/#stories" },
  ];

  return (
    <>
      <AnimatePresence>
        {/* Drawer Overlay */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm lg:hidden cursor-pointer"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={drawerSlideLeft}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-y-0 left-0 max-w-xs w-full bg-[#F8F5EF] z-50 shadow-2xl flex flex-col lg:hidden border-r border-[#DED6CB]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#DED6CB] bg-[#EAE6DE]">
              <Link
                href="/"
                onClick={onClose}
                className="text-2xl font-serif font-bold tracking-[0.2em] uppercase text-[#102B3A]"
              >
                {brandConfig.name}
              </Link>
              <button
                onClick={onClose}
                className="p-1.5 text-[#171717] hover:text-[#EF8557] rounded-full transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links List with Staggered Entrance */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-1.5">
              <p className="text-[10px] font-bold tracking-widest text-[#77716A] uppercase mb-3 px-3">
                Explore Categories
              </p>
              {links.map((link, idx) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.05, ease: LUXURY_EASE }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                      pathname === link.href
                        ? "bg-[#102B3A] text-white shadow-sm"
                        : "text-[#171717] hover:bg-[#EAE6DE]"
                    }`}
                  >
                    <span>{link.name}</span>
                    <div className="flex items-center gap-2">
                      {link.badge && (
                        <span className="text-[10px] bg-[#EF8557] text-white px-2 py-0.5 rounded-full font-semibold">
                          {link.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </div>
                  </Link>
                </motion.div>
              ))}

              <div className="pt-6 mt-6 border-t border-[#DED6CB] space-y-3 px-3">
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center gap-2.5 text-xs font-semibold text-[#102B3A] hover:text-[#EF8557] py-2"
                >
                  <ShieldCheck className="w-4 h-4 text-[#EF8557]" />
                  <span>Admin Management Portal</span>
                </Link>
                <div className="p-3.5 bg-[#EAE6DE] rounded-xl border border-[#DED6CB] text-xs text-[#77716A] space-y-1">
                  <p className="font-semibold text-[#171717] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#EF8557]" /> Need Styling Assistance?
                  </p>
                  <p>Direct WhatsApp Concierge: +91 98765 43210</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Bottom Mobile Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-[#F8F5EF]/95 backdrop-blur-md border-t border-[#DED6CB] z-30 flex items-center justify-around py-2.5 px-2 lg:hidden shadow-lg">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            pathname === "/" ? "text-[#EF8557]" : "text-[#77716A]"
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>

        <Link
          href="/collections"
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            pathname.startsWith("/collections") ? "text-[#EF8557]" : "text-[#77716A]"
          }`}
        >
          <Grid className="w-5 h-5" />
          <span>Categories</span>
        </Link>

        <Link
          href="/wishlist"
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors relative ${
            pathname === "/wishlist" ? "text-[#EF8557]" : "text-[#77716A]"
          }`}
        >
          <Heart className="w-5 h-5" />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-[#EF8557] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {wishlistCount}
            </span>
          )}
          <span>Wishlist</span>
        </Link>

        <button
          onClick={openCart}
          className="flex flex-col items-center gap-1 text-[11px] font-medium text-[#77716A] relative cursor-pointer"
        >
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-[#102B3A] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
          <span>Bag</span>
        </button>

        <Link
          href="/admin"
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            pathname.startsWith("/admin") ? "text-[#EF8557]" : "text-[#77716A]"
          }`}
        >
          <User className="w-5 h-5" />
          <span>Admin</span>
        </Link>
      </div>
    </>
  );
}
