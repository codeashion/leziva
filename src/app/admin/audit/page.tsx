"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuditLogItem {
  id: string;
  actorId: string | null;
  actorName: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/admin/audit-logs?limit=50");
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs(data.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const filteredLogs = logs.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.resourceType.toLowerCase().includes(q) ||
      l.actorName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#0B192C]">
            Security Audit Trail &amp; Governance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable records of administrative mutations: product changes, inventory movements, status overrides, and refund executions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          disabled={isLoading}
          className="border-[#EAE6DE]"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Trail
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-lg bg-white border border-[#EAE6DE] shadow-xs flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action, resource, or actor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-md border border-[#EAE6DE] focus:outline-hidden focus:border-[#226192]"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg border border-[#EAE6DE] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#EAE6DE] text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action Executed</th>
                <th className="px-4 py-3">Resource Target</th>
                <th className="px-4 py-3">Sanitized Parameters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DE]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#226192]" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No audit records match the query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {log.actorName}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] font-bold text-[#226192]">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="px-1.5 py-0.5 rounded-2xs text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {log.resourceType}
                      </span>
                      {log.resourceId && (
                        <span className="ml-1 font-mono text-[10px] text-slate-400">
                          #{log.resourceId}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate font-mono text-[10px] text-slate-500">
                      {log.metadata ? JSON.stringify(log.metadata) : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
