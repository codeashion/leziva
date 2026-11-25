import { Metadata } from "next";
import { ProductListingView } from "@/components/products/ProductListingView";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const capitalized = category.charAt(0).toUpperCase() + category.slice(1);
  return {
    title: `${capitalized} Collection | Luxury Indian Fashion`,
    description: `Discover handcrafted ${category} designs featuring pure silk, intricate zari work, and royal tailoring.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;

  let title = category.charAt(0).toUpperCase() + category.slice(1);
  let subtitle = "Six yards of elegance, for every you.";

  if (category === "sarees") {
    title = "Sarees";
    subtitle = "Six yards of elegance, handwoven in Varanasi, Kanchipuram, and Chanderi.";
  } else if (category === "women") {
    title = "Women's Collection";
    subtitle = "Festive sarees, bridal lehengas, and embroidered anarkalis for every royal moment.";
  } else if (category === "lehengas") {
    title = "Bridal & Festive Lehengas";
    subtitle = "Lavish kalis adorned with pita zari, resham flowers, and micro-sequins.";
  } else if (category === "kurtas") {
    title = "Kurtas & Co-ord Sets";
    subtitle = "Artisanal silhouettes with delicate mirror work and tailored comfort.";
  } else if (category === "mens") {
    title = "Men's Regal Attire";
    subtitle = "Pure raw silk kurtas, bandhgalas, and majestic sherwanis for modern grooms.";
  } else if (category === "kids") {
    title = "Kids' Festive Wardrobe";
    subtitle = "Lightweight, comfortable festive ensembles for the younger royals.";
  } else if (category === "accessories") {
    title = "Luxury Accessories";
    subtitle = "Handcrafted zardozi potlis, embroidered dupattas, and artisanal stoles.";
  }

  return (
    <ProductListingView
      initialCategory={category}
      categoryTitle={title}
      categorySubtitle={subtitle}
    />
  );
}
