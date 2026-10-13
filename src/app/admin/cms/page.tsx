"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Image as ImageIcon,
  Plus,
  Edit,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CmsPageItem {
  id: string;
  slug: string;
  title: string;
  content: string;
  status: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  updatedAt: string;
}

interface HeroBannerItem {
  id: string;
  title: string;
  subtitle?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
}

export default function AdminCmsPage() {
  const [pages, setPages] = useState<CmsPageItem[]>([]);
  const [banners, setBanners] = useState<HeroBannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PAGES" | "BANNERS">("PAGES");

  // Page Editor Modal
  const [editingPage, setEditingPage] = useState<CmsPageItem | null>(null);
  const [pageTitle, setPageTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [pageContent, setPageContent] = useState("");
  const [pageStatus, setPageStatus] = useState("PUBLISHED");
  const [isSaving, setIsSaving] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchCmsData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [pagesRes, bannersRes] = await Promise.all([
        fetch("/api/v1/admin/cms/pages"),
        fetch("/api/v1/admin/cms/banners"),
      ]);
      const pagesJson = await pagesRes.json();
      const bannersJson = await bannersRes.json();

      if (pagesJson.success) setPages(pagesJson.data);
      if (bannersJson.success) setBanners(bannersJson.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCmsData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCmsData]);

  const handleOpenPageEditor = (page?: CmsPageItem) => {
    if (page) {
      setEditingPage(page);
      setPageTitle(page.title);
      setPageSlug(page.slug);
      setPageContent(page.content);
      setPageStatus(page.status);
    } else {
      setEditingPage({ id: "", slug: "", title: "", content: "", status: "DRAFT", updatedAt: "" });
      setPageTitle("");
      setPageSlug("");
      setPageContent("");
      setPageStatus("PUBLISHED");
    }
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/admin/cms/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: pageSlug.trim().toLowerCase(),
          title: pageTitle.trim(),
          content: pageContent.trim(),
          status: pageStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({ text: "CMS editorial content published.", type: "success" });
        setEditingPage(null);
        fetchCmsData();
      } else {
        setBannerMessage({ text: data.error?.message || "Failed to save page.", type: "error" });
      }
    } catch {
      setBannerMessage({ text: "Network error saving CMS page.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#0B192C]">
            Content Management &amp; Editorial Publishing
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Author brand editorial policies (About, Shipping, Returns, Terms, Privacy) and luxury campaign hero banners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleOpenPageEditor()}
            className="bg-[#226192] text-white hover:bg-[#1a4b73]"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Policy Page
          </Button>
        </div>
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
      <div className="flex items-center gap-2 border-b border-[#EAE6DE] pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("PAGES")}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === "PAGES"
              ? "bg-[#226192] text-white shadow-2xs"
              : "text-slate-600 hover:text-black hover:bg-slate-100"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Editorial Policy Pages ({pages.length})
        </button>
        <button
          onClick={() => setActiveTab("BANNERS")}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === "BANNERS"
              ? "bg-[#226192] text-white shadow-2xs"
              : "text-slate-600 hover:text-black hover:bg-slate-100"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Homepage Hero Banners ({banners.length})
        </button>
      </div>

      {activeTab === "PAGES" ? (
        <div className="bg-white rounded-lg border border-[#EAE6DE] shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#EAE6DE] text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Page Title</th>
                <th className="px-4 py-3">Slug Route</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Modified</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DE]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Loading editorial policy documents...
                  </td>
                </tr>
              ) : (
                pages.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-slate-900">{p.title}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">/{p.slug}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold ${
                        p.status === "PUBLISHED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPageEditor(p)}
                      className="h-7 text-xs border-[#EAE6DE]"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((b) => (
            <div key={b.id} className="bg-white rounded-lg border border-[#EAE6DE] shadow-xs overflow-hidden">
              <div
                className="h-36 bg-cover bg-center"
                style={{ backgroundImage: `url(${b.imageUrl})` }}
              />
              <div className="p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-slate-900">{b.title}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                      b.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {b.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                {b.subtitle && <p className="text-slate-500 text-[11px]">{b.subtitle}</p>}
                <div className="pt-2 flex justify-between items-center text-[11px] text-slate-400 font-mono">
                  <span>CTA: {b.ctaText} ({b.ctaLink})</span>
                  <span>Order: #{b.sortOrder}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Page Editor Modal */}
      {editingPage && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-[#EAE6DE] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE6DE] pb-3">
              <h2 className="text-base font-serif font-bold text-[#0B192C]">
                {editingPage.id ? "Edit Editorial Policy" : "New Editorial Policy"}
              </h2>
              <button onClick={() => setEditingPage(null)} className="text-slate-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePage} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Page Title *
                </label>
                <input
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  URL Route Slug *
                </label>
                <input
                  type="text"
                  value={pageSlug}
                  onChange={(e) => setPageSlug(e.target.value)}
                  required
                  placeholder="e.g. shipping-policy"
                  className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE] font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Content (Markdown / HTML) *
                </label>
                <textarea
                  rows={6}
                  value={pageContent}
                  onChange={(e) => setPageContent(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Publication Status
                </label>
                <select
                  value={pageStatus}
                  onChange={(e) => setPageStatus(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                >
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#EAE6DE] flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPage(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="bg-[#226192] text-white"
                >
                  {isSaving ? "Saving..." : "Publish Content"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
