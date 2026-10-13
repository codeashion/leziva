import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { productRepository } from "@/server/repositories/product.repository";
import { ShopContent } from "@/components/catalog/shop-content";
import { ChevronRight } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    sort?: "recommended" | "newest" | "price_asc" | "price_desc";
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export async function generateStaticParams() {
  const categories = await productRepository.getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await productRepository.getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: `${category.name} | LEZIVA Atelier`,
    description:
      category.description ||
      `Explore luxury handcrafted ${category.name} at LEZIVA. Certified pure silk and bespoke couture.`,
  };
}

async function CategoryPageLoader({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: Promise<{
    sort?: "recommended" | "newest" | "price_asc" | "price_desc";
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const query = await searchParams;

  const [category, categories] = await Promise.all([
    productRepository.getCategoryBySlug(slug),
    productRepository.getCategories(),
  ]);

  if (!category) {
    notFound();
  }

  const result = await productRepository.findProducts({
    category: slug,
    sort: query.sort || "recommended",
    minPrice: query.minPrice ? Number(query.minPrice) : undefined,
    maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
    limit: 16,
  });

  return (
    <>
      {/* Category Hero Title */}
      <div className="space-y-2 border-b border-[#E2DDD3] pb-6">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1D20] font-normal">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-xs sm:text-sm text-[#5A6065] max-w-2xl leading-relaxed">
            {category.description}
          </p>
        )}
      </div>

      <ShopContent
        initialProducts={result.products}
        categories={categories}
        total={result.total}
        initialCategory={slug}
        initialSort={query.sort || "recommended"}
      />
    </>
  );
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-[#5A6065]">
        <Link href="/" className="hover:text-[#226192] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#DDD7CB]" />
        <Link href="/shop" className="hover:text-[#226192] transition-colors">
          Shop
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#DDD7CB]" />
        <span className="text-[#1A1D20] font-semibold capitalize">{slug.replace("-", " ")}</span>
      </nav>

      <Suspense fallback={<div className="py-12 text-center text-xs text-[#5A6065]">Loading atelier category...</div>}>
        <CategoryPageLoader slug={slug} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
