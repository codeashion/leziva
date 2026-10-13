"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Truck,
  Users,
  TicketPercent,
  FileText,
  LifeBuoy,
  BarChart3,
  ShieldCheck,
  Menu,
  X,
  ExternalLink,
  Crown,
  FolderTree,
  Star,
  Bell,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories & Taxa", href: "/admin/categories", icon: FolderTree },
  { label: "Inventory", href: "/admin/inventory", icon: Layers },
  { label: "Shipments", href: "/admin/shipments", icon: Truck },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Coupons", href: "/admin/coupons", icon: TicketPercent },
  { label: "CMS & Content", href: "/admin/cms", icon: FileText },
  { label: "Reviews Moderation", href: "/admin/reviews", icon: Star },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Support Inbox", href: "/admin/support", icon: LifeBuoy },
  { label: "Reports & Export", href: "/admin/reports", icon: BarChart3 },
  { label: "Audit & Security", href: "/admin/audit", icon: ShieldCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] flex">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Luxury Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-72 bg-[#0B192C] text-white flex flex-col z-50 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } border-r border-[#1E293B] shrink-0`}
      >
        {/* Atelier Brand Crest Header */}
        <div className="p-6 border-b border-[#1E293B]/80 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-[#EF8557] flex items-center justify-center text-white shadow-md">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-serif text-lg tracking-[0.25em] text-[#EAE6DE] uppercase font-bold block">
                LEZIVA
              </span>
              <span className="text-[10px] tracking-[0.2em] text-[#EF8557] uppercase font-semibold block">
                Atelier Governance
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/60 hover:text-white"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Role Badge */}
        <div className="px-6 py-3 bg-[#11243D] border-b border-[#1E293B]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-[#EAE6DE]">Super Admin Session</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm bg-[#226192]/60 text-white font-semibold">
            All Access
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#226192] text-white shadow-sm font-semibold"
                    : "text-[#EAE6DE]/75 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-[#EF8557]" : "text-[#EAE6DE]/60"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-[#EF8557] text-white font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#1E293B]/80 bg-[#0B192C]">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-md text-xs text-[#EAE6DE]/80 hover:bg-white/5 hover:text-white transition-colors"
          >
            <span>Visit Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#EF8557]" />
          </Link>
          <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-[#EAE6DE]/40 text-center">
            LEZIVA Atelier OS • Phase 6
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-[#EAE6DE] px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-700 hover:text-black rounded-md hover:bg-slate-100"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block text-xs text-slate-500 font-medium">
              Surat Haute Couture Atelier Dispatch Hub &bull; Live Telemetry
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#226192]/10 text-[#226192]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#226192]" />
              Production RBAC Active
            </span>
            <Link
              href="/account"
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-[#226192]"
            >
              <div className="w-7 h-7 rounded-full bg-[#226192] text-white flex items-center justify-center font-bold text-xs">
                A
              </div>
              <span className="hidden md:inline">Admin</span>
            </Link>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
