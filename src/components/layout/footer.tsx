"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export function Footer() {
  const currentYear = 2026;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/v1/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.meta?.message || "Thank you for subscribing to Leziva Atelier previews.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error?.message || "Unable to complete subscription. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network connection interrupted. Please try again.");
    }
  };

  return (
    <footer className="bg-[#164366] text-[#EAE6DE] border-t border-[#226192]/60 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="pb-16 border-b border-[#226192]/40 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.2em] font-medium text-[#EF8557]">
              The Leziva Gazette
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-white font-normal">
              Invitations to Private Atelier Showcases
            </h3>
            <p className="text-xs sm:text-sm text-[#EAE6DE]/70 max-w-md">
              Receive limited bridal lookbooks, handloom weave stories, and private access to seasonal capsule collections.
            </p>
          </div>

          <div>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  aria-label="Email address for atelier newsletter"
                  className="flex-1 bg-white/10 border border-[#226192] px-4 py-3 rounded-sm text-sm text-white placeholder-[#EAE6DE]/50 focus:outline-none focus:border-[#EF8557] focus:ring-1 focus:ring-[#EF8557] transition-all"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="bg-[#EF8557] hover:bg-[#e8713d] text-white px-6 py-3 rounded-sm text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {status === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Join Atelier</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {status === "success" && (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{message}</span>
                </p>
              )}

              {status === "error" && (
                <p className="text-xs text-[#EF8557] pt-1">
                  {message}
                </p>
              )}

              <p className="text-[11px] text-[#EAE6DE]/50 pt-1">
                By subscribing, you agree to our Privacy Policy. Unsubscribe at any time.
              </p>
            </form>
          </div>
        </div>

        {/* Links Navigation Matrix */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2 space-y-4">
            <div className="bg-white/95 p-3 rounded-sm inline-block shadow-xs">
              <Logo variant="full" size="sm" asLink={false} />
            </div>
            <p className="text-xs text-[#EAE6DE]/80 leading-relaxed max-w-sm">
              LEZIVA is an Indian luxury fashion atelier celebrating heritage handloom silk sarees, bespoke zardozi bridal lehengas, and contemporary silhouettes crafted with timeless elegance.
            </p>
            <div className="space-y-2 pt-2 text-xs text-[#EAE6DE]/80">
              <a
                href="tel:+918000000000"
                className="flex items-center gap-2.5 hover:text-[#EF8557] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#EF8557]" />
                <span>+91 80000 00000 (Concierge)</span>
              </a>
              <a
                href="mailto:concierge@leziva.com"
                className="flex items-center gap-2.5 hover:text-[#EF8557] transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#EF8557]" />
                <span>concierge@leziva.com</span>
              </a>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-[#EF8557]" />
                <span>Surat Atelier &amp; Design Studio, Gujarat, India</span>
              </div>
            </div>
          </div>

          {/* Collections */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-[0.16em] font-semibold text-white">
              Collections
            </h4>
            <ul className="space-y-2 text-xs text-[#EAE6DE]/70">
              <li>
                <Link href="/shop" className="hover:text-white transition-colors">
                  Shop All Pieces
                </Link>
              </li>
              <li>
                <Link href="/categories/sarees" className="hover:text-white transition-colors">
                  Pure Silk Sarees
                </Link>
              </li>
              <li>
                <Link href="/categories/lehengas" className="hover:text-white transition-colors">
                  Bridal Lehengas
                </Link>
              </li>
              <li>
                <Link href="/categories/dresses" className="hover:text-white transition-colors">
                  Contemporary Dresses
                </Link>
              </li>
              <li>
                <Link href="/categories/kurtis" className="hover:text-white transition-colors">
                  Chanderi Kurti Sets
                </Link>
              </li>
              <li>
                <Link href="/categories/bridal-couture" className="hover:text-white transition-colors">
                  Heirloom Couture
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-[0.16em] font-semibold text-white">
              Customer Atelier
            </h4>
            <ul className="space-y-2 text-xs text-[#EAE6DE]/70">
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  Customer Account
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  Shopping Bag
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-white transition-colors">
                  My Wishlist
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-white transition-colors font-medium text-[#EF8557]">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Bespoke Appointments
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-white transition-colors">
                  Insured Delivery
                </Link>
              </li>
              <li>
                <Link href="/returns-policy" className="hover:text-white transition-colors">
                  7-Day Returns &amp; Exchanges
                </Link>
              </li>
            </ul>
          </div>

          {/* The Atelier & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-[0.16em] font-semibold text-white">
              About &amp; Legal
            </h4>
            <ul className="space-y-2 text-xs text-[#EAE6DE]/70">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  The Atelier Story
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/api/health" target="_blank" className="hover:text-white transition-colors">
                  System Health API
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-4 border-t border-[#226192]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#EAE6DE]/60">
          <p>© {currentYear} LEZIVA. Handcrafted with reverence for Indian textile heritage.</p>
          <div className="flex items-center space-x-6">
            <Link href="/privacy-policy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <Link href="/shipping-policy" className="hover:underline">
              Shipping
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
