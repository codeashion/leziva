import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "LEZIVA Atelier Terms and Conditions of Sale and Service.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-[#E2DDD3] pb-4">
        <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#226192]">
          Terms of Engagement
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1D20] font-normal mt-1">
          Terms of Service &amp; Sale
        </h1>
        <p className="text-xs text-[#5A6065] mt-1">
          Effective Date: October 2026 • LEZIVA Legal Agreement
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-[#5A6065] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-lg font-semibold text-[#1A1D20]">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing the LEZIVA digital atelier, shopping our collections, or communicating with our styling concierge, you agree to these Terms of Service in full.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-semibold text-[#1A1D20]">
            2. Handcrafted Textile Variations
          </h2>
          <p>
            Because our sarees and fabrics are woven by generational human artisans on manual pit looms, subtle variations in weaving slubs, dye tones, and zari luster are natural signatures of authenticity rather than defects.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-semibold text-[#1A1D20]">
            3. Intellectual Property
          </h2>
          <p>
            All original photography, atelier motifs, brand crest artwork, and editorial copy remain the exclusive intellectual property of LEZIVA. Reproduction without written consent is strictly prohibited.
          </p>
        </section>
      </div>
    </div>
  );
}
