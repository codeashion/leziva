import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insured Shipping Policy",
  description: "LEZIVA Atelier Insured Express Delivery Guidelines across India and International destinations.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-[#E2DDD3] pb-4">
        <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#226192]">
          Atelier Logistics
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1D20] font-normal mt-1">
          Insured Express Shipping Policy
        </h1>
        <p className="text-xs text-[#5A6065] mt-1">
          Effective Date: October 2026 • Governed by LEZIVA Quality Standards
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-[#5A6065] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-lg font-semibold text-[#1A1D20]">
            1. Domestic Delivery Across India
          </h2>
          <p>
            All domestic orders are dispatched from our primary design ateliers in Surat and Varanasi. Every package is shipped in tamper-evident, water-resistant luxury rigid boxes insured for 100% of the invoice value.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Metro Cities (Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Ahmedabad):</strong> 2 to 3 business days.</li>
            <li><strong>Rest of India:</strong> 4 to 6 business days.</li>
            <li><strong>Complimentary Delivery:</strong> Orders exceeding ₹2,999 qualify for complimentary express air courier. Standard courier for lower values is flat ₹150.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-semibold text-[#1A1D20]">
            2. Logistics Partners &amp; Tracking
          </h2>
          <p>
            We partner with Velocity Express Logistics and primary air couriers. Upon dispatch, you receive a direct SMS and email containing your live Air Waybill (AWB) number and real-time transit tracking link.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-semibold text-[#1A1D20]">
            3. Bespoke Bridal &amp; Made-to-Order Dispatch
          </h2>
          <p>
            Heirloom bridal lehengas and custom-tailored blouses require 10 to 14 days of dedicated artisan hand-embroidery before dispatch. Our concierge coordinates your expected delivery date directly.
          </p>
        </section>
      </div>
    </div>
  );
}
