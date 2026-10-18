import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { catalogService } from "@/server/services/catalog.service";
import { ProductDetailContent } from "@/components/catalog/product-detail-content";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await catalogService.getProductBySlug(slug);
  const product = detail?.product;

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const primaryImage = product.images[0]?.url || "/images/catalog/cat_sarees.jpg";

  return {
    title: product.title,
    description: product.description.substring(0, 160),
    openGraph: {
      title: `${product.title} | LEZIVA Atelier`,
      description: product.description.substring(0, 160),
      images: [
        {
          url: primaryImage,
          width: 800,
          height: 1067,
          alt: product.title,
        },
      ],
    },
  };
}

async function ProductPageLoader({ slug }: { slug: string }) {
  const detail = await catalogService.getProductBySlug(slug);

  if (!detail || !detail.product) {
    notFound();
  }

  return <ProductDetailContent product={detail.product} relatedProducts={detail.related} />;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<div className="py-20 text-center text-xs text-[#5A6065]">Loading atelier silhouette...</div>}>
        <ProductPageLoader slug={slug} />
      </Suspense>
    </div>
  );
}
