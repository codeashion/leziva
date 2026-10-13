import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { productRepository } from "@/server/repositories/product.repository";
import { ProductDetailContent } from "@/components/catalog/product-detail-content";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const result = await productRepository.findProducts({ limit: 100 });
  return result.products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await productRepository.findBySlug(slug);

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
  const product = await productRepository.findBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = await productRepository.findRelated(product.id, product.categoryId, 3);

  return <ProductDetailContent product={product} relatedProducts={related} />;
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
