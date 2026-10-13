import React, { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Sparkles, Shield, RefreshCw, Truck, Award } from "lucide-react";
import { productRepository } from "@/server/repositories/product.repository";
import { ProductCard } from "@/components/catalog/product-card";
import { Button } from "@/components/ui/button";

async function HomeContent() {
  await connection();
  const [categories, featuredResult, bestsellersResult] = await Promise.all([
    productRepository.getCategories(),
    productRepository.findProducts({ featured: true, limit: 4 }),
    productRepository.findProducts({ sort: "newest", limit: 4 }),
  ]);

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* SECTION A: Editorial Hero Campaign */}
      <section className="relative overflow-hidden bg-[#EAE6DE]">
        <div className="relative h-[82vh] min-h-[560px] max-h-[880px] w-full">
          <Image
            src="/images/catalog/hero_campaign.jpg"
            alt="LEZIVA Haute Couture Festive Campaign"
            fill
            priority
            sizes="100vw"
            className="object-cover object-top sm:object-center brightness-[0.92]"
          />

          {/* Luxury Gradient Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/30" />

          {/* Hero Content Box */}
          <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-20 text-white">
            <div className="max-w-2xl space-y-4 animate-in slide-in-from-bottom-6 duration-700">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md border border-white/25 rounded-full text-xs font-medium tracking-[0.2em] uppercase text-[#EAE6DE]">
                <Sparkles className="w-3.5 h-3.5 text-[#EF8557]" />
                <span>The Festive Capsule 2026</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal leading-[1.08] tracking-tight text-white drop-shadow-sm">
                Heirloom Silks &amp; <br />
                <span className="italic font-light">Modern Silhouettes</span>
              </h1>

              <p className="text-sm sm:text-base text-[#EAE6DE]/90 font-light max-w-xl leading-relaxed">
                Handcrafted pure Banarasi weaves, bespoke velvet bridal lehengas, and contemporary drape silhouettes created for women of timeless grace.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-[#226192] hover:bg-[#164366] text-white border-0 group"
                  asChild
                >
                  <Link href="/shop">
                    Explore The Collection
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/40 backdrop-blur-sm"
                  asChild
                >
                  <Link href="#atelier-story">The Atelier Story</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B: Shop by Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#226192]">
            Curated Categories
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1D20] font-normal">
            Atelier Repertoire
          </h2>
          <p className="text-xs sm:text-sm text-[#5A6065]">
            From six yards of pure silk heritage to evening gowns sculptured with finesse.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-xs bg-[#EAE6DE] shadow-xs"
            >
              <Image
                src={cat.imageUrl || "/images/catalog/cat_sarees.jpg"}
                alt={cat.name}
                fill
                sizes="(max-width: 768px) 50vw, 20vw"
                className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-108"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity group-hover:opacity-90" />

              <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                <span className="text-[10px] tracking-widest uppercase text-[#EF8557] font-semibold opacity-0 -translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                  Discover
                </span>
                <h3 className="font-serif text-base sm:text-lg font-medium text-white">
                  {cat.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION C: New Arrivals Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-4 border-b border-[#E2DDD3]">
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#226192]">
              Fresh Off The Loom
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1D20] font-normal mt-1">
              New Atelier Arrivals
            </h2>
          </div>

          <Link
            href="/shop?sort=newest"
            className="text-xs uppercase tracking-widest font-semibold text-[#226192] hover:text-[#164366] flex items-center gap-1.5 transition-colors"
          >
            <span>View All Pieces</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredResult.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* SECTION E: Editorial Festive Campaign Banner */}
      <section className="relative overflow-hidden bg-[#164366]">
        <div className="relative min-h-[500px] lg:h-[650px] w-full flex items-center">
          <Image
            src="/images/catalog/festive_campaign.jpg"
            alt="The Royal Festive Atelier Edit"
            fill
            sizes="100vw"
            className="object-cover object-center brightness-[0.85]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-white w-full">
            <div className="max-w-xl space-y-4">
              <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[#EF8557]">
                Ceremonial Edit
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-normal leading-[1.15]">
                The Royal Festive <br />
                <span className="italic font-light">Zari Brocades</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#EAE6DE]/85 leading-relaxed font-light">
                Infused with centuries of regal heritage. Each lehenga and saree in our ceremonial collection is hand-embroidered with antique dabka, sequin foliage, and pure gold zari threads.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="bg-[#EF8557] hover:bg-[#e8713d] text-white border-0 group"
                  asChild
                >
                  <Link href="/categories/lehengas">
                    Explore Ceremonial Wear
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION D: Best Sellers Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-4 border-b border-[#E2DDD3]">
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#226192]">
              Loved by Patrons
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1D20] font-normal mt-1">
              Atelier Best Sellers
            </h2>
          </div>

          <Link
            href="/shop"
            className="text-xs uppercase tracking-widest font-semibold text-[#226192] hover:text-[#164366] flex items-center gap-1.5 transition-colors"
          >
            <span>Explore Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {bestsellersResult.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* SECTION F: Brand Storytelling & Atelier Heritage */}
      <section id="atelier-story" className="bg-[#EAE6DE]/40 border-y border-[#E2DDD3] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#226192]">
                The Craftsmanship
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1D20] font-normal leading-snug">
                Where Handloom Roots Meet Contemporary Architecture
              </h2>
              <div className="space-y-4 text-xs sm:text-sm text-[#5A6065] leading-relaxed">
                <p>
                  Born out of deep reverence for Indian textile heritage, LEZIVA bridges generational weavers in Varanasi and master tailors in Gujarat with modern silhouettes.
                </p>
                <p>
                  Every piece begins on a pit loom—where single threads of pure mulberry silk and electroplated zari are woven by hand over months. There are no shortcuts, no factory compromises, and no ephemeral trends.
                </p>
                <p>
                  Whether draped in our 6-yard Kanjivaram silks or stepping into our sculptural fusion gowns, you carry a living legacy of craftsmanship.
                </p>
              </div>

              <div className="pt-2">
                <Button variant="outline" size="md" asChild>
                  <Link href="/about">Read The Full Story</Link>
                </Button>
              </div>
            </div>

            <div className="relative aspect-[4/3] rounded-xs overflow-hidden shadow-editorial-lg bg-[#EAE6DE]">
              <Image
                src="/images/catalog/saree_detail.jpg"
                alt="Intricate Handloom Zari Weaving Craftsmanship"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION G: Customer Service & Atelier Promises */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white border border-[#E2DDD3] rounded-xs space-y-3">
            <Award className="w-6 h-6 text-[#226192]" />
            <h4 className="font-serif text-base font-medium text-[#1A1D20]">
              Certified Silk Mark
            </h4>
            <p className="text-xs text-[#5A6065] leading-relaxed">
              Every saree and drape comes with official Silk Mark certification verifying authentic pure mulberry yarns.
            </p>
          </div>

          <div className="p-6 bg-white border border-[#E2DDD3] rounded-xs space-y-3">
            <Truck className="w-6 h-6 text-[#226192]" />
            <h4 className="font-serif text-base font-medium text-[#1A1D20]">
              Insured Express Delivery
            </h4>
            <p className="text-xs text-[#5A6065] leading-relaxed">
              Tamper-proof luxury packaging dispatched via Velocity Express across all Indian pin codes.
            </p>
          </div>

          <div className="p-6 bg-white border border-[#E2DDD3] rounded-xs space-y-3">
            <RefreshCw className="w-6 h-6 text-[#226192]" />
            <h4 className="font-serif text-base font-medium text-[#1A1D20]">
              7-Day Easy Returns
            </h4>
            <p className="text-xs text-[#5A6065] leading-relaxed">
              Full peace of mind. Complimentary pickup and immediate exchange or refund if you are not enchanted.
            </p>
          </div>

          <div className="p-6 bg-white border border-[#E2DDD3] rounded-xs space-y-3">
            <Shield className="w-6 h-6 text-[#226192]" />
            <h4 className="font-serif text-base font-medium text-[#1A1D20]">
              Bespoke Styling Concierge
            </h4>
            <p className="text-xs text-[#5A6065] leading-relaxed">
              Direct access to our senior fashion stylists for bridal consults, custom sizing, and personalized edits.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7]" />}>
      <HomeContent />
    </Suspense>
  );
}
