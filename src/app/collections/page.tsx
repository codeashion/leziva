import { Metadata } from "next";
import { ProductListingView } from "@/components/products/ProductListingView";

export const metadata: Metadata = {
  title: "All Collections | Luxury Indian Handlooms & Haute Couture",
  description: "Explore our complete repertoire of pure Banarasi sarees, bridal lehengas, silk kurtas, and artisanal accessories.",
};

export default function CollectionsPage() {
  return (
    <ProductListingView
      categoryTitle="The Entire Repertoire"
      categorySubtitle="Curated handlooms, regal bridal couture, and modern silhouettes for every celebration."
    />
  );
}
