"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CustomerItem {
  id: string;
  name: string | null;
  email: string;
  status: string;
  orderCount: number;
  lifetimeValue: number;
  lastOrderDate: string | null;
  createdAt: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // GDPR action
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchCustomers = React.useCallback(async (p: number, q: string) => {
    setIsLoading(true);
    try {
      const searchParam = q.trim() ? `&search=${encodeURIComponent(q.trim())}` : "";
      const res = await fetch(`/api/v1/admin/customers?page=${p}&limit=15${searchParam}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomers(data.data.customers);
        setTotalPages(data.data.totalPages);
        setTotalCount(data.data.total);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(page, searchQuery);
    }, 0);
    return () => clearTimeout(timer);
  }, [page, searchQuery, fetchCustomers]);

  const handleGdprDelete = async () => {
    if (!selectedCustomer) return;
    if (
      !confirm(
        `Are you sure you want to process GDPR data deletion for ${selectedCustomer.email}? Personal identification will be scrubbed, while legal financial order records are preserved.`
      )
    )
      return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/customers/${selectedCustomer.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({ text: "Customer personal identification anonymized.", type: "success" });
        setSelectedCustomer(null);
        fetchCustomers(page, searchQuery);
      } else {
        setBannerMessage({ text: data.error?.message || "Failed to process data deletion.", type: "error" });
      }
    } catch {
      setBannerMessage({ text: "Network error during GDPR processing.", type: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#0B192C]">
            Patron Management &amp; Privacy
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Customer directory, computed lifetime spend (LTV), order history, and GDPR right-to-be-forgotten controls.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchCustomers(page, searchQuery)}
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

      {/* Search Bar */}
      <div className="p-4 rounded-lg bg-white border border-[#EAE6DE] shadow-xs flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patron name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-md border border-[#EAE6DE] focus:outline-hidden focus:border-[#226192]"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg border border-[#EAE6DE] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#EAE6DE] text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Patron Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3">Completed Orders</th>
                <th className="px-4 py-3">Lifetime Value (LTV)</th>
                <th className="px-4 py-3">Last Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DE]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#226192]" />
                    Loading patron directory...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      {c.name || "Patron"}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">
                      {c.email}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold ${
                          c.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {c.orderCount} orders
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#0B192C]">
                      ₹{c.lifetimeValue.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCustomer(c)}
                        className="h-7 text-xs border-[#EAE6DE] hover:bg-slate-50"
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[#EAE6DE] flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong>{customers.length}</strong> of <strong>{totalCount}</strong> patrons
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-7 px-2 border-[#EAE6DE]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-7 px-2 border-[#EAE6DE]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Customer Modal / GDPR action */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-[#EAE6DE] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE6DE] pb-3">
              <div>
                <h2 className="text-base font-serif font-bold text-[#0B192C]">
                  Patron Profile
                </h2>
                <div className="text-xs text-slate-500">{selectedCustomer.email}</div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 grid grid-cols-2 gap-2">
                <div>Name: <strong>{selectedCustomer.name || "Patron"}</strong></div>
                <div>Status: <strong>{selectedCustomer.status}</strong></div>
                <div>Completed Orders: <strong>{selectedCustomer.orderCount}</strong></div>
                <div>Lifetime Spend: <strong>₹{selectedCustomer.lifetimeValue.toLocaleString("en-IN")}</strong></div>
              </div>

              <div className="p-4 rounded-md border border-rose-200 bg-rose-50/50 space-y-2">
                <div className="font-bold text-rose-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  GDPR Right to Be Forgotten
                </div>
                <p className="text-[11px] text-rose-700">
                  Anonymizes name, email, and credentials. Legally required transactional and tax records are maintained.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGdprDelete}
                  disabled={isDeleting}
                  className="w-full text-rose-700 border-rose-300 hover:bg-rose-100"
                >
                  {isDeleting ? "Anonymizing..." : "Execute GDPR Data Erasure"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
