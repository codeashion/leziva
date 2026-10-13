"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Download,
  FileSpreadsheet,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState<"SALES" | "ORDERS" | "PRODUCTS" | "INVENTORY" | "CUSTOMERS">("ORDERS");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const downloadUrl = `/api/v1/admin/reports/export?type=${reportType}${
    startDate ? `&startDate=${startDate}` : ""
  }${endDate ? `&endDate=${endDate}` : ""}`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#0B192C]">
          Business Reports &amp; Data Exports
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Export verified transaction records, inventory valuation, and sales reports with strict CSV formula injection mitigation.
        </p>
      </div>

      {/* Security Defense Callout */}
      <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900">
        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
        <span>
          <strong>Formula Injection Defense Active:</strong> All CSV exports automatically sanitize leading spreadsheet calculation symbols (<code>=</code>, <code>+</code>, <code>-</code>, <code>@</code>) to prevent formula execution in Microsoft Excel or Google Sheets.
        </span>
      </div>

      {/* Report Generator Card */}
      <div className="p-6 bg-white rounded-lg border border-[#EAE6DE] shadow-xs space-y-6 max-w-2xl">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Report Dataset
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { type: "ORDERS", label: "Orders & Fulfillment" },
              { type: "SALES", label: "Sales & Financials" },
              { type: "PRODUCTS", label: "Product Catalog" },
              { type: "INVENTORY", label: "SKU Stock Valuation" },
              { type: "CUSTOMERS", label: "Patron Activity" },
            ].map((r) => (
              <button
                key={r.type}
                type="button"
                onClick={() => setReportType(r.type as typeof reportType)}
                className={`p-3 rounded-md border text-left text-xs font-semibold transition-colors ${
                  reportType === r.type
                    ? "border-[#226192] bg-[#226192]/5 text-[#226192]"
                    : "border-[#EAE6DE] text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 mb-1.5 text-slate-400" />
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Start Date (Optional)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#EAE6DE] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Format: UTF-8 Encoded CSV &bull; Streaming Output
          </div>
          <Link href={downloadUrl} target="_blank">
            <Button className="bg-[#226192] text-white hover:bg-[#1a4b73]">
              <Download className="w-4 h-4 mr-2" />
              Download {reportType} CSV
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
