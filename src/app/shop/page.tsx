import React, { Suspense } from "react";
import Link from "next/link";
import { Metadata } from "next";
import { catalogService } from "@/server/services/catalog.service";
import { ShopContent } from "@/components/catalog/shop-content";
import { ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Shop All Collections",
  description:
    "Explore the complete LEZIVA atelier catalog: Handcrafted pure silk sarees, bespoke bridal lehengas, contemporary dresses, and ethnic sets.",
};

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    sort?: "recommended" | "newest" | "price_asc" | "price_desc";
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
}

async function ShopPageLoader({ searchParams }: { searchParams: Promise<Awaited<ShopPageProps["searchParams"]>> }) {
  const params = await searchParams;
  const category = params.category;
  const sort = params.sort || "recommended";
  const search = params.q;
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const [categories, result] = await Promise.all([
    catalogService.getCategories(),
    catalogService.searchProducts({
      category,
      sort,
      search,
      minPrice,
      maxPrice,
      page,
      limit: 16,
    }),
  ]);

  const activeCategory = category
    ? categories.find((c) => c.slug === category)
    : null;

  return (
    <>
      {/* Page Heading & Editorial Introduction */}
      <div className="space-y-2 border-b border-[#E2DDD3] pb-6">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1D20] font-normal">
          {activeCategory ? activeCategory.name : "The Complete Atelier Catalog"}
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6065] max-w-2xl leading-relaxed">
          {activeCategory?.description ||
            "Every silhouette is designed with reverence for Indian heritage textiles. Handwoven mulberry silks, pure tissue zari, and contemporary cuts crafted for timeless celebrations."}
        </p>
      </div>

      <ShopContent
        initialProducts={result.products}
        categories={categories}
        total={result.total}
        initialCategory={category}
        initialSort={sort}
        initialSearch={search}
      />
    </>
  );
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-[#5A6065]">
        <Link href="/" className="hover:text-[#226192] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#DDD7CB]" />
        <span className="text-[#1A1D20] font-semibold">Shop All</span>
      </nav>

      <Suspense fallback={<div className="py-12 text-center text-xs text-[#5A6065]">Loading atelier catalog...</div>}>
        <ShopPageLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
