"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrackingActivity {
  date_time: string;
  status: string;
  activity: string;
  location: string;
  courier_status_code?: string;
}

interface TrackingData {
  orderNumber: string;
  awb: string | null;
  courierName: string;
  currentStatus: string;
  origin: string;
  destination: string;
  pickupDate: string | null;
  expectedDeliveryDate: string | null;
  deliveredDate: string | null;
  activities: TrackingActivity[];
  lastUpdated: string;
}

const STAGES = [
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
  { key: "DISPATCHED", label: "Dispatched", icon: Package },
  { key: "IN_TRANSIT", label: "In Transit", icon: Truck },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: MapPin },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
];

export function TrackOrderClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("awb") || searchParams.get("orderNumber") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = React.useCallback(async (queryToSearch?: string) => {
    const q = (queryToSearch || searchQuery).trim();
    if (!q) {
      setErrorMessage("Please enter an Order ID or AWB Tracking Number.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const isAwb = q.toUpperCase().startsWith("VEL") || q.toUpperCase().startsWith("REV") || /^\d{9,14}$/.test(q);
      const url = isAwb
        ? `/api/v1/shipping/track?awb=${encodeURIComponent(q)}`
        : `/api/v1/shipping/track?orderNumber=${encodeURIComponent(q)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.success) {
        setTrackingData(data.data);
      } else {
        setTrackingData(null);
        setErrorMessage(
          data.error?.message ||
            "Unable to locate live tracking for this identifier. If your order was recently placed, carrier tracking activates shortly after dispatch from our Surat atelier."
        );
      }
    } catch {
      setTrackingData(null);
      setErrorMessage("Network error connecting to atelier logistics servers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const trimmed = initialQuery.trim();
    if (!trimmed) return;

    const timer = setTimeout(() => {
      handleSearch(trimmed);
    }, 0);

    return () => clearTimeout(timer);
  }, [initialQuery, handleSearch]);

  const getStageIndex = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s.includes("DELIVERED")) return 4;
    if (s.includes("OUT_FOR_DELIVERY") || s.includes("OFD")) return 3;
    if (s.includes("TRANSIT") || s.includes("REACHED_HUB") || s.includes("PICKED_UP")) return 2;
    if (s.includes("AWB") || s.includes("MANIFEST") || s.includes("CREATED") || s.includes("PICKUP_PENDING")) return 1;
    return 0;
  };

  const currentStageIndex = trackingData ? getStageIndex(trackingData.currentStatus) : 0;

  const handleCopyAwb = (awbText: string) => {
    navigator.clipboard.writeText(awbText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Header */}
        <div className="flex items-center space-x-2 text-xs text-[#5A6065] tracking-wider uppercase mb-8">
          <Link href="/" className="hover:text-[#226192] transition-colors">
            Atelier
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#1A1D20] font-medium">Logistics & Tracking</span>
        </div>

        {/* Title Section */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#226192]/10 text-[#226192] text-xs font-semibold tracking-widest uppercase rounded-full mb-3">
            <Truck className="w-3.5 h-3.5" />
            Velocity Express Logistics
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1D20] font-medium tracking-tight mb-3">
            Track Your Consignment
          </h1>
          <p className="text-[#5A6065] text-sm leading-relaxed">
            Follow the journey of your handcrafted couture in real time from our Surat atelier to your doorstep.
          </p>
        </div>

        {/* Search Bar Box */}
        <div className="bg-white border border-[#EBE7DF] rounded-2xl p-4 sm:p-6 shadow-sm mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C939A]" />
              <input
                id="tracking-query-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order ID (e.g. LZV-20261012-XXXX) or AWB Number"
                className="w-full pl-11 pr-4 py-3 text-sm bg-[#FBFBFA] border border-[#E5E0D8] rounded-xl text-[#1A1D20] placeholder-[#8C939A] focus:outline-none focus:border-[#226192] focus:ring-1 focus:ring-[#226192] transition-all font-mono"
              />
            </div>
            <Button
              id="tracking-search-button"
              type="submit"
              disabled={isLoading}
              className="bg-[#226192] hover:bg-[#1A4C73] text-white font-medium px-8 py-3 rounded-xl transition-all h-auto cursor-pointer"
            >
              {isLoading ? "Searching..." : "Track Order"}
            </Button>
          </form>

          {/* Quick Search Hints */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#8C939A]">
            <span>Quick formats:</span>
            <span className="font-mono bg-[#F2EFE9] px-2 py-0.5 rounded text-[#5A6065]">LZV-YYYYMMDD-XXXX</span>
            <span className="font-mono bg-[#F2EFE9] px-2 py-0.5 rounded text-[#5A6065]">VEL1234567890</span>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="bg-[#FFF8F6] border border-[#FCD8D4] rounded-2xl p-5 mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#D9381E] shrink-0 mt-0.5" />
            <div className="text-sm">
              <h3 className="font-medium text-[#D9381E] mb-1">Status Inquiry Notice</h3>
              <p className="text-[#7A2A20] leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Tracking Details View */}
        {trackingData && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Overview Card */}
            <div className="bg-white border border-[#EBE7DF] rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F2EFE9]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase tracking-widest text-[#8C939A]">Order Number</span>
                    <span className="text-sm font-mono font-semibold text-[#1A1D20]">{trackingData.orderNumber}</span>
                  </div>
                  {trackingData.awb && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-widest text-[#8C939A]">Waybill (AWB):</span>
                      <span className="text-sm font-mono font-medium text-[#226192]">{trackingData.awb}</span>
                      <button
                        onClick={() => handleCopyAwb(trackingData.awb!)}
                        className="text-[#8C939A] hover:text-[#226192] transition-colors p-1"
                        title="Copy AWB"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs uppercase tracking-widest text-[#8C939A] block">Logistics Partner</span>
                    <span className="text-sm font-medium text-[#1A1D20]">{trackingData.courierName}</span>
                  </div>
                  <span className="inline-flex px-3 py-1 bg-[#226192]/10 text-[#226192] text-xs font-semibold rounded-full uppercase tracking-wider">
                    {trackingData.currentStatus.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Progress Milestones Bar */}
              <div className="pt-8 pb-4">
                <div className="relative">
                  {/* Connecting Line */}
                  <div className="absolute top-5 left-6 right-6 h-0.5 bg-[#EBE7DF]">
                    <div
                      className="h-full bg-[#226192] transition-all duration-500"
                      style={{ width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%` }}
                    />
                  </div>

                  {/* Stage Nodes */}
                  <div className="relative flex justify-between">
                    {STAGES.map((stage, idx) => {
                      const Icon = stage.icon;
                      const isComplete = idx <= currentStageIndex;
                      const isCurrent = idx === currentStageIndex;

                      return (
                        <div key={stage.key} className="flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white ${
                              isComplete
                                ? "border-[#226192] text-[#226192]"
                                : "border-[#D6D0C5] text-[#A39C91]"
                            } ${isCurrent ? "ring-4 ring-[#226192]/15 scale-110 shadow-sm" : ""}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-xs mt-3 font-medium ${
                              isComplete ? "text-[#1A1D20]" : "text-[#A39C91]"
                            }`}
                          >
                            {stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Route & Dates Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 mt-6 border-t border-[#F2EFE9] text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#D88D2A] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#8C939A] block uppercase tracking-wider">Origin Hub</span>
                    <span className="text-[#1A1D20] font-medium">{trackingData.origin || "Surat Atelier Hub, Gujarat"}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#226192] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#8C939A] block uppercase tracking-wider">Destination</span>
                    <span className="text-[#1A1D20] font-medium">{trackingData.destination || "Customer Delivery Hub"}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#8C939A] block uppercase tracking-wider">Expected Delivery</span>
                    <span className="text-[#1A1D20] font-medium">
                      {trackingData.expectedDeliveryDate
                        ? new Date(trackingData.expectedDeliveryDate).toLocaleDateString("en-IN", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })
                        : "2 - 4 business days"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Activities Timeline */}
            <div className="bg-white border border-[#EBE7DF] rounded-2xl p-6 shadow-sm">
              <h2 className="font-serif text-lg font-medium text-[#1A1D20] mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#226192]" />
                Carrier Movement History
              </h2>

              {trackingData.activities && trackingData.activities.length > 0 ? (
                <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EBE7DF]">
                  {trackingData.activities.map((act, index) => (
                    <div key={index} className="relative flex items-start pl-8 group">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute left-2 top-1.5 w-3 h-3 rounded-full border-2 bg-white transition-all ${
                          index === 0
                            ? "border-[#226192] bg-[#226192] ring-4 ring-[#226192]/20"
                            : "border-[#8C939A]"
                        }`}
                      />

                      <div className="flex-1 bg-[#FBFBFA] border border-[#F0ECE1] rounded-xl p-3.5 group-hover:border-[#226192]/30 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <span className="font-semibold text-xs uppercase tracking-wider text-[#1A1D20]">
                            {act.status.replace(/_/g, " ")}
                          </span>
                          <span className="text-[11px] text-[#8C939A] font-mono">
                            {new Date(act.date_time).toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-[#5A6065] leading-relaxed mb-1">{act.activity}</p>
                        {act.location && (
                          <div className="flex items-center gap-1 text-[11px] text-[#8C939A]">
                            <MapPin className="w-3 h-3 text-[#D88D2A]" />
                            <span>{act.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-[#8C939A]">
                  <Package className="w-8 h-8 mx-auto text-[#D6D0C5] mb-2" />
                  <p>Consignment manifest created. Physical scan event pending at origin hub.</p>
                </div>
              )}
            </div>

            {/* Atelier Concierge Help Card */}
            <div className="bg-[#FAF8F5] border border-[#EBE7DF] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D88D2A]/10 text-[#D88D2A] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-medium text-sm text-[#1A1D20]">Need assistance with delivery?</h3>
                  <p className="text-xs text-[#5A6065]">
                    Our concierge atelier is available daily from 10 AM to 8 PM IST for special delivery arrangements.
                  </p>
                </div>
              </div>
              <Link href="/contact">
                <Button
                  variant="outline"
                  className="border-[#1A1D20] text-[#1A1D20] hover:bg-[#1A1D20] hover:text-white rounded-xl text-xs font-medium cursor-pointer"
                >
                  Contact Concierge
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
