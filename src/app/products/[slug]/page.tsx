import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCTS } from "@/lib/constants";
import { ProductDetailView } from "@/components/products/ProductDetailView";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = PRODUCTS.find((p) => p.slug === slug) || PRODUCTS[0];

  return {
    title: `${product.name} | Luxury Indian Fashion Couture`,
    description: product.description,
    openGraph: {
      title: `${product.name} - Luxury Handloom`,
      description: product.description,
      images: [{ url: product.images[0] }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = PRODUCTS.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  const related = PRODUCTS.filter(
    (p) => p.id !== product.id && (p.category === product.category || p.featured)
  );

  return <ProductDetailView product={product} relatedProducts={related} />;
}
