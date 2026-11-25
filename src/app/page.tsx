import { CinematicHero } from "@/components/home/CinematicHero";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { BrandStory } from "@/components/home/BrandStory";
import { FeaturedCollection } from "@/components/home/FeaturedCollection";
import { CampaignSection } from "@/components/home/CampaignSection";
import { TrustSection } from "@/components/home/TrustSection";

export default function HomePage() {
  return (
    <>
      <CinematicHero />
      <ShopByCategory />
      <BrandStory />
      <FeaturedCollection />
      <CampaignSection />
      <TrustSection />
    </>
  );
}
