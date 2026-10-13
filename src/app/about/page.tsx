import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { Award, ShieldCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "The Atelier Story",
  description:
    "Discover LEZIVA: Handcrafting pure silk sarees, bespoke bridal lehengas, and contemporary silhouettes with reverence for Indian textile heritage.",
};

export default function AboutPage() {
  return (
    <div className="space-y-16 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Intro Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#226192]">
          Our Atelier Heritage
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl text-[#1A1D20] font-normal leading-tight">
          Crafting Modern Elegance Through Generational Silk Weaving
        </h1>
        <p className="text-sm sm:text-base text-[#5A6065] leading-relaxed">
          LEZIVA was established with a singular conviction: that authentic Indian handloom textiles deserve a global stage of unmatched architectural grace and uncompromising quality.
        </p>
      </div>

      {/* Hero Visual */}
      <div className="relative aspect-[16/9] max-h-[500px] w-full rounded-xs overflow-hidden bg-[#EAE6DE] shadow-editorial-lg">
        <Image
          src="/images/catalog/hero_campaign.jpg"
          alt="LEZIVA Atelier Heritage Looms"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Narrative Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-8">
        <div className="space-y-4 text-xs sm:text-sm text-[#5A6065] leading-relaxed">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1D20] font-normal">
            The Living Art of Varanasi &amp; Surat
          </h2>
          <p>
            In an era of mass manufactured fashion, LEZIVA preserves the contemplative pace of the master weaver. A single bridal Banarasi Katan silk saree requires between 45 to 90 days of meticulous manual coordination between the draw-boy and the master artisan.
          </p>
          <p>
            Every warp is strung with high-denier certified mulberry silk. Every gold and rose gold motif is created using traditional Kadhwa needlework where no loose threads trail across the reverse.
          </p>
        </div>

        <div className="relative aspect-[4/3] rounded-xs overflow-hidden bg-[#EAE6DE] shadow-xs">
          <Image
            src="/images/catalog/saree_detail.jpg"
            alt="Pure Gold Zari Temple Border Macro"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-[#E2DDD3]">
        <div className="p-6 bg-white border border-[#E2DDD3] rounded-xs space-y-3">
          <Award className="w-6 h-6 text-[#226192]" />
          <h3 className="font-serif text-base font-medium text-[#1A1D20]">
            Silk Mark Certified
          </h3>
          <p className="text-xs text-[#5A6065] leading-relaxed">
            Every thread of silk is rigorously verified for 100% natural mulberry purity. No synthetic blends, no faux textures.
          </p>
        </div>

        <div className="p-6 bg-white border border-[#E2DDD3] rounded-xs space-y-3">
          <Heart className="w-6 h-6 text-[#EF8557]" />
          <h3 className="font-serif text-base font-medium text-[#1A1D20]">
            Fair Artisan Patronage
          </h3>
          <p className="text-xs text-[#5A6065] leading-relaxed">
            We work directly with weaver cooperatives, eliminating predatory middle layers and ensuring our craftspeople thrive.
          </p>
        </div>

        <div className="p-6 bg-white border border-[#E2DDD3] rounded-xs space-y-3">
          <ShieldCheck className="w-6 h-6 text-[#226192]" />
          <h3 className="font-serif text-base font-medium text-[#1A1D20]">
            Bespoke Quality Standard
          </h3>
          <p className="text-xs text-[#5A6065] leading-relaxed">
            Each creation is inspected individually by our master quality ateliers before receiving its tamper-proof seal.
          </p>
        </div>
      </div>

      <div className="text-center pt-6">
        <Button variant="primary" size="lg" asChild>
          <Link href="/shop">Explore The Current Capsule</Link>
        </Button>
      </div>
    </div>
  );
}
