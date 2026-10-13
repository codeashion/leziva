"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  RefreshCw,
  Download,
  Archive,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  status: string;
  isActive: boolean;
  variants: Array<{
    id: string;
    sku: string;
    size: string;
    colorName: string;
    price: number;
    inventoryQuantity: number;
    lowStockThreshold: number;
  }>;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // New product dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("24990");
  const [newSku, setNewSku] = useState("");
  const [newStock, setNewStock] = useState("15");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk / Import states
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchProducts = React.useCallback(async (p: number, q: string) => {
    setIsLoading(true);
    try {
      const searchParam = q.trim() ? `&search=${encodeURIComponent(q.trim())}` : "";
      const res = await fetch(`/api/v1/admin/products?page=${p}&limit=12${searchParam}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts(data.data.products);
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
      fetchProducts(page, searchQuery);
    }, 0);
    return () => clearTimeout(timer);
  }, [page, searchQuery, fetchProducts]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;
    setIsSubmitting(true);
    setBannerMessage(null);

    try {
      const res = await fetch("/api/v1/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          categoryId: "cat_sarees",
          variants: [
            {
              sku: newSku.trim() || `LZV-${Date.now().toString(36).toUpperCase()}-STD`,
              title: "Atelier Standard Edition",
              size: "FREE_SIZE",
              colorName: "Royal Ivory",
              colorHex: "#EAE6DE",
              price: parseFloat(newPrice) || 24990,
              inventoryQuantity: parseInt(newStock) || 10,
              lowStockThreshold: 5,
            },
          ],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({ text: "Atelier product created successfully.", type: "success" });
        setIsCreateOpen(false);
        setNewTitle("");
        setNewDescription("");
        fetchProducts(page, searchQuery);
      } else {
        setBannerMessage({ text: data.error?.message || "Failed to create product.", type: "error" });
      }
    } catch {
      setBannerMessage({ text: "Network error creating product.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to archive this product from the storefront?")) return;
    try {
      const res = await fetch(`/api/v1/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setBannerMessage({ text: "Product archived.", type: "success" });
        fetchProducts(page, searchQuery);
      }
    } catch {
      // error
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#0B192C]">
            Haute Couture Product Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage luxury garments, size &amp; color variants, pricing, and storefront publication states.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/api/v1/admin/products/export" target="_blank">
            <Button variant="outline" size="sm" className="border-[#EAE6DE]">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#226192] text-white hover:bg-[#1a4b73]"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Product
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

      {/* Search and Filter */}
      <div className="p-4 rounded-lg bg-white border border-[#EAE6DE] shadow-xs flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product title or SKU..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-md border border-[#EAE6DE] focus:outline-hidden focus:border-[#226192]"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchProducts(page, searchQuery)}
          disabled={isLoading}
          className="border-[#EAE6DE]"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-[#EAE6DE] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#EAE6DE] text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Garment Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Primary SKU</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Total Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DE]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#226192]" />
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const primaryVariant = prod.variants?.[0];
                  const totalStock = prod.variants?.reduce(
                    (sum, v) => sum + (v.inventoryQuantity || 0),
                    0
                  ) || 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        <div>{prod.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">/{prod.slug}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                        {prod.categoryId.replace("cat_", "")}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700">
                        {primaryVariant?.sku || "LZV-VAR"}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        ₹{(primaryVariant?.price || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-semibold ${
                            totalStock === 0
                              ? "text-rose-600 font-bold"
                              : totalStock <= 5
                              ? "text-amber-600 font-bold"
                              : "text-emerald-700"
                          }`}
                        >
                          {totalStock} units
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold ${
                            prod.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : prod.status === "ARCHIVED"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {prod.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1">
                        <Link href={`/product/${prod.slug}`} target="_blank">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            Store View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleArchive(prod.id)}
                          className="h-7 px-2 text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[#EAE6DE] flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong>{products.length}</strong> of <strong>{totalCount}</strong> garments
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

      {/* New Product Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl border border-[#EAE6DE] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE6DE] pb-3">
              <h2 className="text-lg font-serif font-bold text-[#0B192C]">
                Craft New Atelier Product
              </h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Banarasi Silk Zari Saree"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  placeholder="Artisanal handloom specifications, weaving heritage..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Price (INR) *
                  </label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Initial Stock *
                  </label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    placeholder="LZV-SR-01"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full p-2 bg-slate-50 rounded-md border border-[#EAE6DE]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#EAE6DE] flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-[#226192] text-white"
                >
                  {isSubmitting ? "Crafting..." : "Create Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
