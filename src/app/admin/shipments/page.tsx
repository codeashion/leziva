"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  Package,
  RefreshCw,
  Search,
  FileText,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShipmentItem {
  id: string;
  orderId: string;
  velocityOrderId: string;
  velocityShipmentId: string | null;
  awb: string | null;
  courierId: string | null;
  courierName: string | null;
  shipmentType: "FORWARD" | "REVERSE";
  status: string;
  labelUrl: string | null;
  manifestUrl: string | null;
  lastTrackingRefresh: string | null;
  lastProviderError: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Inspector modal
  const [inspectedShipment, setInspectedShipment] = useState<ShipmentItem | null>(null);

  // Create shipment dialog
  const [createOrderId, setCreateOrderId] = useState("");
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);

  // Reconcile dialog
  const [isReconciling, setIsReconciling] = useState(false);

  const fetchShipments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "15");
      if (selectedStatus !== "ALL") {
        params.set("status", selectedStatus);
      }
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const res = await fetch(`/api/v1/admin/shipments?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setShipments(data.data || []);
        if (data.meta) {
          setTotalPages(data.meta.totalPages || 1);
          setTotalCount(data.meta.total || 0);
        }
      } else {
        setShipments([]);
      }
    } catch {
      setBannerMessage({ text: "Failed to connect to admin shipment services", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedStatus, searchQuery]);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "15");
        if (selectedStatus !== "ALL") {
          params.set("status", selectedStatus);
        }
        if (searchQuery.trim()) {
          params.set("search", searchQuery.trim());
        }

        const res = await fetch(`/api/v1/admin/shipments?${params.toString()}`);
        const data = await res.json();

        if (!ignore) {
          if (res.ok && data.success) {
            setShipments(data.data || []);
            if (data.meta) {
              setTotalPages(data.meta.totalPages || 1);
              setTotalCount(data.meta.total || 0);
            }
          } else {
            setShipments([]);
          }
          setIsLoading(false);
        }
      } catch {
        if (!ignore) {
          setBannerMessage({ text: "Failed to connect to admin shipment services", type: "error" });
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [page, selectedStatus, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchShipments();
  };

  const handleRefreshTracking = async (shipmentId: string) => {
    setActionLoadingId(shipmentId);
    setBannerMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/shipments/${shipmentId}/track`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({ text: `Tracking refreshed: Current status is ${data.data?.current_status || "synced"}`, type: "success" });
        fetchShipments();
      } else {
        setBannerMessage({ text: data.error?.message || "Tracking refresh failed", type: "error" });
      }
    } catch {
      setBannerMessage({ text: "Network error during tracking refresh", type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelShipment = async (shipmentId: string) => {
    if (!confirm("Are you sure you want to request cancellation of this shipment with Velocity?")) {
      return;
    }
    setActionLoadingId(shipmentId);
    setBannerMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/shipments/${shipmentId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Admin requested order cancellation" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({ text: data.message || "Shipment cancellation processed", type: "success" });
        fetchShipments();
      } else {
        setBannerMessage({ text: data.error?.message || "Cancellation failed", type: "error" });
      }
    } catch {
      setBannerMessage({ text: "Network error during cancellation", type: "error" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createOrderId.trim()) return;

    setIsCreatingShipment(true);
    setBannerMessage(null);
    try {
      const res = await fetch("/api/v1/admin/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: createOrderId.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({ text: `Forward shipment manifested! AWB: ${data.data?.awb}`, type: "success" });
        setCreateOrderId("");
        fetchShipments();
      } else {
        setBannerMessage({ text: data.error?.message || "Shipment creation failed", type: "error" });
      }
    } catch {
      setBannerMessage({ text: "Network error creating shipment", type: "error" });
    } finally {
      setIsCreatingShipment(false);
    }
  };

  const handleRunReconciliation = async () => {
    setIsReconciling(true);
    setBannerMessage(null);
    try {
      const res = await fetch("/api/v1/admin/shipments/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoApply: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({
          text: `Reconciliation complete: ${data.data?.discrepanciesCount} evaluated, ${data.data?.syncedCount} synchronized with carrier.`,
          type: "success",
        });
        fetchShipments();
      } else {
        setBannerMessage({ text: data.error?.message || "Reconciliation failed", type: "error" });
      }
    } catch {
      setBannerMessage({ text: "Network error during reconciliation", type: "error" });
    } finally {
      setIsReconciling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full">DELIVERED</span>;
      case "OUT_FOR_DELIVERY":
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-full">OUT FOR DELIVERY</span>;
      case "IN_TRANSIT":
      case "PICKED_UP":
        return <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-full">{status}</span>;
      case "AWB_GENERATED":
      case "CREATED":
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-full">{status}</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold rounded-full">CANCELLED</span>;
      case "EXCEPTION":
      case "FAILED":
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-semibold rounded-full">{status}</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold rounded-full">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-widest text-[#8C939A]">Atelier Administration</span>
              <span className="text-xs text-[#8C939A]">•</span>
              <span className="text-xs font-medium text-[#226192]">Velocity Shipping API V1</span>
            </div>
            <h1 className="font-serif text-3xl font-medium text-[#1A1D20]">Shipment Lifecycle Management</h1>
            <p className="text-xs text-[#5A6065] mt-1">
              Carrier orchestration, waybill management, live telemetry and audit reconciliation.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRunReconciliation}
              disabled={isReconciling}
              variant="outline"
              className="border-[#226192] text-[#226192] hover:bg-[#226192]/5 rounded-xl text-xs font-medium flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? "animate-spin" : ""}`} />
              Reconcile Carrier Activity
            </Button>
            <Link href="/track">
              <Button
                variant="outline"
                className="border-[#8C939A] text-[#1A1D20] hover:bg-black/5 rounded-xl text-xs font-medium cursor-pointer"
              >
                Customer Track View
              </Button>
            </Link>
          </div>
        </div>

        {/* Global Notification Banner */}
        {bannerMessage && (
          <div
            className={`p-4 rounded-xl mb-6 text-sm flex items-center justify-between ${
              bannerMessage.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            <span>{bannerMessage.text}</span>
            <button onClick={() => setBannerMessage(null)} className="text-xs underline ml-4">
              Dismiss
            </button>
          </div>
        )}

        {/* Create Forward Shipment Form Card */}
        <div className="bg-white border border-[#EBE7DF] rounded-2xl p-5 mb-8 shadow-sm">
          <h2 className="text-sm font-semibold text-[#1A1D20] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#226192]" />
            Manifest Forward Consignment
          </h2>
          <form onSubmit={handleCreateShipment} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={createOrderId}
              onChange={(e) => setCreateOrderId(e.target.value)}
              placeholder="Internal Order ID or Order Number (e.g. ord_xxx or LZV-20261012-XXXX)"
              className="flex-1 px-4 py-2.5 text-sm bg-[#FBFBFA] border border-[#E5E0D8] rounded-xl text-[#1A1D20] font-mono focus:outline-none focus:border-[#226192]"
            />
            <Button
              type="submit"
              disabled={isCreatingShipment || !createOrderId.trim()}
              className="bg-[#226192] hover:bg-[#1A4C73] text-white font-medium px-6 py-2.5 rounded-xl text-xs cursor-pointer"
            >
              {isCreatingShipment ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Manifesting with Velocity...
                </>
              ) : (
                "Orchestrate Shipment"
              )}
            </Button>
          </form>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-[#EBE7DF] rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C939A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order # or AWB..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-[#FBFBFA] border border-[#E5E0D8] rounded-xl text-[#1A1D20] focus:outline-none focus:border-[#226192]"
            />
          </form>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
            <span className="text-[#8C939A] uppercase tracking-wider shrink-0 text-[11px] mr-1">Status:</span>
            {["ALL", "AWB_GENERATED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "EXCEPTION"].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setSelectedStatus(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedStatus === st
                    ? "bg-[#226192] text-white shadow-sm"
                    : "bg-[#F2EFE9] text-[#5A6065] hover:bg-[#EBE7DF]"
                }`}
              >
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Shipments Table Card */}
        <div className="bg-white border border-[#EBE7DF] rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#EBE7DF] text-[#8C939A] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Order / Velocity Ref</th>
                  <th className="py-3.5 px-4 font-semibold">AWB Code</th>
                  <th className="py-3.5 px-4 font-semibold">Carrier</th>
                  <th className="py-3.5 px-4 font-semibold">Type</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Created</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE9]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#8C939A]">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#226192]" />
                      Loading shipments from atelier repository...
                    </td>
                  </tr>
                ) : shipments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#8C939A]">
                      <Truck className="w-8 h-8 text-[#D6D0C5] mx-auto mb-2" />
                      No shipments found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  shipments.map((s) => (
                    <tr key={s.id} className="hover:bg-[#FAF9F7] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-[#1A1D20]">
                        <div>{s.velocityOrderId}</div>
                        <div className="text-[10px] text-[#8C939A]">ID: {s.id.substring(0, 14)}...</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-[#226192]">
                        {s.awb ? s.awb : <span className="text-[#8C939A] italic">Pending</span>}
                      </td>
                      <td className="py-3.5 px-4 text-[#1A1D20]">
                        {s.courierName || s.courierId || "Velocity Partner"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            s.shipmentType === "REVERSE"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {s.shipmentType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(s.status)}</td>
                      <td className="py-3.5 px-4 text-[#5A6065]">
                        {new Date(s.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Info */}
                          <button
                            onClick={() => setInspectedShipment(s)}
                            className="p-1.5 text-[#5A6065] hover:text-[#1A1D20] hover:bg-[#F2EFE9] rounded-lg transition-colors"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Refresh Tracking */}
                          {s.awb && (
                            <button
                              onClick={() => handleRefreshTracking(s.id)}
                              disabled={actionLoadingId === s.id}
                              className="p-1.5 text-[#226192] hover:bg-[#226192]/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Refresh Live Tracking"
                            >
                              <RefreshCw className={`w-4 h-4 ${actionLoadingId === s.id ? "animate-spin" : ""}`} />
                            </button>
                          )}

                          {/* Label View */}
                          {s.labelUrl && (
                            <a
                              href={`/api/v1/admin/shipments/${s.id}/label?mode=redirect`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="View Verified Shipping Label"
                            >
                              <FileText className="w-4 h-4" />
                            </a>
                          )}

                          {/* Cancel Shipment */}
                          {["CREATED", "AWB_GENERATED", "PICKUP_PENDING"].includes(s.status) && (
                            <button
                              onClick={() => handleCancelShipment(s.id)}
                              disabled={actionLoadingId === s.id}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Cancel Shipment"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="py-3 px-4 bg-[#FAF8F5] border-t border-[#EBE7DF] flex items-center justify-between text-xs text-[#5A6065]">
            <span>
              Total Shipments: <strong className="text-[#1A1D20]">{totalCount}</strong> | Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-7 text-xs border-[#D6D0C5] cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-7 text-xs border-[#D6D0C5] cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Detailed Shipment Inspector Modal */}
        {inspectedShipment && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#EBE7DF] rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[#F2EFE9] mb-4">
                <div>
                  <h3 className="font-serif text-lg font-medium text-[#1A1D20]">Shipment Telemetry Inspector</h3>
                  <p className="text-xs text-[#8C939A] font-mono">ID: {inspectedShipment.id}</p>
                </div>
                <button
                  onClick={() => setInspectedShipment(null)}
                  className="p-1 text-[#8C939A] hover:text-[#1A1D20] rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                <div>
                  <span className="text-[#8C939A] block uppercase">Internal Order Reference</span>
                  <span className="font-mono font-medium text-[#1A1D20]">{inspectedShipment.velocityOrderId}</span>
                </div>
                <div>
                  <span className="text-[#8C939A] block uppercase">AWB Tracking Code</span>
                  <span className="font-mono font-medium text-[#226192]">{inspectedShipment.awb || "None"}</span>
                </div>
                <div>
                  <span className="text-[#8C939A] block uppercase">Carrier Partner</span>
                  <span className="font-medium text-[#1A1D20]">{inspectedShipment.courierName || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[#8C939A] block uppercase">Current Internal Status</span>
                  <div>{getStatusBadge(inspectedShipment.status)}</div>
                </div>
                <div>
                  <span className="text-[#8C939A] block uppercase">Velocity Shipment ID</span>
                  <span className="font-mono text-[#5A6065]">{inspectedShipment.velocityShipmentId || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[#8C939A] block uppercase">Retry Count</span>
                  <span className="text-[#5A6065]">{inspectedShipment.retryCount}</span>
                </div>
              </div>

              {/* Provider Error / Diagnostic Box */}
              {inspectedShipment.lastProviderError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-xs">
                  <span className="font-semibold text-red-800 block mb-1">Sanitized Provider Exception:</span>
                  <p className="font-mono text-red-700 leading-relaxed break-all">
                    {inspectedShipment.lastProviderError}
                  </p>
                </div>
              )}

              {/* Label & Manifest Links */}
              <div className="pt-4 border-t border-[#F2EFE9] flex items-center justify-between">
                <div className="flex gap-2">
                  {inspectedShipment.labelUrl && (
                    <a
                      href={`/api/v1/admin/shipments/${inspectedShipment.id}/label?mode=redirect`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#226192] text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Label PDF
                    </a>
                  )}
                  {inspectedShipment.manifestUrl && (
                    <a
                      href={inspectedShipment.manifestUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#F2EFE9] text-[#1A1D20] rounded-lg text-xs font-medium flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Manifest PDF
                    </a>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInspectedShipment(null)}
                  className="text-xs cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
