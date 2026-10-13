"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
    }, 700);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="max-w-2xl mx-auto text-center space-y-3">
        <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#226192]">
          Atelier Concierge
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1D20] font-normal">
          Connect With Our Specialists
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6065]">
          Whether you seek bespoke bridal alterations, private styling appointments, or fabric consults, our senior concierge team is at your service.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-white border border-[#E2DDD3] rounded-xs space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#1A1D20] border-b border-[#E2DDD3] pb-3">
              Atelier Headquarters &amp; Studio
            </h3>
            <div className="space-y-3 text-xs text-[#5A6065]">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#226192] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#1A1D20] block">LEZIVA Haute Couture Atelier</strong>
                  <p>Ring Road Textile Hub, Surat 395002, Gujarat, India</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#226192] flex-shrink-0" />
                <div>
                  <a href="tel:+918000000000" className="text-[#1A1D20] hover:text-[#226192] font-semibold">
                    +91 80000 00000 (Mon - Sat, 10am - 7pm IST)
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#226192] flex-shrink-0" />
                <div>
                  <a href="mailto:concierge@leziva.com" className="text-[#1A1D20] hover:text-[#226192] font-semibold">
                    concierge@leziva.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#226192] flex-shrink-0" />
                <p>Private Bridal Appointments available by pre-booking.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-[#E2DDD3] rounded-xs p-6 sm:p-8 space-y-6 shadow-xs">
            <h3 className="font-serif text-lg font-semibold text-[#1A1D20] border-b border-[#E2DDD3] pb-3">
              Send an Atelier Inquiry
            </h3>

            {status === "success" ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-6 rounded-xs text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-serif text-base font-semibold">Thank You for Reaching Out</h4>
                <p>Your inquiry has been routed to our senior bridal styling concierge. We will respond within 4 business hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1D20]">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ananya Roy"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FDFBF7] border border-[#E2DDD3] rounded-xs outline-none focus:border-[#226192]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1D20]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ananya@domain.com"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FDFBF7] border border-[#E2DDD3] rounded-xs outline-none focus:border-[#226192]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1D20]">
                    Inquiry Topic
                  </label>
                  <select className="w-full px-3.5 py-2.5 text-xs bg-[#FDFBF7] border border-[#E2DDD3] rounded-xs outline-none focus:border-[#226192]">
                    <option>Bespoke Bridal Lehenga Consultation</option>
                    <option>Saree Fabric &amp; Real Zari Inquiries</option>
                    <option>Order Tracking &amp; Delivery Schedule</option>
                    <option>Custom Alterations &amp; Sizing</option>
                    <option>Press &amp; Editorial Collaborations</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1D20]">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your styling preferences or questions..."
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FDFBF7] border border-[#E2DDD3] rounded-xs outline-none focus:border-[#226192]"
                  />
                </div>

                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full bg-[#226192] text-white py-3"
                >
                  {status === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Submit Inquiry to Concierge"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
