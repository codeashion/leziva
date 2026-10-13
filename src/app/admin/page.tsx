"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Package,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OverviewMetrics {
  grossSales: number;
  netSales: number;
  totalOrders: number;
  paidOrders: number;
  codOrders: number;
  averageOrderValue: number;
  refundTotal: number;
  cancelledOrdersTotal: number;
  pendingFulfillment: number;
  shipmentsInTransit: number;
  deliveredShipments: number;
  returnRequestsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  topSellingProducts: Array<{
    id: string;
    title: string;
    sku: string;
    unitsSold: number;
    revenue: number;
  }>;
  salesByCategory: Array<{
    category: string;
    totalSales: number;
    percentage: number;
  }>;
  salesOverTime: Array<{
    date: string;
    grossSales: number;
    netSales: number;
    orderCount: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    guestName?: string | null;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    resourceType: string;
    actorName?: string;
    createdAt: string;
  }>;
}

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"today" | "7d" | "30d" | "this_month">("30d");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchMetrics = React.useCallback(async (range: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/analytics/overview?dateRange=${range}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setMetrics(json.data);
      } else {
        setErrorMessage(json.error?.message || "Failed to load dashboard metrics");
      }
    } catch {
      setErrorMessage("Network connection error loading analytics telemetry.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMetrics(dateRange);
    }, 0);
    return () => clearTimeout(timer);
  }, [dateRange, fetchMetrics]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#0B192C] tracking-tight">
            Atelier Governance &amp; Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time financial reconciliation, orders fulfillment, and inventory intelligence.
          </p>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md bg-white border border-[#EAE6DE] p-1 shadow-2xs">
            {(["today", "7d", "30d", "this_month"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors ${
                  dateRange === r
                    ? "bg-[#226192] text-white shadow-xs"
                    : "text-slate-600 hover:text-black hover:bg-slate-50"
                }`}
              >
                {r === "today"
                  ? "Today"
                  : r === "7d"
                  ? "Last 7 Days"
                  : r === "30d"
                  ? "Last 30 Days"
                  : "This Month"}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMetrics(dateRange)}
            disabled={isLoading}
            className="border-[#EAE6DE] hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {errorMessage}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div className="p-5 rounded-lg bg-white border border-[#EAE6DE] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Gross Sales
            </span>
            <div className="w-8 h-8 rounded-full bg-[#226192]/10 flex items-center justify-center text-[#226192]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#0B192C]">
            ₹{(metrics?.grossSales || 0).toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Total placed orders before discounts
          </div>
        </div>

        {/* Net Sales */}
        <div className="p-5 rounded-lg bg-white border border-[#EAE6DE] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Net Revenue
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-700">
            ₹{(metrics?.netSales || 0).toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Deducted discounts, returns &amp; refunds
          </div>
        </div>

        {/* Orders Count */}
        <div className="p-5 rounded-lg bg-white border border-[#EAE6DE] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-8 h-8 rounded-full bg-[#EF8557]/10 flex items-center justify-center text-[#EF8557]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#0B192C]">
            {metrics?.totalOrders || 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex gap-2">
            <span>Paid: <strong className="text-emerald-600">{metrics?.paidOrders || 0}</strong></span>
            <span>COD: <strong className="text-amber-600">{metrics?.codOrders || 0}</strong></span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-5 rounded-lg bg-white border border-[#EAE6DE] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Avg Order Value
            </span>
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-[#0B192C]">
            ₹{(metrics?.averageOrderValue || 0).toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Per confirmed patron checkout
          </div>
        </div>
      </div>

      {/* Operational Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/admin/orders?status=PROCESSING"
          className="p-4 rounded-lg bg-white border border-[#EAE6DE] hover:border-[#226192] transition-colors shadow-2xs group"
        >
          <div className="text-xs text-slate-500 font-medium">Pending Fulfillment</div>
          <div className="mt-2 text-xl font-bold text-[#226192] group-hover:underline">
            {metrics?.pendingFulfillment || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Awaiting dispatch</div>
        </Link>

        <Link
          href="/admin/shipments?status=IN_TRANSIT"
          className="p-4 rounded-lg bg-white border border-[#EAE6DE] hover:border-[#226192] transition-colors shadow-2xs group"
        >
          <div className="text-xs text-slate-500 font-medium">In Transit (Velocity)</div>
          <div className="mt-2 text-xl font-bold text-sky-600 group-hover:underline">
            {metrics?.shipmentsInTransit || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Active waybills</div>
        </Link>

        <Link
          href="/admin/inventory"
          className="p-4 rounded-lg bg-white border border-[#EAE6DE] hover:border-amber-400 transition-colors shadow-2xs group"
        >
          <div className="text-xs text-slate-500 font-medium">Low Stock Alerts</div>
          <div className="mt-2 text-xl font-bold text-amber-600 group-hover:underline">
            {metrics?.lowStockCount || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Below threshold</div>
        </Link>

        <Link
          href="/admin/orders?status=RETURN_REQUESTED"
          className="p-4 rounded-lg bg-white border border-[#EAE6DE] hover:border-rose-400 transition-colors shadow-2xs group"
        >
          <div className="text-xs text-slate-500 font-medium">Return Requests</div>
          <div className="mt-2 text-xl font-bold text-rose-600 group-hover:underline">
            {metrics?.returnRequestsCount || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Pending review</div>
        </Link>
      </div>

      {/* Sales Trend & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Visualization */}
        <div className="lg:col-span-2 p-6 rounded-lg bg-white border border-[#EAE6DE] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B192C]">
              Daily Sales Trajectory
            </h2>
            <span className="text-xs text-slate-400">Verified Database Records</span>
          </div>

          {metrics?.salesOverTime && metrics.salesOverTime.length > 0 ? (
            <div className="space-y-3 pt-2">
              {metrics.salesOverTime.slice(-7).map((d) => (
                <div key={d.date} className="flex items-center gap-4 text-xs">
                  <span className="w-20 font-mono text-slate-500">{d.date}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-[#226192] h-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (d.grossSales / ((metrics.grossSales || 1) / 5)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="w-24 text-right font-semibold text-slate-800">
                    ₹{d.grossSales.toLocaleString("en-IN")}
                  </span>
                  <span className="w-14 text-right text-slate-400">
                    {d.orderCount} ord
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No sales recorded for this date filter window.
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="p-6 rounded-lg bg-white border border-[#EAE6DE] shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B192C]">
            Sales by Category
          </h2>

          {metrics?.salesByCategory && metrics.salesByCategory.length > 0 ? (
            <div className="space-y-4 pt-2">
              {metrics.salesByCategory.map((c) => (
                <div key={c.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{c.category}</span>
                    <span className="font-semibold text-slate-900">
                      ₹{c.totalSales.toLocaleString("en-IN")} ({c.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#EF8557]"
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No category breakdown available.
            </div>
          )}
        </div>
      </div>

      {/* Tables: Recent Orders & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 p-6 rounded-lg bg-white border border-[#EAE6DE] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B192C]">
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[#226192] hover:underline flex items-center"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#EAE6DE] text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5">Order</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Total</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
                  metrics.recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/60">
                      <td className="py-3 font-mono font-medium text-[#226192]">
                        <Link href={`/admin/orders`}>{o.orderNumber}</Link>
                      </td>
                      <td className="py-3 text-slate-600">{o.guestName || "Patron"}</td>
                      <td className="py-3 font-semibold text-slate-900">
                        ₹{Number(o.totalAmount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold ${
                            o.paymentStatus === "CAPTURED"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {o.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No orders placed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Activity Stream */}
        <div className="p-6 rounded-lg bg-white border border-[#EAE6DE] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0B192C]">
              Operational Activity
            </h2>
            <Link
              href="/admin/audit"
              className="text-xs font-semibold text-[#226192] hover:underline flex items-center"
            >
              Logs <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
              metrics.recentActivity.slice(0, 6).map((act) => (
                <div key={act.id} className="text-xs border-l-2 border-[#226192] pl-3 py-1 space-y-0.5">
                  <div className="font-semibold text-slate-800">{act.action}</div>
                  <div className="text-[11px] text-slate-500">
                    By {act.actorName || "System"} on {act.resourceType}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {new Date(act.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent activity recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
