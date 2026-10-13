"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewItem {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  productId: string;
  productTitle: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  isVerifiedBuyer: boolean;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "ALL">("PENDING");
  const [isLoading, setIsLoading] = useState(true);
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchReviews = React.useCallback(async (status: string) => {
    setIsLoading(true);
    try {
      const url = status === "ALL" ? "/api/v1/admin/reviews" : `/api/v1/admin/reviews?status=${status}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
      }
    } catch {
      // error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReviews(activeTab);
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, fetchReviews]);

  const handleModerate = async (id: string, isApproved: boolean) => {
    try {
      const res = await fetch(`/api/v1/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({
          text: `Review ${isApproved ? "approved and published" : "rejected"}.`,
          type: "success",
        });
        fetchReviews(activeTab);
      } else {
        setBannerMessage({ text: data.error?.message || "Failed to moderate review.", type: "error" });
      }
    } catch {
      setBannerMessage({ text: "Network error moderating review.", type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const res = await fetch(`/api/v1/admin/reviews/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({ text: "Review deleted permanently.", type: "success" });
        fetchReviews(activeTab);
      } else {
        setBannerMessage({ text: data.error?.message || "Failed to delete review.", type: "error" });
      }
    } catch {
      setBannerMessage({ text: "Network error deleting review.", type: "error" });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#0B192C]">
            Patron Reviews &amp; Testimonials Moderation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review customer feedback, verify genuine purchases, and moderate public product ratings.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchReviews(activeTab)}
          disabled={isLoading}
          className="border-[#EAE6DE]"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#EAE6DE] pb-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === "PENDING"
              ? "bg-[#226192] text-white shadow-2xs"
              : "text-slate-600 hover:text-black hover:bg-slate-100"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Pending Moderation Queue
        </button>
        <button
          onClick={() => setActiveTab("APPROVED")}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === "APPROVED"
              ? "bg-[#0B192C] text-white shadow-2xs"
              : "text-slate-600 hover:text-black hover:bg-slate-100"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Approved &amp; Published
        </button>
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === "ALL"
              ? "bg-slate-700 text-white shadow-2xs"
              : "text-slate-600 hover:text-black hover:bg-slate-100"
          }`}
        >
          All Feedback Records
        </button>
      </div>

      {/* Reviews Queue */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-lg border border-[#EAE6DE]">
            Loading patron review queue...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-lg border border-[#EAE6DE]">
            No reviews found matching this filter state.
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-lg border border-[#EAE6DE] p-5 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4"
            >
              <div className="space-y-2 max-w-3xl">
                {/* Meta info & Rating */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>

                  <span className="font-semibold text-xs text-slate-900">{r.userName}</span>

                  {r.isVerifiedBuyer && (
                    <span className="px-2 py-0.5 rounded-xs bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified Atelier Purchaser
                    </span>
                  )}

                  <span className="text-slate-400 text-[11px]">&bull;</span>
                  <span className="text-slate-400 text-[11px] font-mono">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Product link */}
                <div className="text-xs font-semibold text-[#226192]">
                  Ensemble: {r.productTitle}
                </div>

                {/* Comment quote */}
                {r.comment && (
                  <p className="text-xs text-slate-700 italic bg-[#FAF8F5] p-3 rounded-md border border-[#EAE6DE]/60">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                )}
              </div>

              {/* Moderation actions */}
              <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                    r.isApproved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {r.isApproved ? "APPROVED" : "PENDING APPROVAL"}
                </span>

                <div className="flex items-center gap-1.5 pt-1">
                  {!r.isApproved ? (
                    <Button
                      size="sm"
                      onClick={() => handleModerate(r.id, true)}
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleModerate(r.id, false)}
                      className="h-8 text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Unpublish
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(r.id)}
                    className="h-8 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
