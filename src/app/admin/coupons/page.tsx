"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CouponItem {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  maxUses: number | null;
  usedCount: number;
  perUserLimit: number | null;
  isActive: boolean;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("10");
  const [minOrderValue, setMinOrderValue] = useState("5000");
  const [maxDiscount, setMaxDiscount] = useState("2500");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchCoupons = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/admin/coupons");
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons(data.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCoupons();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCoupons]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/v1/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          description: description.trim(),
          discountType,
          discountValue: parseFloat(discountValue),
          minOrderValue: parseFloat(minOrderValue) || undefined,
          maxDiscount: parseFloat(maxDiscount) || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({ text: `Coupon ${code.toUpperCase()} successfully created.`, type: "success" });
        setIsModalOpen(false);
        setCode("");
        fetchCoupons();
      } else {
        setBannerMessage({ text: data.error?.message || "Failed to create coupon.", type: "error" });
      }
    } catch {
      setBannerMessage({ text: "Network error saving coupon.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#0B192C]">
            Coupons &amp; Promotional Concierge
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure luxury atelier promotional codes, minimum order requirements, and usage caps.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="bg-[#226192] text-white hover:bg-[#1a4b73]"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Coupon
        </Button>
      </div>

      {bannerMessage && (
        <div
          className={`p-4 rounded-md text-xs font-medium flex items-center justify-between ${
            bannerMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{bannerMessage.text}</span>
          <button onClick={() => setBannerMessage(null)} className="underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-lg border border-[#EAE6DE] shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF8F5] border-b border-[#EAE6DE] text-slate-500 uppercase font-semibold">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Benefit</th>
              <th className="px-4 py-3">Min Order</th>
              <th className="px-4 py-3">Max Cap</th>
              <th className="px-4 py-3">Redemptions</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAE6DE]/60">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  Loading coupon records...
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3.5 font-mono font-bold text-[#226192]">
                  {c.code}
                </td>
                <td className="px-4 py-3.5 font-semibold text-slate-800">
                  {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                </td>
                <td className="px-4 py-3.5 text-slate-600">
                  {c.minOrderValue ? `₹${c.minOrderValue.toLocaleString("en-IN")}` : "No Minimum"}
                </td>
                <td className="px-4 py-3.5 text-slate-600">
                  {c.maxDiscount ? `₹${c.maxDiscount.toLocaleString("en-IN")}` : "Unlimited"}
                </td>
                <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                  {c.usedCount} / {c.maxUses || "&infin;"}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold ${
                      c.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {c.isActive ? "ACTIVE" : "EXPIRED"}
                  </span>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-[#EAE6DE] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE6DE] pb-3">
              <h2 className="text-base font-serif font-bold text-[#0B192C]">
                Create Promotional Coupon
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. DIWALI20"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE] font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Festive promotion"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as typeof discountType)}
                    className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed INR Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Min Order Value (INR)
                  </label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Max Cap (INR)
                  </label>
                  <input
                    type="number"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#EAE6DE] flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-[#226192] text-white">
                  {isSubmitting ? "Creating..." : "Save Coupon"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
