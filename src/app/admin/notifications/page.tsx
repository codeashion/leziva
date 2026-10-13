"use client";

import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Edit,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationTemplateItem {
  id: string;
  eventKey: string;
  name: string;
  subject: string;
  bodyHtml: string;
  variables: string[];
  isActive: boolean;
  updatedAt: string;
}

export default function AdminNotificationsPage() {
  const [templates, setTemplates] = useState<NotificationTemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Editor Modal
  const [editingTmpl, setEditingTmpl] = useState<NotificationTemplateItem | null>(null);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Preview Modal
  const [previewTmpl, setPreviewTmpl] = useState<NotificationTemplateItem | null>(null);

  const fetchTemplates = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/admin/notifications");
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch {
      // error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTemplates();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchTemplates]);

  const handleOpenEditor = (tmpl: NotificationTemplateItem) => {
    setEditingTmpl(tmpl);
    setSubject(tmpl.subject);
    setBodyHtml(tmpl.bodyHtml);
    setIsActive(tmpl.isActive);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTmpl) return;
    setIsSaving(true);
    setBannerMessage(null);

    try {
      const res = await fetch("/api/v1/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventKey: editingTmpl.eventKey,
          name: editingTmpl.name,
          subject: subject.trim(),
          bodyHtml: bodyHtml.trim(),
          variables: editingTmpl.variables,
          isActive,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({ text: `Template "${editingTmpl.name}" saved successfully.`, type: "success" });
        setEditingTmpl(null);
        fetchTemplates();
      } else {
        setBannerMessage({ text: data.error?.message || "Failed to save template.", type: "error" });
      }
    } catch {
      setBannerMessage({ text: "Network error saving template.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const getMockPreview = (tmpl: NotificationTemplateItem) => {
    let renderedSubject = tmpl.subject;
    let renderedBody = tmpl.bodyHtml;

    const mockVars: Record<string, string> = {
      customerName: "Maharani Gayatri Devi",
      orderNumber: "LZV-2026-94821",
      totalAmount: "1,62,400",
      paymentId: "pay_rzp_live_94820",
      courierName: "BlueDart Luxury Express",
      awb: "VEL-94829104",
      reverseAwb: "REV-VEL-948201",
      status: "In Transit at Mumbai Air Cargo Hub",
      location: "Chhatrapati Shivaji Maharaj T2",
      reason: "Patron bespoke consultation complete",
      refundAmount: "1,62,400",
      refundId: "rfnd_rzp_94820",
      ticketNumber: "TCK-84219",
      agentMessage: "Your bespoke waist embroidery has been adjusted to 28 inches by our master atelier artisan.",
    };

    for (const [key, val] of Object.entries(mockVars)) {
      renderedSubject = renderedSubject.replace(new RegExp(`{{${key}}}`, "g"), val);
      renderedBody = renderedBody.replace(new RegExp(`{{${key}}}`, "g"), val);
    }

    return { subject: renderedSubject, body: renderedBody };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#0B192C]">
            Transactional Notification Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure automated customer communications for order, payment, shipping, and return lifecycle events.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchTemplates}
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

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400 bg-white rounded-lg border border-[#EAE6DE]">
            Loading notification templates...
          </div>
        ) : (
          templates.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-lg border border-[#EAE6DE] p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-xs bg-slate-100 text-slate-600 font-semibold">
                    {t.eventKey}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                      t.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {t.isActive ? "ACTIVE" : "DISABLED"}
                  </span>
                </div>

                <h2 className="text-sm font-serif font-bold text-[#0B192C]">{t.name}</h2>
                <p className="text-xs text-slate-500 line-clamp-1">Subject: {t.subject}</p>

                {/* Available Variables */}
                <div className="pt-1 flex flex-wrap gap-1">
                  {t.variables.map((v) => (
                    <span
                      key={v}
                      className="text-[10px] font-mono px-1.5 py-0.5 bg-[#FAF8F5] border border-[#EAE6DE] text-slate-600 rounded-xs"
                    >
                      &#123;&#123;{v}&#125;&#125;
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#EAE6DE]/60 flex items-center justify-between">
                <button
                  onClick={() => setPreviewTmpl(t)}
                  className="text-xs text-[#226192] hover:underline flex items-center gap-1 font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Live Preview
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditor(t)}
                  className="h-7 text-xs border-[#EAE6DE]"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Configure
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal */}
      {editingTmpl && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-[#EAE6DE] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE6DE] pb-3">
              <div>
                <h2 className="text-base font-serif font-bold text-[#0B192C]">
                  Configure: {editingTmpl.name}
                </h2>
                <div className="text-[11px] font-mono text-slate-400">
                  Event: {editingTmpl.eventKey}
                </div>
              </div>
              <button onClick={() => setEditingTmpl(null)} className="text-slate-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email Subject Line *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-700">
                    HTML Message Body *
                  </label>
                  <span className="text-[10px] text-slate-400">Supports HTML formatting</span>
                </div>
                <textarea
                  rows={6}
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE] font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Available Interpolation Tags
                </label>
                <div className="flex flex-wrap gap-1 p-2 bg-[#FAF8F5] rounded-md border border-[#EAE6DE]">
                  {editingTmpl.variables.map((v) => (
                    <span
                      key={v}
                      className="text-[10px] font-mono px-1.5 py-0.5 bg-white border border-[#EAE6DE] text-slate-700 rounded-xs"
                    >
                      &#123;&#123;{v}&#125;&#125;
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Template Status
                </label>
                <select
                  value={isActive ? "ACTIVE" : "INACTIVE"}
                  onChange={(e) => setIsActive(e.target.value === "ACTIVE")}
                  className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                >
                  <option value="ACTIVE">Active (Automated dispatch enabled)</option>
                  <option value="INACTIVE">Inactive (Disabled)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EAE6DE]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingTmpl(null)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#226192] text-white hover:bg-[#1a4b73]"
                >
                  {isSaving ? "Saving..." : "Save Template"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTmpl && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-[#EAE6DE] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE6DE] pb-3">
              <h2 className="text-base font-serif font-bold text-[#0B192C]">
                Rendered Preview: {previewTmpl.name}
              </h2>
              <button onClick={() => setPreviewTmpl(null)} className="text-slate-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const preview = getMockPreview(previewTmpl);
              return (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Subject
                    </span>
                    <span className="font-semibold text-slate-900">{preview.subject}</span>
                  </div>

                  <div className="p-4 bg-white rounded-md border border-[#EAE6DE] space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Body (Client Inbox View)
                    </span>
                    <div
                      className="prose prose-sm text-xs text-slate-700"
                      dangerouslySetInnerHTML={{ __html: preview.body }}
                    />
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end pt-2 border-t border-[#EAE6DE]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewTmpl(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
