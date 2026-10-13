import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns & Exchanges Policy",
  description: "LEZIVA 7-Day Hassle-Free Returns, Exchanges, and Refund Policy.",
};

export default function ReturnsPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-[#E2DDD3] pb-4">
        <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#226192]">
          Customer Assurance
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1D20] font-normal mt-1">
          7-Day Returns &amp; Exchanges Policy
        </h1>
        <p className="text-xs text-[#5A6065] mt-1">
          Effective Date: October 2026 • LEZIVA Patron Protection
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-[#5A6065] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-lg font-semibold text-[#1A1D20]">
            1. Return Window
          </h2>
          <p>
            We take supreme pride in the craftsmanship of every silhouette. If you are not entirely enchanted with your purchase, you may initiate a return or size exchange within <strong>7 calendar days</strong> from the recorded delivery date.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-semibold text-[#1A1D20]">
            2. Condition Guidelines
          </h2>
          <p>
            To be eligible for a full refund or exchange:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>The item must be unused, unwashed, unaltered, and without fragrance or makeup marks.</li>
            <li>Original Silk Mark tags and intact safety seals must remain affixed.</li>
            <li>The creation must be returned inside its original signature atelier protective packaging.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-semibold text-[#1A1D20]">
            3. Reverse Pickup &amp; Refund Processing
          </h2>
          <p>
            Our logistics team organizes complimentary reverse pickup from your doorstep across India. Once received and inspected by our atelier quality team (within 48 hours), your refund is credited directly to your original payment method within 5 to 7 business days.
          </p>
        </section>
      </div>
    </div>
  );
}
