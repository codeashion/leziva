import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "LEZIVA Patron Privacy and Data Protection Policy.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-[#E2DDD3] pb-4">
        <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#226192]">
          Data Governance
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1D20] font-normal mt-1">
          Privacy &amp; Data Protection Policy
        </h1>
        <p className="text-xs text-[#5A6065] mt-1">
          Effective Date: October 2026 • Compliant with DPDP Act (India)
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-[#5A6065] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-lg font-semibold text-[#1A1D20]">
            1. Data We Collect
          </h2>
          <p>
            When you register, place an order, or subscribe to the LEZIVA Atelier Gazette, we collect your name, email address, phone number, shipping address, and order transactions. We never store raw credit card numbers or banking passwords on our servers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-semibold text-[#1A1D20]">
            2. Purpose of Processing
          </h2>
          <p>
            Your information is processed strictly to fulfill orders, arrange insured courier deliveries via Velocity, issue GST invoices, provide customer concierge support, and send bespoke capsule invitations with your consent.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-semibold text-[#1A1D20]">
            3. Data Deletion &amp; Rights
          </h2>
          <p>
            Patrons hold complete rights to review, modify, or permanently request deletion of their personal information by contacting <a href="mailto:privacy@leziva.com" className="text-[#226192] underline">privacy@leziva.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
