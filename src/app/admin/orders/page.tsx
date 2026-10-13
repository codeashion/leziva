"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Truck,
  CreditCard,
  DollarSign,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderItem {
  id: string;
  orderNumber: string;
  guestName?: string | null;
  guestEmail?: string | null;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  createdAt: string;
  items?: Array<{
    id: string;
    productTitle: string;
    variantTitle: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }>;
}

interface DetailedOrder extends OrderItem {
  verifiedPayment?: {
    method: string;
    status: string;
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
    isVerified: boolean;
  };
  activeShipment?: {
    awb: string | null;
    courierName: string | null;
    status: string;
    labelUrl: string | null;
    trackingActivities: unknown[];
  } | null;
  shippingAddressSnapshot?: Record<string, unknown>;
  notes?: string | null;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Inspector Modal
  const [inspectedOrder, setInspectedOrder] = useState<DetailedOrder | null>(null);

  // Status transition form
  const [newStatus, setNewStatus] = useState("");
  const [transitionReason, setTransitionReason] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Refund dialog
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchOrders = React.useCallback(async (p: number, q: string, s: string) => {
    setIsLoading(true);
    try {
      const statusParam = s !== "ALL" ? `&status=${s}` : "";
      const searchParam = q.trim() ? `&search=${encodeURIComponent(q.trim())}` : "";
      const res = await fetch(`/api/v1/admin/orders?page=${p}&limit=15${statusParam}${searchParam}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.data.orders);
        setTotalPages(data.data.totalPages);
        setTotalCount(data.data.total);
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(page, searchQuery, selectedStatus);
    }, 0);
    return () => clearTimeout(timer);
  }, [page, searchQuery, selectedStatus, fetchOrders]);

  const handleInspect = async (orderId: string) => {
    setInspectedOrder(null);
    try {
      const res = await fetch(`/api/v1/admin/orders/${orderId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setInspectedOrder(data.data);
        setNewStatus(data.data.status);
        setRefundAmount(String(data.data.totalAmount));
      }
    } catch {
      // error
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectedOrder || !newStatus) return;
    setIsUpdatingStatus(true);
    setBannerMessage(null);

    try {
      const res = await fetch(`/api/v1/admin/orders/${inspectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reason: transitionReason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({ text: "Order status transitioned successfully.", type: "success" });
        setInspectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        fetchOrders(page, searchQuery, selectedStatus);
      } else {
        setBannerMessage({ text: data.error?.message || "Status transition rejected.", type: "error" });
      }
    } catch {
      setBannerMessage({ text: "Network error during transition.", type: "error" });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectedOrder) return;
    setIsRefunding(true);
    setBannerMessage(null);

    try {
      const res = await fetch(`/api/v1/admin/orders/${inspectedOrder.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(refundAmount) || undefined,
          reason: refundReason || "Customer cancellation / refund request",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({
          text: `Refund of INR ${data.data.amountRefunded} processed via Razorpay (Ref: ${data.data.refundId})`,
          type: "success",
        });
        setInspectedOrder((prev) =>
          prev
            ? { ...prev, status: data.data.orderStatus, paymentStatus: data.data.paymentStatus }
            : null
        );
        fetchOrders(page, searchQuery, selectedStatus);
      } else {
        setBannerMessage({ text: data.error?.message || "Refund processing failed.", type: "error" });
      }
    } catch {
      setBannerMessage({ text: "Network error connecting to payment gateway.", type: "error" });
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#0B192C]">
            Order Management &amp; Fulfillment
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search orders, inspect verified Razorpay transactions, and view linked Velocity waybills.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchOrders(page, searchQuery, selectedStatus)}
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

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-lg bg-white border border-[#EAE6DE] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order number or customer name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-md border border-[#EAE6DE] focus:outline-hidden focus:border-[#226192]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {[
            "ALL",
            "PENDING_PAYMENT",
            "PAYMENT_CONFIRMED",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
            "REFUNDED",
          ].map((st) => (
            <button
              key={st}
              onClick={() => {
                setSelectedStatus(st);
                setPage(1);
              }}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-xs whitespace-nowrap transition-colors ${
                selectedStatus === st
                  ? "bg-[#226192] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-[#EAE6DE] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#EAE6DE] text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Order Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DE]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#226192]" />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No orders found matching criteria.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-semibold text-[#226192]">
                      {ord.orderNumber}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-900">{ord.guestName || "Patron"}</div>
                      <div className="text-[10px] text-slate-400">{ord.guestEmail}</div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      ₹{Number(ord.totalAmount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-[11px] text-slate-700">
                          {ord.paymentMethod}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-2xs text-[9px] font-bold ${
                            ord.paymentStatus === "CAPTURED"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.paymentStatus === "REFUNDED"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold ${
                          ord.status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800"
                            : ord.status === "CANCELLED"
                            ? "bg-rose-100 text-rose-800"
                            : ord.status === "SHIPPED"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInspect(ord.id)}
                        className="h-7 text-xs border-[#EAE6DE] hover:bg-[#226192] hover:text-white"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Inspect
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
            Showing <strong>{orders.length}</strong> of <strong>{totalCount}</strong> orders
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

      {/* Inspector Modal / Detail Drawer */}
      {inspectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-[#EAE6DE] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#EAE6DE] pb-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#0B192C]">
                  Order #{inspectedOrder.orderNumber}
                </h2>
                <div className="text-xs text-slate-400 font-mono">
                  ID: {inspectedOrder.id} &bull; {new Date(inspectedOrder.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setInspectedOrder(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Workflow 2 Verification: Verified Razorpay Payment */}
            <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#226192]" />
                  Verified Payment Intelligence
                </span>
                <span
                  className={`px-2 py-0.5 rounded-xs font-bold text-[10px] ${
                    inspectedOrder.verifiedPayment?.isVerified
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {inspectedOrder.verifiedPayment?.isVerified ? "VERIFIED ONLINE" : "PENDING"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div>Method: <strong>{inspectedOrder.paymentMethod}</strong></div>
                <div>Status: <strong>{inspectedOrder.paymentStatus}</strong></div>
                <div>Gateway Order: <strong>{inspectedOrder.verifiedPayment?.razorpayOrderId || "N/A"}</strong></div>
                <div>Payment ID: <strong>{inspectedOrder.verifiedPayment?.razorpayPaymentId || "N/A"}</strong></div>
              </div>
            </div>

            {/* Workflow 3 Verification: Velocity AWB and Shipping Link */}
            <div className="p-4 rounded-md bg-sky-50/60 border border-sky-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-sky-600" />
                  Velocity Logistics Tracking
                </span>
                {inspectedOrder.activeShipment?.awb && (
                  <Link
                    href={`/track?awb=${inspectedOrder.activeShipment.awb}`}
                    target="_blank"
                    className="text-[11px] text-sky-700 underline font-semibold flex items-center gap-1"
                  >
                    Open Live Timeline <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
              {inspectedOrder.activeShipment ? (
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div>Carrier: <strong>{inspectedOrder.activeShipment.courierName || "Velocity Carrier"}</strong></div>
                  <div>AWB Number: <strong className="text-sky-800">{inspectedOrder.activeShipment.awb || "Generating"}</strong></div>
                  <div>Carrier Status: <strong>{inspectedOrder.activeShipment.status}</strong></div>
                  <div>
                    {inspectedOrder.activeShipment.labelUrl && (
                      <Link
                        href={`/api/v1/admin/shipments/${inspectedOrder.id}/label`}
                        target="_blank"
                        className="text-sky-700 underline"
                      >
                        Download Shipping Label
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 py-1">
                  Shipment waybill not yet manifested for this order. Dispatch via Shipments dashboard.
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-slate-700 uppercase tracking-wider block">
                Atelier Ensembles ({inspectedOrder.items?.length || 0})
              </span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden">
                {inspectedOrder.items?.map((item) => (
                  <div key={item.id} className="p-3 flex justify-between items-center bg-white">
                    <div>
                      <div className="font-semibold text-slate-900">{item.productTitle}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.variantTitle} &bull; SKU: <span className="font-mono">{item.sku}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">
                        ₹{item.unitPrice.toLocaleString("en-IN")} &times; {item.quantity}
                      </div>
                      <div className="text-[11px] text-slate-500 font-bold">
                        ₹{(item.unitPrice * item.quantity).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* State Transition Action */}
            <form onSubmit={handleUpdateStatus} className="p-4 rounded-md border border-[#EAE6DE] space-y-3">
              <span className="text-xs font-bold text-[#0B192C] uppercase tracking-wider block">
                Update Order Lifecycle Status
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">New Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                  >
                    {[
                      "PENDING_PAYMENT",
                      "PAYMENT_CONFIRMED",
                      "PROCESSING",
                      "PACKED",
                      "SHIPPED",
                      "OUT_FOR_DELIVERY",
                      "DELIVERED",
                      "CANCELLED",
                      "RETURN_REQUESTED",
                      "REFUNDED",
                    ].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Audit Reason</label>
                  <input
                    type="text"
                    placeholder="Reason for lifecycle update..."
                    value={transitionReason}
                    onChange={(e) => setTransitionReason(e.target.value)}
                    className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                  />
                </div>
              </div>
              <Button type="submit" size="sm" disabled={isUpdatingStatus} className="bg-[#226192] text-white">
                {isUpdatingStatus ? "Updating..." : "Commit Status Change"}
              </Button>
            </form>

            {/* Workflow 4: Refund Execution (Tracked Separately From Return Approval) */}
            <form onSubmit={handleProcessRefund} className="p-4 rounded-md border border-purple-200 bg-purple-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-purple-700" />
                  Razorpay Financial Refund Execution
                </span>
                <span className="text-[10px] text-purple-700 font-medium">
                  Separate from return approval
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-purple-900 mb-1">Refund Amount (INR)</label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    max={inspectedOrder.totalAmount}
                    className="w-full p-2 bg-white rounded-md border border-purple-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-purple-900 mb-1">Refund Reason</label>
                  <input
                    type="text"
                    placeholder="Reason for financial credit..."
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full p-2 bg-white rounded-md border border-purple-200"
                  />
                </div>
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={isRefunding || inspectedOrder.paymentStatus === "REFUNDED"}
                className="bg-purple-800 text-white hover:bg-purple-900"
              >
                {isRefunding ? "Processing Refund..." : "Execute Gateway Refund"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
