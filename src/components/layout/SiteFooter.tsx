"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export function SiteFooter() {
  const { brandConfig, showToast } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      showToast("Please enter a valid email address", "error");
      return;
    }
    showToast("Welcome to the Inner Circle! 10% preview code sent.", "success");
    setNewsletterEmail("");
  };

  return (
    <footer className="bg-[#102B3A] text-[#F8F5EF] pt-16 pb-24 lg:pb-12 border-t border-[#226192]/30">
      {/* Brand Ethos Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-[#226192]/30">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-[#EF8557]/15 flex items-center justify-center text-[#EF8557]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">Heritage Weaves</p>
              <p className="text-xs text-[#F8F5EF]/60">Authentic artisan craftsmanship</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-[#EF8557]/15 flex items-center justify-center text-[#EF8557]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">Complimentary Shipping</p>
              <p className="text-xs text-[#F8F5EF]/60">Across India on orders over ₹999</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-[#EF8557]/15 flex items-center justify-center text-[#EF8557]">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">7 Days Easy Return</p>
              <p className="text-xs text-[#F8F5EF]/60">Hassle-free reverse pickup</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-full bg-[#EF8557]/15 flex items-center justify-center text-[#EF8557]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">100% Secure Checkout</p>
              <p className="text-xs text-[#F8F5EF]/60">Razorpay 256-bit SSL encryption</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Bio */}
          <div className="lg:col-span-2 space-y-4">
            <Link
              href="/"
              className="text-3xl font-serif font-bold tracking-[0.25em] uppercase text-white block"
            >
              {brandConfig.name}
            </Link>
            <p className="text-sm text-[#F8F5EF]/75 max-w-sm leading-relaxed font-light">
              Crafted for every you. Celebrating centuries of Indian handloom heritage, intricate zari embroidery, and bespoke luxury tailoring for unforgettable moments.
            </p>

            {/* Newsletter */}
            <div className="pt-2">
              <p className="text-xs uppercase tracking-wider font-semibold text-[#EF8557] mb-2">
                Join The Inner Circle
              </p>
              <p className="text-xs text-[#F8F5EF]/60 mb-3">
                Subscribe for private festive preview access, bespoke styling edits, and 10% off.
              </p>
              <form onSubmit={handleSubscribe} className="flex max-w-md">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0C1E28] border border-[#226192]/40 rounded-l-lg text-sm text-white placeholder-[#F8F5EF]/40 focus:outline-none focus:ring-1 focus:ring-[#EF8557]"
                />
                <button
                  type="submit"
                  aria-label="Subscribe to newsletter"
                  className="px-5 py-2.5 bg-[#EF8557] hover:bg-[#DF7446] text-white font-medium text-xs tracking-wider uppercase rounded-r-lg transition-colors flex items-center gap-1"
                >
                  <span>Join</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Collections */}
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-[#EF8557] mb-4">
              Collections
            </p>
            <ul className="space-y-2.5 text-sm text-[#F8F5EF]/75">
              <li>
                <Link href="/collections/sarees" className="hover:text-white transition-colors">
                  Banarasi & Kanjivaram Sarees
                </Link>
              </li>
              <li>
                <Link href="/collections/lehengas" className="hover:text-white transition-colors">
                  Bridal & Festive Lehengas
                </Link>
              </li>
              <li>
                <Link href="/collections/kurtas" className="hover:text-white transition-colors">
                  Anarkali & Straight Kurtas
                </Link>
              </li>
              <li>
                <Link href="/collections/mens" className="hover:text-white transition-colors">
                  Men&apos;s Kurta & Sherwanis
                </Link>
              </li>
              <li>
                <Link href="/collections/kids" className="hover:text-white transition-colors">
                  Kids Festive Ensembles
                </Link>
              </li>
              <li>
                <Link href="/collections/accessories" className="hover:text-white transition-colors">
                  Embroidered Potli Bags
                </Link>
              </li>
            </ul>
          </div>

          {/* Brand & Craft */}
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-[#EF8557] mb-4">
              Our Maison
            </p>
            <ul className="space-y-2.5 text-sm text-[#F8F5EF]/75">
              <li>
                <Link href="/#stories" className="hover:text-white transition-colors">
                  The Brand Story
                </Link>
              </li>
              <li>
                <Link href="/#stories" className="hover:text-white transition-colors">
                  Artisanal Guilds
                </Link>
              </li>
              <li>
                <Link href="/#stories" className="hover:text-white transition-colors">
                  Sustainable Silks
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-[#EF8557] font-medium hover:underline">
                  Admin Dashboard Portal
                </Link>
              </li>
              <li>
                <span className="text-[#F8F5EF]/50 text-xs">Flagship Atelier: Varanasi & Mumbai</span>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-[#EF8557] mb-4">
              Customer Care
            </p>
            <ul className="space-y-2.5 text-sm text-[#F8F5EF]/75">
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  Shopping Bag & Orders
                </Link>
              </li>
              <li>
                <span className="cursor-pointer hover:text-white transition-colors" onClick={() => showToast("Track order: Please check your SMS or email link", "info")}>
                  Track Your Order
                </span>
              </li>
              <li>
                <span className="cursor-pointer hover:text-white transition-colors" onClick={() => showToast("Free 7-day pickup available for all domestic orders", "info")}>
                  Shipping & Returns Policy
                </span>
              </li>
              <li>
                <span className="cursor-pointer hover:text-white transition-colors" onClick={() => showToast("WhatsApp concierge active 10 AM - 8 PM IST", "info")}>
                  WhatsApp Concierge
                </span>
              </li>
              <li className="pt-2">
                <span className="text-xs text-[#F8F5EF]/50">Helpline: +91 (0) 80 4920 1888</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Social & Legal Bottom Row */}
        <div className="pt-12 mt-12 border-t border-[#226192]/20 flex flex-col sm:flex-row items-center justify-between text-xs text-[#F8F5EF]/60 gap-4">
          <p>© 2026 {brandConfig.name} Couture Private Limited. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
            <span className="hover:text-white cursor-pointer">Security Certifications</span>
          </div>
          <div className="flex items-center space-x-4 text-white">
            <svg className="w-4 h-4 cursor-pointer hover:text-[#EF8557] transition-colors fill-currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <svg className="w-4 h-4 cursor-pointer hover:text-[#EF8557] transition-colors fill-currentColor" viewBox="0 0 24 24">
              <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
            </svg>
            <svg className="w-4 h-4 cursor-pointer hover:text-[#EF8557] transition-colors fill-currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <svg className="w-4 h-4 cursor-pointer hover:text-[#EF8557] transition-colors fill-currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
        </div>
      </div>
    </footer>
  );
}
