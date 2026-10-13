import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import { WishlistProvider } from "@/context/wishlist-context";
import { ToastProvider } from "@/context/toast-context";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LEZIVA | Luxury Indian Ethnic Wear & Contemporary Fashion Atelier",
    template: "%s | LEZIVA",
  },
  description:
    "Discover bespoke Banarasi sarees, royal bridal lehengas, contemporary fusion dresses, and handcrafted luxury ethnic wear for women.",
  keywords: [
    "sarees",
    "banarasi silk",
    "kanjivaram saree",
    "bridal lehenga",
    "designer dresses",
    "ethnic wear",
    "leziva",
    "luxury indian fashion",
  ],
  authors: [{ name: "LEZIVA Atelier" }],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "LEZIVA | Luxury Ethnic Wear Atelier",
    description: "Handcrafted pure silk sarees, bespoke bridal lehengas, and contemporary silhouettes.",
    url: "https://leziva.com",
    siteName: "LEZIVA",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FDFBF7] text-[#1A1D20]">
        <ToastProvider>
          <CartProvider>
            <WishlistProvider>
              <AnnouncementBar />
              <Suspense fallback={<div className="h-20 bg-white border-b border-[#E2DDD3]" />}>
                <Header />
              </Suspense>
              <div className="flex-1 flex flex-col">{children}</div>
              <Footer />
            </WishlistProvider>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
