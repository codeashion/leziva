import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { SiteLayout } from "@/components/layout/SiteLayout";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BRAND | Luxury Indian Fashion & Heritage Couture",
  description: "Bespoke Indian luxury fashion, handwoven Banarasi & Kanjivaram sarees, regal lehengas, silk sherwanis, and artisanal bridal couture.",
  keywords: ["Indian Luxury Fashion", "Banarasi Saree", "Bridal Lehenga", "Designer Kurta Set", "Silk Handloom", "Heritage Couture India"],
  openGraph: {
    title: "BRAND | Luxury Indian Fashion & Heritage Couture",
    description: "Crafted for Every You. Discover timeless heritage weaves, hand-embroidered silks, and modern bridal fashion.",
    type: "website",
    locale: "en_IN",
  },
};

import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#EAE6DE] text-[#171717]">
        <StoreProvider>
          <Suspense fallback={<div className="min-h-screen bg-[#EAE6DE]" />}>
            <SiteLayout>{children}</SiteLayout>
          </Suspense>
        </StoreProvider>
      </body>
    </html>
  );
}
