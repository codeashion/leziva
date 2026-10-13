"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product, ProductVariant } from "@/shared/types";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { VariantSelector } from "@/components/catalog/variant-selector";
import { PincodeChecker } from "@/components/catalog/pincode-checker";
import { SizeGuideModal } from "@/components/catalog/size-guide-modal";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { useToast } from "@/context/toast-context";
import { Heart, ShoppingBag, ShieldCheck, Sparkles, ChevronRight, Check } from "lucide-react";

interface ProductDetailContentProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailContent({
  product,
  relatedProducts,
}: ProductDetailContentProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { success } = useToast();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants[0] || ({} as ProductVariant)
  );
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"fabric" | "care" | "shipping">("fabric");

  const isWishlisted = isInWishlist(product.id);
  const price = selectedVariant.price || product.variants[0]?.price || 0;
  const compareAtPrice = selectedVariant.compareAtPrice || product.variants[0]?.compareAtPrice;

  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  const handleAddToCart = () => {
    addItem(product, selectedVariant, 1);
    success("Added to Shopping Bag", `${product.title} has been placed in your bag.`);
  };

  const handleBuyNow = () => {
    addItem(product, selectedVariant, 1);
    router.push("/cart");
  };

  const handleWishlistToggle = () => {
    toggleWishlist(product);
    if (!isWishlisted) {
      success("Saved to Wishlist", `${product.title} added to your wishlist.`);
    }
  };

  return (
    <div className="space-y-16">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-[#5A6065]">
        <Link href="/" className="hover:text-[#226192] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#DDD7CB]" />
        {product.category && (
          <>
            <Link
              href={`/categories/${product.category.slug}`}
              className="hover:text-[#226192] transition-colors"
            >
              {product.category.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#DDD7CB]" />
          </>
        )}
        <span className="text-[#1A1D20] font-semibold truncate max-w-xs">
          {product.title}
        </span>
      </nav>

      {/* Main PDP Grid: Gallery (Left) & Purchasing Column (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Left: Gallery */}
        <div className="lg:col-span-7">
          <ProductGallery images={product.images} title={product.title} />
        </div>

        {/* Right: Product Details & Purchase Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2 border-b border-[#E2DDD3] pb-6">
            {product.category && (
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#226192]">
                {product.category.name}
              </span>
            )}
            <h1 className="font-serif text-2xl sm:text-3xl text-[#1A1D20] font-normal leading-snug">
              {product.title}
            </h1>

            {/* Price section */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1D20]">
                ₹{price.toLocaleString("en-IN")}
              </span>
              {compareAtPrice && compareAtPrice > price && (
                <>
                  <span className="text-sm text-[#5A6065] line-through">
                    ₹{compareAtPrice.toLocaleString("en-IN")}
                  </span>
                  {discountPercent && (
                    <span className="bg-[#EF8557] text-white text-xs font-bold px-2 py-0.5 rounded-2xs uppercase tracking-wider">
                      {discountPercent}% OFF
                    </span>
                  )}
                </>
              )}
            </div>
            <p className="text-[11px] text-[#5A6065]">
              Inclusive of all taxes. Free insured express shipping on this order.
            </p>
          </div>

          {/* Description */}
          <div className="text-xs sm:text-sm text-[#5A6065] leading-relaxed">
            <p>{product.description}</p>
          </div>

          {/* Variant Selector: Color & Size */}
          <VariantSelector
            variants={product.variants}
            selectedVariant={selectedVariant}
            onSelectVariant={setSelectedVariant}
            onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
          />

          {/* Add to Cart & Buy Now Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                className="flex-1 bg-[#226192] hover:bg-[#164366] text-white h-12 text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Shopping Bag</span>
              </Button>

              <button
                onClick={handleWishlistToggle}
                aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                className={`p-3 rounded-xs border transition-colors flex items-center justify-center ${
                  isWishlisted
                    ? "border-[#EF8557] bg-[#EF8557] text-white"
                    : "border-[#E2DDD3] bg-white text-[#1A1D20] hover:border-[#EF8557]"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isWishlisted ? "fill-white" : ""}`}
                />
              </button>
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={handleBuyNow}
              className="w-full border-[#226192] text-[#226192] hover:bg-[#226192] hover:text-white h-12 text-xs uppercase tracking-widest font-semibold"
            >
              Buy Now with Express Atelier Checkout
            </Button>
          </div>

          {/* Delivery PIN Code Checker */}
          <div className="pt-2">
            <PincodeChecker />
          </div>

          {/* Heritage Atelier Accordion Tabs */}
          <div className="border border-[#E2DDD3] rounded-xs overflow-hidden bg-white">
            <div className="flex border-b border-[#E2DDD3] text-xs font-semibold uppercase tracking-wider text-[#1A1D20]">
              <button
                onClick={() => setActiveTab("fabric")}
                className={`flex-1 py-3 text-center transition-colors ${
                  activeTab === "fabric"
                    ? "bg-[#FDFBF7] text-[#226192] border-b-2 border-[#226192]"
                    : "text-[#5A6065] hover:text-[#1A1D20]"
                }`}
              >
                Fabric Details
              </button>
              <button
                onClick={() => setActiveTab("care")}
                className={`flex-1 py-3 text-center transition-colors ${
                  activeTab === "care"
                    ? "bg-[#FDFBF7] text-[#226192] border-b-2 border-[#226192]"
                    : "text-[#5A6065] hover:text-[#1A1D20]"
                }`}
              >
                Atelier Care
              </button>
              <button
                onClick={() => setActiveTab("shipping")}
                className={`flex-1 py-3 text-center transition-colors ${
                  activeTab === "shipping"
                    ? "bg-[#FDFBF7] text-[#226192] border-b-2 border-[#226192]"
                    : "text-[#5A6065] hover:text-[#1A1D20]"
                }`}
              >
                Returns &amp; Guarantee
              </button>
            </div>

            <div className="p-4 text-xs text-[#5A6065] leading-relaxed">
              {activeTab === "fabric" && (
                <div className="space-y-2">
                  <p>
                    <strong className="text-[#1A1D20]">Material:</strong>{" "}
                    {product.fabricDetails || "100% Certified Mulberry Silk with Real Zari Weft"}
                  </p>
                  <p>
                    <strong className="text-[#1A1D20]">Origin:</strong> Handcrafted by generational master artisans in Varanasi &amp; Surat.
                  </p>
                  <p className="flex items-center gap-1.5 text-emerald-700 font-medium pt-1">
                    <Check className="w-4 h-4" />
                    <span>Silk Mark Certified authentic textile</span>
                  </p>
                </div>
              )}

              {activeTab === "care" && (
                <div className="space-y-2">
                  <p>{product.careInstructions || "Specialist dry clean only. Preserve wrapped in unbleached pure cotton muslin cloth away from direct sunlight."}</p>
                  <p className="text-[#1A1D20] font-medium">Ironing: Low heat steam on reverse only.</p>
                </div>
              )}

              {activeTab === "shipping" && (
                <div className="space-y-2">
                  <p>
                    <strong className="text-[#1A1D20]">Dispatch:</strong> Ships within 24-48 hours via Velocity Express Air in tamper-proof signature luxury gift box.
                  </p>
                  <p>
                    <strong className="text-[#1A1D20]">7-Day Policy:</strong> Complimentary doorstep pickup and exchange if not completely enchanted.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Atelier Trust Badges */}
          <div className="flex items-center justify-around py-3 bg-[#EAE6DE]/30 rounded-xs text-[11px] text-[#5A6065]">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#EF8557]" />
              <span>Authentic Handloom</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#226192]" />
              <span>Silk Mark Certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Atelier Pieces */}
      {relatedProducts.length > 0 && (
        <section className="pt-16 border-t border-[#E2DDD3] space-y-6">
          <div className="text-center max-w-lg mx-auto space-y-1">
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#226192]">
              Curated Complements
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1D20] font-normal">
              You May Also Admire
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {relatedProducts.map((p) => {
              const primaryImg = p.images[0]?.url || "/images/catalog/cat_sarees.jpg";
              const pPrice = p.variants[0]?.price || 0;

              return (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="group flex flex-col bg-white border border-[#E2DDD3]/60 rounded-xs overflow-hidden hover:shadow-editorial-md transition-all"
                >
                  <div className="relative aspect-[3/4] bg-[#EAE6DE] overflow-hidden">
                    <Image
                      src={primaryImg}
                      alt={p.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3.5 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#226192] font-semibold">
                      {p.category?.name || "Atelier"}
                    </span>
                    <h4 className="font-serif text-sm font-medium text-[#1A1D20] truncate group-hover:text-[#226192] transition-colors">
                      {p.title}
                    </h4>
                    <span className="text-xs font-bold text-[#1A1D20] block">
                      ₹{pPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
      />
    </div>
  );
}
