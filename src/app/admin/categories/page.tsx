"use client";

import React, { useState, useEffect } from "react";
import {
  FolderTree,
  Sparkles,
  Sliders,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
}

interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  productCount: number;
}

export default function AdminCategoriesPage() {
  const [activeTab, setActiveTab] = useState<"CATEGORIES" | "COLLECTIONS" | "ATTRIBUTES">("CATEGORIES");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Category Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catImage, setCatImage] = useState("");
  const [catParentId, setCatParentId] = useState("");
  const [catSortOrder, setCatSortOrder] = useState("0");
  const [catIsActive, setCatIsActive] = useState(true);

  // Collection Modal
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [colName, setColName] = useState("");
  const [colSlug, setColSlug] = useState("");
  const [colDesc, setColDesc] = useState("");
  const [colImage, setColImage] = useState("");
  const [colIsFeatured, setColIsFeatured] = useState(false);
  const [colSortOrder, setColSortOrder] = useState("0");
  const [colIsActive, setColIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [catsRes, colsRes] = await Promise.all([
        fetch("/api/v1/admin/categories"),
        fetch("/api/v1/admin/collections"),
      ]);
      const catsJson = await catsRes.json();
      const colsJson = await colsRes.json();

      if (catsJson.success) setCategories(catsJson.data);
      if (colsJson.success) setCollections(colsJson.data);
    } catch {
      // error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Open Category Modal
  const handleOpenCategoryModal = (cat?: CategoryItem) => {
    if (cat) {
      setEditingCatId(cat.id);
      setCatName(cat.name);
      setCatSlug(cat.slug);
      setCatDesc(cat.description || "");
      setCatImage(cat.imageUrl || "");
      setCatParentId(cat.parentId || "");
      setCatSortOrder(String(cat.sortOrder));
      setCatIsActive(cat.isActive);
    } else {
      setEditingCatId(null);
      setCatName("");
      setCatSlug("");
      setCatDesc("");
      setCatImage("");
      setCatParentId("");
      setCatSortOrder("0");
      setCatIsActive(true);
    }
    setIsCatModalOpen(true);
  };

  // Open Collection Modal
  const handleOpenCollectionModal = (col?: CollectionItem) => {
    if (col) {
      setEditingColId(col.id);
      setColName(col.name);
      setColSlug(col.slug);
      setColDesc(col.description || "");
      setColImage(col.imageUrl || "");
      setColIsFeatured(col.isFeatured);
      setColSortOrder(String(col.sortOrder));
      setColIsActive(col.isActive);
    } else {
      setEditingColId(null);
      setColName("");
      setColSlug("");
      setColDesc("");
      setColImage("");
      setColIsFeatured(false);
      setColSortOrder("0");
      setColIsActive(true);
    }
    setIsColModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setBannerMessage(null);

    const payload = {
      name: catName.trim(),
      slug: catSlug.trim() || undefined,
      description: catDesc.trim() || undefined,
      imageUrl: catImage.trim() || undefined,
      parentId: catParentId.trim() || null,
      sortOrder: parseInt(catSortOrder) || 0,
      isActive: catIsActive,
    };

    try {
      const url = editingCatId
        ? `/api/v1/admin/categories/${editingCatId}`
        : "/api/v1/admin/categories";
      const method = editingCatId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({
          text: `Category ${payload.name} saved successfully.`,
          type: "success",
        });
        setIsCatModalOpen(false);
        fetchData();
      } else {
        setBannerMessage({
          text: data.error?.message || "Failed to save category.",
          type: "error",
        });
      }
    } catch {
      setBannerMessage({ text: "Network error saving category.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat: CategoryItem) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    try {
      const res = await fetch(`/api/v1/admin/categories/${cat.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({ text: `Category "${cat.name}" deleted.`, type: "success" });
        fetchData();
      } else {
        setBannerMessage({ text: data.error?.message || "Failed to delete category.", type: "error" });
      }
    } catch {
      setBannerMessage({ text: "Network error deleting category.", type: "error" });
    }
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setBannerMessage(null);

    const payload = {
      name: colName.trim(),
      slug: colSlug.trim() || undefined,
      description: colDesc.trim() || undefined,
      imageUrl: colImage.trim() || undefined,
      isFeatured: colIsFeatured,
      sortOrder: parseInt(colSortOrder) || 0,
      isActive: colIsActive,
    };

    try {
      const url = editingColId
        ? `/api/v1/admin/collections/${editingColId}`
        : "/api/v1/admin/collections";
      const method = editingColId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({
          text: `Collection "${payload.name}" saved successfully.`,
          type: "success",
        });
        setIsColModalOpen(false);
        fetchData();
      } else {
        setBannerMessage({
          text: data.error?.message || "Failed to save collection.",
          type: "error",
        });
      }
    } catch {
      setBannerMessage({ text: "Network error saving collection.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCollection = async (col: CollectionItem) => {
    if (!window.confirm(`Are you sure you want to delete collection "${col.name}"?`)) return;

    try {
      const res = await fetch(`/api/v1/admin/collections/${col.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({ text: `Collection "${col.name}" deleted.`, type: "success" });
        fetchData();
      } else {
        setBannerMessage({ text: data.error?.message || "Failed to delete collection.", type: "error" });
      }
    } catch {
      setBannerMessage({ text: "Network error deleting collection.", type: "error" });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#0B192C]">
            Taxonomy &amp; Catalog Governance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage couture categories, luxury seasonal collections, and attribute matrix rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="border-[#EAE6DE]"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {activeTab === "CATEGORIES" && (
            <Button
              size="sm"
              onClick={() => handleOpenCategoryModal()}
              className="bg-[#226192] text-white hover:bg-[#1a4b73]"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Category
            </Button>
          )}

          {activeTab === "COLLECTIONS" && (
            <Button
              size="sm"
              onClick={() => handleOpenCollectionModal()}
              className="bg-[#226192] text-white hover:bg-[#1a4b73]"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Collection
            </Button>
          )}
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
      <div className="flex gap-2 border-b border-[#EAE6DE] pb-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab("CATEGORIES")}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === "CATEGORIES"
              ? "bg-[#0B192C] text-white shadow-2xs"
              : "text-slate-600 hover:text-black hover:bg-slate-100"
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          Couture Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab("COLLECTIONS")}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === "COLLECTIONS"
              ? "bg-[#226192] text-white shadow-2xs"
              : "text-slate-600 hover:text-black hover:bg-slate-100"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Brand Collections ({collections.length})
        </button>
        <button
          onClick={() => setActiveTab("ATTRIBUTES")}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === "ATTRIBUTES"
              ? "bg-[#EF8557] text-white shadow-2xs"
              : "text-slate-600 hover:text-black hover:bg-slate-100"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Attribute Matrix
        </button>
      </div>

      {/* Tab 1: Categories */}
      {activeTab === "CATEGORIES" && (
        <div className="bg-white rounded-lg border border-[#EAE6DE] shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#EAE6DE] text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Category Name</th>
                <th className="px-4 py-3">Slug Route</th>
                <th className="px-4 py-3">Parent Group</th>
                <th className="px-4 py-3">Active Products</th>
                <th className="px-4 py-3">Sort Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DE]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Loading couture categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No categories configured. Click &ldquo;New Category&rdquo; to create one.
                  </td>
                </tr>
              ) : (
                categories.map((c) => {
                  const parentName = categories.find((p) => p.id === c.parentId)?.name;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                        {c.name}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">
                        /{c.slug}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {parentName ? (
                          <span className="px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700 font-mono text-[10px]">
                            {parentName}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Root Category</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {c.productCount} ensemble(s)
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-500">{c.sortOrder}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold ${
                            c.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {c.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenCategoryModal(c)}
                          className="h-7 text-xs border-[#EAE6DE]"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCategory(c)}
                          className="h-7 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Collections */}
      {activeTab === "COLLECTIONS" && (
        <div className="bg-white rounded-lg border border-[#EAE6DE] shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#EAE6DE] text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Collection Name</th>
                <th className="px-4 py-3">Slug Route</th>
                <th className="px-4 py-3">Featured Badge</th>
                <th className="px-4 py-3">Active Products</th>
                <th className="px-4 py-3">Sort Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DE]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Loading luxury collections...
                  </td>
                </tr>
              ) : collections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No collections configured. Click &ldquo;New Collection&rdquo; to create one.
                  </td>
                </tr>
              ) : (
                collections.map((col) => (
                  <tr key={col.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{col.name}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-500 text-[11px]">
                      /{col.slug}
                    </td>
                    <td className="px-4 py-3.5">
                      {col.isFeatured ? (
                        <span className="px-2 py-0.5 rounded-xs bg-[#EF8557]/15 text-[#EF8557] font-bold text-[10px]">
                          FEATURED
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Standard</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {col.productCount} ensemble(s)
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-500">{col.sortOrder}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold ${
                          col.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {col.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenCollectionModal(col)}
                        className="h-7 text-xs border-[#EAE6DE]"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCollection(col)}
                        className="h-7 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Attribute Matrix */}
      {activeTab === "ATTRIBUTES" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sizes */}
          <div className="bg-white rounded-lg border border-[#EAE6DE] p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-serif font-bold text-[#0B192C] flex items-center justify-between">
              <span>Standard Sizing Codes</span>
              <span className="text-xs font-sans text-slate-400 font-normal">8 variants</span>
            </h2>
            <div className="space-y-2 text-xs">
              {[
                { code: "XS", label: "Extra Small (Bust 32\")" },
                { code: "S", label: "Small (Bust 34\")" },
                { code: "M", label: "Medium (Bust 36\")" },
                { code: "L", label: "Large (Bust 38\")" },
                { code: "XL", label: "Extra Large (Bust 40\")" },
                { code: "XXL", label: "Double Extra Large (Bust 42\")" },
                { code: "FREE_SIZE", label: "Free Size (Unstitched / Universal)" },
                { code: "CUSTOM", label: "Bespoke Couture Custom Sizing" },
              ].map((s) => (
                <div key={s.code} className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-100">
                  <span className="font-mono font-bold text-[#226192]">{s.code}</span>
                  <span className="text-slate-600 text-[11px]">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Color Swatches */}
          <div className="bg-white rounded-lg border border-[#EAE6DE] p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-serif font-bold text-[#0B192C] flex items-center justify-between">
              <span>Atelier Color Palette</span>
              <span className="text-xs font-sans text-slate-400 font-normal">8 swatches</span>
            </h2>
            <div className="space-y-2 text-xs">
              {[
                { name: "Crimson Red", hex: "#990000" },
                { name: "Emerald Green", hex: "#004D40" },
                { name: "Royal Navy", hex: "#0B192C" },
                { name: "Ivory Gold", hex: "#D4AF37" },
                { name: "Sunset Coral", hex: "#EF8557" },
                { name: "Midnight Black", hex: "#111111" },
                { name: "Blush Rose", hex: "#E8B4B8" },
                { name: "Peacock Teal", hex: "#005F73" },
              ].map((c) => (
                <div key={c.name} className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.hex }} />
                    <span className="font-semibold text-slate-800">{c.name}</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[10px]">{c.hex}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fabrics */}
          <div className="bg-white rounded-lg border border-[#EAE6DE] p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-serif font-bold text-[#0B192C] flex items-center justify-between">
              <span>Textile &amp; Fabric Catalog</span>
              <span className="text-xs font-sans text-slate-400 font-normal">7 fabrics</span>
            </h2>
            <div className="space-y-2 text-xs">
              {[
                "Pure Kanjeevaram Silk",
                "Banarasi Brocade",
                "Tissue Organza",
                "Micro Velvet",
                "Georgette Chiffon",
                "Raw Matka Silk",
                "Chanderi Cotton-Silk",
              ].map((f) => (
                <div key={f} className="p-2.5 rounded-md bg-slate-50 border border-slate-100 font-medium text-slate-700 flex items-center justify-between">
                  <span>{f}</span>
                  <ExternalLink className="w-3 h-3 text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-[#EAE6DE] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE6DE] pb-3">
              <h2 className="text-base font-serif font-bold text-[#0B192C]">
                {editingCatId ? "Edit Category" : "Create Couture Category"}
              </h2>
              <button onClick={() => setIsCatModalOpen(false)} className="text-slate-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bridal Lehengas"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  URL Route Slug (Leave blank to auto-generate)
                </label>
                <input
                  type="text"
                  placeholder="e.g. bridal-lehengas"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE] font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Parent Category (Optional Subcategory)
                </label>
                <select
                  value={catParentId}
                  onChange={(e) => setCatParentId(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                >
                  <option value="">None (Top-Level Root Category)</option>
                  {categories
                    .filter((c) => c.id !== editingCatId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (/{c.slug})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Editorial Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Luxury category description for storefront header"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={catSortOrder}
                    onChange={(e) => setCatSortOrder(e.target.value)}
                    className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Publication Status
                  </label>
                  <select
                    value={catIsActive ? "ACTIVE" : "INACTIVE"}
                    onChange={(e) => setCatIsActive(e.target.value === "ACTIVE")}
                    className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                  >
                    <option value="ACTIVE">Active (Visible)</option>
                    <option value="INACTIVE">Inactive (Archived)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EAE6DE]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCatModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#226192] text-white hover:bg-[#1a4b73]"
                >
                  {isSubmitting ? "Saving..." : "Save Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collection Modal */}
      {isColModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-[#EAE6DE] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE6DE] pb-3">
              <h2 className="text-base font-serif font-bold text-[#0B192C]">
                {editingColId ? "Edit Collection" : "Create Brand Collection"}
              </h2>
              <button onClick={() => setIsColModalOpen(false)} className="text-slate-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCollection} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Collection Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Festive 2026"
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  URL Route Slug (Leave blank to auto-generate)
                </label>
                <input
                  type="text"
                  placeholder="e.g. royal-festive-2026"
                  value={colSlug}
                  onChange={(e) => setColSlug(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE] font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Editorial Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Luxury campaign curation story"
                  value={colDesc}
                  onChange={(e) => setColDesc(e.target.value)}
                  className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={colSortOrder}
                    onChange={(e) => setColSortOrder(e.target.value)}
                    className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Featured Campaign
                  </label>
                  <select
                    value={colIsFeatured ? "YES" : "NO"}
                    onChange={(e) => setColIsFeatured(e.target.value === "YES")}
                    className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                  >
                    <option value="NO">No (Regular Collection)</option>
                    <option value="YES">Yes (Homepage Banner &amp; Featured)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EAE6DE]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsColModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#226192] text-white hover:bg-[#1a4b73]"
                >
                  {isSubmitting ? "Saving..." : "Save Collection"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
