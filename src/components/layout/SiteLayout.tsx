"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { AnnouncementBar } from "./AnnouncementBar";
import { SiteHeader } from "./SiteHeader";
import { MobileNavigation } from "./MobileNavigation";
import { SiteFooter } from "./SiteFooter";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { QuickViewModal } from "@/components/products/QuickViewModal";
import { ToastNotification } from "@/components/ui/ToastNotification";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // If in admin dashboard, render custom admin shell without storefront chrome
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[#0C1E28] text-[#F8F5EF] flex flex-col">
        {children}
        <ToastNotification />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#EAE6DE]">
      <AnnouncementBar />
      <SiteHeader onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />

      {/* Global Overlays */}
      <CartDrawer />
      <QuickViewModal />
      <ToastNotification />
    </div>
  );
}
