"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { Product, Order, Coupon } from "@/types";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  Tag,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Edit,
  Trash2,
  ExternalLink,
  X,
} from "lucide-react";

export default function AdminDashboardPage() {
  const {
    brandConfig,
    updateBrandConfig,
    products,
    addProduct,
    deleteProduct,
    orders,
    updateOrderStatus,
    appliedCoupon,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "products" | "coupons" | "settings"
  >("overview");

  // Chart time range
  const [chartRange, setChartRange] = useState<"7D" | "30D" | "3M" | "1Y">("30D");

  // Orders filter & inspect
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Products filter & Add Product Modal
  const [productSearch, setProductSearch] = useState("");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: "",
    tagline: "Handcrafted Luxury",
    category: "sarees" as const,
    price: 3499,
    originalPrice: 4499,
    fabric: "Silk",
    occasion: "Festive",
    colorName: "Royal Gold",
    colorHex: "#D4AF37",
    sizes: "Free Size",
    images: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    description: "Pure handcrafted heirloom saree with intricate zari work.",
    stockCount: 10,
  });

  // Settings form state
  const [settingsBrandName, setSettingsBrandName] = useState(brandConfig.name);
  const [settingsAnnouncement, setSettingsAnnouncement] = useState(brandConfig.announcement);
  const [settingsThreshold, setSettingsThreshold] = useState(brandConfig.freeShippingThreshold);

  // New Coupon modal state
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponValue, setNewCouponValue] = useState(15);
  const [newCouponMin, setNewCouponMin] = useState(1999);

  // KPI Calculations
  const totalSalesRevenue = orders.reduce((sum, o) => sum + o.total, 1246920);
  const totalOrdersCount = orders.length + 1244;
  const totalCustomersCount = 892;
  const totalProductsCount = products.length;

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer.fullName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.orderStatus.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.categoryDisplayName.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.fabric.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.price) {
      showToast("Please enter product name and price", "error");
      return;
    }

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      slug: newProductForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: newProductForm.name,
      tagline: newProductForm.tagline,
      category: newProductForm.category,
      categoryDisplayName: newProductForm.category.toUpperCase(),
      price: Number(newProductForm.price),
      originalPrice: Number(newProductForm.originalPrice),
      discountPercentage: Math.round(
        ((newProductForm.originalPrice - newProductForm.price) / newProductForm.originalPrice) * 100
      ),
      rating: 4.8,
      reviewCount: 1,
      images: [newProductForm.images],
      primaryColor: newProductForm.colorName,
      colorName: newProductForm.colorName,
      colorHex: newProductForm.colorHex,
      availableColors: [{ name: newProductForm.colorName, hex: newProductForm.colorHex }],
      sizes: newProductForm.sizes.split(",").map((s) => s.trim()),
      fabric: newProductForm.fabric,
      occasion: newProductForm.occasion,
      description: newProductForm.description,
      details: ["Handcrafted Indian luxury creation", "Artisanal quality assurance"],
      careInstructions: ["Dry clean only"],
      shippingInfo: "Dispatched within 24-48 business hours.",
      inStock: true,
      stockCount: Number(newProductForm.stockCount),
      featured: true,
      isNewArrival: true,
      sku: `PROD-${Math.floor(100 + Math.random() * 900)}`,
    };

    addProduct(newProd);
    setIsAddProductOpen(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateBrandConfig({
      name: settingsBrandName,
      announcementText: settingsAnnouncement,
      freeShippingThreshold: Number(settingsThreshold),
    });
  };

  return (
    <div className="min-h-screen bg-[#0C1E28] text-white flex flex-col md:flex-row">
      {/* Dark Navy Sidebar matching Screen 05 in Reference Image */}
      <aside className="w-full md:w-64 bg-[#102B3A] border-r border-[#226192]/30 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Crest / Title */}
          <div className="p-6 border-b border-[#226192]/30 flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-2xl font-serif font-bold tracking-[0.2em] uppercase text-white hover:text-[#EF8557] transition-colors"
              >
                {brandConfig.name}
              </Link>
              <p className="text-[10px] text-[#EF8557] uppercase tracking-widest mt-0.5 font-semibold">
                Admin Atelier Portal
              </p>
            </div>
            <Link
              href="/"
              title="View Public Storefront"
              className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === "overview"
                  ? "bg-[#EF8557] text-white shadow-lg shadow-[#EF8557]/20"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeTab === "orders"
                  ? "bg-[#EF8557] text-white shadow-lg shadow-[#EF8557]/20"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span>Orders</span>
              </div>
              <span className="text-[10px] bg-[#102B3A] border border-[#226192]/40 text-[#EF8557] font-bold px-2 py-0.5 rounded-full">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("products")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeTab === "products"
                  ? "bg-[#EF8557] text-white shadow-lg shadow-[#EF8557]/20"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4" />
                <span>Products Catalog</span>
              </div>
              <span className="text-[10px] bg-white/10 text-white/80 px-2 py-0.5 rounded-full">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("coupons")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === "coupons"
                  ? "bg-[#EF8557] text-white shadow-lg shadow-[#EF8557]/20"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Coupons & Promotions</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === "settings"
                  ? "bg-[#EF8557] text-white shadow-lg shadow-[#EF8557]/20"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Brand Configuration</span>
            </button>
          </nav>
        </div>

        {/* Admin Profile at Sidebar Bottom */}
        <div className="p-4 border-t border-[#226192]/30 flex items-center justify-between bg-[#0C1E28]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#EF8557] text-white font-bold flex items-center justify-center text-xs shadow-md">
              AD
            </div>
            <div>
              <p className="text-xs font-bold text-white">Atelier Admin</p>
              <p className="text-[10px] text-[#EF8557]">Super Administrator</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-[11px] text-white/50 hover:text-white underline"
          >
            Storefront
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#226192]/30">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white capitalize">
              {activeTab === "overview" && "Executive Dashboard"}
              {activeTab === "orders" && "Order Management"}
              {activeTab === "products" && "Product Catalog & Inventory"}
              {activeTab === "coupons" && "Coupons & Discounts"}
              {activeTab === "settings" && "Brand & Store Settings"}
            </h1>
            <p className="text-xs text-white/60 mt-1">
              Real-time Indian e-commerce analytics, catalog synchronization, and order fulfillment.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "overview" && (
              <div className="flex items-center bg-[#102B3A] p-1 rounded-lg border border-[#226192]/30 text-xs">
                {(["7D", "30D", "3M", "1Y"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                      chartRange === r ? "bg-[#EF8557] text-white" : "text-white/60 hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            {activeTab === "products" && (
              <button
                onClick={() => setIsAddProductOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#EF8557] hover:bg-[#DF7446] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: OVERVIEW & SALES ANALYTICS (matching Screen 05) */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* 4 KPI Cards matching UI Reference 05 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Total Sales */}
              <div className="bg-[#102B3A] p-6 rounded-2xl border border-[#226192]/40 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Total Sales</span>
                  <span className="text-green-400 font-bold flex items-center gap-0.5">
                    +14.2% <TrendingUp className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="font-serif text-2xl sm:text-3xl font-bold text-white mt-2">
                  ₹{totalSalesRevenue.toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-white/40 mt-1">vs previous 30 days period</p>
              </div>

              {/* Total Orders */}
              <div className="bg-[#102B3A] p-6 rounded-2xl border border-[#226192]/40 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Total Orders</span>
                  <span className="text-green-400 font-bold flex items-center gap-0.5">
                    +8.5% <TrendingUp className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="font-serif text-2xl sm:text-3xl font-bold text-white mt-2">
                  {totalOrdersCount.toLocaleString()}
                </p>
                <p className="text-[10px] text-white/40 mt-1">98.4% fulfillment rate</p>
              </div>

              {/* Customers */}
              <div className="bg-[#102B3A] p-6 rounded-2xl border border-[#226192]/40 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Customers</span>
                  <span className="text-green-400 font-bold flex items-center gap-0.5">
                    +12% <TrendingUp className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="font-serif text-2xl sm:text-3xl font-bold text-white mt-2">
                  {totalCustomersCount}
                </p>
                <p className="text-[10px] text-white/40 mt-1">Across 28 Indian states</p>
              </div>

              {/* Active Products */}
              <div className="bg-[#102B3A] p-6 rounded-2xl border border-[#226192]/40 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Active SKUs</span>
                  <span className="text-[#EF8557] font-bold">In Stock</span>
                </div>
                <p className="font-serif text-2xl sm:text-3xl font-bold text-white mt-2">
                  {totalProductsCount}
                </p>
                <p className="text-[10px] text-white/40 mt-1">Handloom & couture items</p>
              </div>
            </div>

            {/* Sales Chart Section matching Screen 05 */}
            <div className="bg-[#102B3A] p-6 sm:p-8 rounded-2xl border border-[#226192]/40 shadow-lg space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">Sales Overview Trend</h3>
                  <p className="text-xs text-white/60">Revenue trajectory over {chartRange}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#EF8557]" />
                  <span className="text-xs text-white/80 font-medium">Revenue (₹ INR)</span>
                </div>
              </div>

              {/* Vector SVG Trendline matching Screen 05 aesthetic */}
              <div className="h-64 w-full relative pt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF8557" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#EF8557" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  <line x1="0" y1="30" x2="800" y2="30" stroke="#226192" strokeOpacity="0.2" />
                  <line x1="0" y1="90" x2="800" y2="90" stroke="#226192" strokeOpacity="0.2" />
                  <line x1="0" y1="150" x2="800" y2="150" stroke="#226192" strokeOpacity="0.2" />

                  {/* Filled Area */}
                  <path
                    d="M 0,160 Q 150,110 250,130 T 450,70 T 650,50 T 800,40 L 800,200 L 0,200 Z"
                    fill="url(#chartGradient)"
                  />

                  {/* Stroke Line */}
                  <path
                    d="M 0,160 Q 150,110 250,130 T 450,70 T 650,50 T 800,40"
                    fill="none"
                    stroke="#EF8557"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Milestone Pulse Nodes */}
                  <circle cx="250" cy="130" r="5" fill="#EF8557" stroke="#102B3A" strokeWidth="2" />
                  <circle cx="450" cy="70" r="5" fill="#EF8557" stroke="#102B3A" strokeWidth="2" />
                  <circle cx="650" cy="50" r="5" fill="#EF8557" stroke="#102B3A" strokeWidth="2" />
                  <circle cx="800" cy="40" r="5" fill="#EF8557" stroke="#102B3A" strokeWidth="2" />
                </svg>

                {/* X-axis labels */}
                <div className="flex justify-between text-[11px] text-white/40 pt-3">
                  <span>Oct 01</span>
                  <span>Oct 07</span>
                  <span>Oct 14</span>
                  <span>Oct 21</span>
                  <span>Today</span>
                </div>
              </div>
            </div>

            {/* Recent Orders Snapshot Table */}
            <div className="bg-[#102B3A] rounded-2xl border border-[#226192]/40 shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#226192]/30">
                <h3 className="font-serif text-lg font-bold text-white">Recent Orders</h3>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-xs text-[#EF8557] font-semibold hover:underline"
                >
                  View All Orders →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-white/60 border-b border-[#226192]/30">
                    <tr>
                      <th className="py-2.5 px-3">Order #</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#226192]/20">
                    {orders.slice(0, 5).map((ord) => (
                      <tr key={ord.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3 font-bold text-[#EF8557]">{ord.orderNumber}</td>
                        <td className="py-3 px-3">
                          <p className="font-medium text-white">{ord.customer.fullName}</p>
                          <p className="text-[10px] text-white/50">{ord.customer.city}</p>
                        </td>
                        <td className="py-3 px-3 font-serif font-bold text-white">
                          ₹{ord.total.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3">
                          <span className="capitalize text-white/70">{ord.paymentMethod}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.orderStatus === "Delivered"
                                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                : ord.orderStatus === "Shipped"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {ord.orderStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="p-1.5 text-white/70 hover:text-white rounded hover:bg-white/10"
                            title="Inspect Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-white/50 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by order #, customer name, status..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#102B3A] border border-[#226192]/40 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#EF8557]"
                />
              </div>
              <span className="text-xs text-white/60">
                Total Orders in System: <strong>{orders.length}</strong>
              </span>
            </div>

            {/* Orders Table */}
            <div className="bg-[#102B3A] rounded-2xl border border-[#226192]/40 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-white/60 bg-[#0C1E28]/60 border-b border-[#226192]/30">
                    <tr>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Tracking</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#226192]/20">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#EF8557]">{ord.orderNumber}</td>
                        <td className="py-3 px-4 text-white/60">{ord.createdAt}</td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-white">{ord.customer.fullName}</p>
                          <p className="text-[10px] text-white/50">{ord.customer.phone}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span>{ord.items.length} garments</span>
                        </td>
                        <td className="py-3 px-4 font-serif font-bold text-white">
                          ₹{ord.total.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={ord.orderStatus}
                            onChange={(e) =>
                              updateOrderStatus(
                                ord.id,
                                e.target.value as Order["orderStatus"]
                              )
                            }
                            className="bg-[#0C1E28] border border-[#226192]/40 text-[11px] rounded px-2 py-1 text-white focus:outline-none"
                          >
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-white/60">
                          {ord.trackingNumber || "Pending"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="px-3 py-1 bg-white/10 hover:bg-[#EF8557] hover:text-white rounded text-[11px] font-semibold transition-colors"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTS CATALOG MANAGEMENT */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-white/50 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search products by title, fabric, category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#102B3A] border border-[#226192]/40 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#EF8557]"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-white/60">Catalog:</span>
                <strong>{products.length} Products Live</strong>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-[#102B3A] rounded-2xl border border-[#226192]/40 overflow-hidden shadow-lg flex flex-col justify-between"
                >
                  <div className="relative aspect-[4/3] bg-[#0C1E28]">
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-[#102B3A]/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                      {prod.categoryDisplayName}
                    </div>
                    <div className="absolute top-3 right-3 bg-[#EF8557] text-white px-2 py-0.5 rounded text-[10px] font-bold">
                      SKU: {prod.sku}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h4 className="font-serif text-base font-bold text-white">{prod.name}</h4>
                      <p className="text-xs text-white/60">Fabric: {prod.fabric} • {prod.colorName}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#226192]/30">
                      <div>
                        <p className="text-[10px] text-white/50">Price</p>
                        <p className="font-serif text-base font-bold text-white">
                          ₹{prod.price.toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-white/50">Stock</p>
                        <p className="text-xs font-bold text-green-400">{prod.stockCount} in stock</p>
                      </div>

                      <button
                        onClick={() => deleteProduct(prod.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: COUPONS & PROMOTIONS */}
        {activeTab === "coupons" && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Active Promotional Codes</h3>
                <p className="text-xs text-white/60">Manage promotional discounts applied at cart checkout.</p>
              </div>
              <button
                onClick={() => setIsAddCouponOpen(true)}
                className="px-4 py-2 bg-[#EF8557] hover:bg-[#DF7446] text-white text-xs font-bold uppercase rounded-lg"
              >
                + Create Coupon
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-[#102B3A] p-5 rounded-2xl border border-[#226192]/40 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#EF8557] font-mono text-base">FESTIVE15</span>
                  <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded">Active</span>
                </div>
                <p className="text-xs text-white/70">15% off on all festive orders</p>
                <p className="text-[10px] text-white/40">Min. order ₹1,999</p>
              </div>

              <div className="bg-[#102B3A] p-5 rounded-2xl border border-[#226192]/40 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#EF8557] font-mono text-base">WELCOME10</span>
                  <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded">Active</span>
                </div>
                <p className="text-xs text-white/70">10% off for first-time royal connoisseurs</p>
                <p className="text-[10px] text-white/40">Min. order ₹999</p>
              </div>

              <div className="bg-[#102B3A] p-5 rounded-2xl border border-[#226192]/40 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#EF8557] font-mono text-base">ROYAL500</span>
                  <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded">Active</span>
                </div>
                <p className="text-xs text-white/70">Flat ₹500 discount on cart</p>
                <p className="text-[10px] text-white/40">Min. order ₹3,999</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BRAND & STORE SETTINGS */}
        {activeTab === "settings" && (
          <div className="max-w-2xl bg-[#102B3A] p-6 sm:p-8 rounded-2xl border border-[#226192]/40 shadow-lg space-y-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-white">Store Identity & Configuration</h3>
              <p className="text-xs text-white/60 mt-1">
                Configure brand name placeholder, announcement text, and shipping threshold across the entire application.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white block mb-1">
                  Brand Name (Configurable Placeholder)
                </label>
                <input
                  type="text"
                  value={settingsBrandName}
                  onChange={(e) => setSettingsBrandName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0C1E28] border border-[#226192]/40 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#EF8557]"
                />
                <p className="text-[10px] text-white/50 mt-1">
                  Changing this instantly updates the navbar logo, footer, invoices, and meta tags.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-white block mb-1">
                  Announcement Bar Marquee Text
                </label>
                <input
                  type="text"
                  value={settingsAnnouncement}
                  onChange={(e) => setSettingsAnnouncement(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0C1E28] border border-[#226192]/40 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#EF8557]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white block mb-1">
                  Free Express Shipping Threshold (₹ INR)
                </label>
                <input
                  type="number"
                  value={settingsThreshold}
                  onChange={(e) => setSettingsThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-[#0C1E28] border border-[#226192]/40 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#EF8557]"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#EF8557] hover:bg-[#DF7446] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md"
                >
                  Save Store Settings
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Inspect Order Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#102B3A] p-6 sm:p-8 rounded-2xl border border-[#226192] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#226192]/40">
              <h3 className="font-serif text-lg font-bold text-white">
                Order Details {selectedOrder.orderNumber}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-white/60">Customer Name</p>
                <p className="font-bold text-white">{selectedOrder.customer.fullName}</p>
                <p className="text-white/60">{selectedOrder.customer.phone}</p>
              </div>
              <div>
                <p className="text-white/60">Delivery Address</p>
                <p className="text-white">
                  {selectedOrder.customer.addressLine1}, {selectedOrder.customer.city}, {selectedOrder.customer.state} - {selectedOrder.customer.pincode}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-white mb-2">Ordered Garments</p>
              <div className="space-y-2">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="p-3 bg-[#0C1E28] rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img src={it.productImage} alt={it.productName} className="w-10 h-12 object-cover rounded" />
                      <div>
                        <p className="font-bold text-white">{it.productName}</p>
                        <p className="text-white/60">Color: {it.color} • Size: {it.size} • Qty: {it.quantity}</p>
                      </div>
                    </div>
                    <span className="font-serif font-bold text-[#EF8557]">
                      ₹{(it.price * it.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#226192]/40 flex justify-between items-center text-xs">
              <div>
                <span className="text-white/60">Payment: </span>
                <span className="font-bold uppercase text-green-400">{selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})</span>
              </div>
              <div className="text-right">
                <span className="text-white/60">Total: </span>
                <span className="font-serif font-bold text-base text-white">
                  ₹{selectedOrder.total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsAddProductOpen(false)}
        >
          <div
            className="relative w-full max-w-xl bg-[#102B3A] p-6 sm:p-8 rounded-2xl border border-[#226192] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#226192]/40">
              <h3 className="font-serif text-lg font-bold text-white">Add New Couture Garment</h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="p-1 text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-white block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pure Tissue Silk Saree"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0C1E28] border border-[#226192]/40 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#EF8557]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-white block mb-1">Category</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) =>
                      setNewProductForm({
                        ...newProductForm,
                        category: e.target.value as typeof newProductForm.category,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#0C1E28] border border-[#226192]/40 rounded-lg text-white"
                  >
                    <option value="sarees">Sarees</option>
                    <option value="lehengas">Lehengas</option>
                    <option value="kurtas">Kurtas</option>
                    <option value="mens">Men&apos;s Wear</option>
                    <option value="kids">Kids&apos; Wear</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-white block mb-1">Fabric</label>
                  <input
                    type="text"
                    value={newProductForm.fabric}
                    onChange={(e) => setNewProductForm({ ...newProductForm, fabric: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0C1E28] border border-[#226192]/40 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-white block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0C1E28] border border-[#226192]/40 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-white block mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={newProductForm.originalPrice}
                    onChange={(e) => setNewProductForm({ ...newProductForm, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0C1E28] border border-[#226192]/40 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-white block mb-1">Image URL</label>
                <input
                  type="url"
                  value={newProductForm.images}
                  onChange={(e) => setNewProductForm({ ...newProductForm, images: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0C1E28] border border-[#226192]/40 rounded-lg text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 border border-white/20 rounded-lg text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#EF8557] hover:bg-[#DF7446] text-white font-bold uppercase rounded-lg"
                >
                  Publish Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
