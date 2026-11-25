"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "@/types";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/products/ProductCard";
import {
  ChevronRight,
  Star,
  Heart,
  Truck,
  RefreshCw,
  ShieldCheck,
  Plus,
  Minus,
  Check,
  ChevronDown,
  ChevronUp,
  Ruler,
  Share2,
  X,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { LUXURY_EASE, accordionVariant, modalPop } from "@/lib/animations";

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  const router = useRouter();
  const { addToCart, isInWishlist, toggleWishlist, showToast } = useStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colorName);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "Free Size");
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Accordion state
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    details: true,
    fabric: false,
    shipping: false,
    reviews: false,
  });

  const toggleAccordion = (section: string) => {
    setOpenAccordions((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const wishlisted = isInWishlist(product.id);

  const handleAddToCart = () => {
    setIsAddingToCart(true);
    setTimeout(() => {
      addToCart(product, selectedColor, selectedSize, quantity);
      setIsAddingToCart(false);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    }, 300);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedColor, selectedSize, quantity, false);
    router.push("/checkout");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard", "success");
    }
  };

  return (
    <div className="bg-[#EAE6DE] min-h-screen pb-28">
      {/* Breadcrumb Navigation */}
      <div className="bg-[#F8F5EF] border-b border-[#DED6CB] py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center text-xs text-[#77716A] space-x-2 overflow-x-auto">
            <Link href="/" className="hover:text-[#102B3A] transition-colors shrink-0">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
            <Link href="/collections" className="hover:text-[#102B3A] transition-colors shrink-0">
              Collections
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
            <Link
              href={`/collections/${product.category}`}
              className="hover:text-[#102B3A] transition-colors shrink-0 capitalize"
            >
              {product.categoryDisplayName}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
            <span className="text-[#102B3A] font-semibold truncate max-w-[220px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Main PDP Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          
          {/* Left Column: Image Gallery with Vertical Thumbnails & Smooth Crossfade */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            
            {/* Vertical Thumbnail Rail */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible shrink-0 pb-2 md:pb-0">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-16 h-20 md:w-20 md:h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 shrink-0 cursor-pointer ${
                    activeImageIndex === idx
                      ? "border-[#EF8557] ring-2 ring-[#EF8557]/30 scale-102"
                      : "border-[#DED6CB] opacity-75 hover:opacity-100 hover:border-[#102B3A]"
                  }`}
                >
                  <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Feature Image Container with Crossfade */}
            <div className="flex-1 relative aspect-[3/4] rounded-3xl overflow-hidden bg-[#F8F5EF] border border-[#DED6CB] shadow-xl group">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImageIndex}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: LUXURY_EASE }}
                  className="w-full h-full"
                >
                  <img
                    src={product.images[activeImageIndex] || product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-106"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Wishlist Floating Button with Bounce */}
              <motion.button
                whileTap={{ scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                onClick={() => toggleWishlist(product.id)}
                className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-colors shadow-lg ${
                  wishlisted
                    ? "bg-[#EF8557] text-white"
                    : "bg-white/85 text-[#171717] hover:bg-white hover:text-[#EF8557]"
                }`}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`w-5 h-5 ${wishlisted ? "fill-white" : ""}`} />
              </motion.button>

              {/* Share Floating Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.08 }}
                onClick={handleShare}
                className="absolute top-4 left-4 p-3 rounded-full bg-white/85 hover:bg-white text-[#171717] backdrop-blur-md shadow-md transition-colors"
                title="Share this creation"
              >
                <Share2 className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Right Column: Product Commerce Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: LUXURY_EASE }}
            className="lg:col-span-5 bg-[#F8F5EF] p-6 sm:p-9 rounded-3xl border border-[#DED6CB] shadow-lg space-y-6"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest font-bold text-[#EF8557]">
                  {product.categoryDisplayName} • {product.fabric}
                </span>
                <span className="text-xs text-[#77716A]">SKU: {product.sku}</span>
              </div>

              <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-[#102B3A]">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#102B3A]">{product.rating}</span>
                <span className="text-xs text-[#77716A]">({product.reviewCount} reviews)</span>
              </div>

              {/* Pricing Row */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-serif text-3xl font-bold text-[#102B3A]">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
                {product.originalPrice && (
                  <span className="text-base text-[#77716A] line-through">
                    ₹{product.originalPrice.toLocaleString("en-IN")}
                  </span>
                )}
                {product.discountPercentage && (
                  <span className="text-xs font-bold text-[#EF8557] bg-[#EF8557]/10 px-2.5 py-1 rounded-full uppercase">
                    {product.discountPercentage}% OFF
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#77716A] mt-1">Inclusive of all taxes. Free pan-India shipping.</p>

              <p className="mt-4 text-sm text-[#77716A] leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Color Variants Selector */}
            {product.availableColors && product.availableColors.length > 0 && (
              <div className="pt-4 border-t border-[#DED6CB]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#171717] uppercase tracking-wider">
                    Color: <span className="text-[#EF8557]">{selectedColor}</span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  {product.availableColors.map((col) => (
                    <motion.button
                      key={col.name}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedColor(col.name)}
                      className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                        selectedColor === col.name
                          ? "border-[#102B3A] ring-2 ring-[#EF8557] scale-110 shadow-sm"
                          : "border-transparent opacity-85 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    >
                      {selectedColor === col.name && (
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="pt-4 border-t border-[#DED6CB]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#171717] uppercase tracking-wider">
                    Select Size
                  </label>
                  <button
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-xs text-[#226192] hover:text-[#102B3A] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Size Guide</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((sz) => (
                    <motion.button
                      key={sz}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        selectedSize === sz
                          ? "bg-[#102B3A] text-white border-[#102B3A] shadow-md"
                          : "bg-white text-[#171717] border-[#DED6CB] hover:border-[#102B3A]"
                      }`}
                    >
                      {sz}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector & Stock Info */}
            <div className="pt-4 border-t border-[#DED6CB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-[#171717] uppercase tracking-wider">
                  Quantity
                </label>
                <div className="flex items-center border border-[#DED6CB] rounded-xl bg-white shadow-2xs">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 text-[#77716A] hover:text-[#171717] cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-[#171717]">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-2 text-[#77716A] hover:text-[#171717] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs font-semibold text-[#168454] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#168454] animate-pulse" />
                <span>In Stock ({product.stockCount} available)</span>
              </div>
            </div>

            {/* Primary Action Buttons with Animated State Feedback */}
            <div className="pt-4 grid grid-cols-2 gap-3.5">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className={`w-full py-4 text-white font-medium text-xs sm:text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  addedSuccess
                    ? "bg-[#168454] shadow-[#168454]/20"
                    : "bg-[#EF8557] hover:bg-[#DF7446] shadow-[#EF8557]/20"
                }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Bag!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isAddingToCart ? "Adding..." : "Add to Cart"}</span>
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBuyNow}
                className="w-full py-4 bg-[#102B3A] hover:bg-[#1A3E54] text-white font-medium text-xs sm:text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#EF8557]" />
                <span>Buy Now</span>
              </motion.button>
            </div>

            {/* Trust Badges Row */}
            <div className="pt-4 border-t border-[#DED6CB] grid grid-cols-3 gap-2 text-center text-xs text-[#77716A]">
              <div className="p-2.5 bg-[#EAE6DE]/60 rounded-xl">
                <Truck className="w-4 h-4 text-[#EF8557] mx-auto mb-1" />
                <p className="font-semibold text-[#171717] text-[11px]">Free Delivery</p>
                <p className="text-[10px]">On orders &gt; ₹999</p>
              </div>
              <div className="p-2.5 bg-[#EAE6DE]/60 rounded-xl">
                <RefreshCw className="w-4 h-4 text-[#EF8557] mx-auto mb-1" />
                <p className="font-semibold text-[#171717] text-[11px]">Easy Returns</p>
                <p className="text-[10px]">7 days return</p>
              </div>
              <div className="p-2.5 bg-[#EAE6DE]/60 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-[#EF8557] mx-auto mb-1" />
                <p className="font-semibold text-[#171717] text-[11px]">Secure Pay</p>
                <p className="text-[10px]">100% verified</p>
              </div>
            </div>

            {/* Accordion List with Smooth Height Transitions */}
            <div className="pt-4 border-t border-[#DED6CB] divide-y divide-[#DED6CB]">
              
              {/* Product Details */}
              <div className="py-3.5">
                <button
                  onClick={() => toggleAccordion("details")}
                  className="w-full flex items-center justify-between text-left text-sm font-serif font-bold text-[#102B3A] cursor-pointer"
                >
                  <span>Product Details</span>
                  {openAccordions.details ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <motion.div
                  variants={accordionVariant}
                  initial={false}
                  animate={openAccordions.details ? "expanded" : "collapsed"}
                  className="overflow-hidden"
                >
                  <ul className="pt-3 space-y-1.5 text-xs text-[#77716A] pl-4 list-disc">
                    {product.details.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              {/* Fabric & Care */}
              <div className="py-3.5">
                <button
                  onClick={() => toggleAccordion("fabric")}
                  className="w-full flex items-center justify-between text-left text-sm font-serif font-bold text-[#102B3A] cursor-pointer"
                >
                  <span>Fabric & Care</span>
                  {openAccordions.fabric ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <motion.div
                  variants={accordionVariant}
                  initial={false}
                  animate={openAccordions.fabric ? "expanded" : "collapsed"}
                  className="overflow-hidden"
                >
                  <ul className="pt-3 space-y-1.5 text-xs text-[#77716A] pl-4 list-disc">
                    {product.careInstructions.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              {/* Shipping & Returns */}
              <div className="py-3.5">
                <button
                  onClick={() => toggleAccordion("shipping")}
                  className="w-full flex items-center justify-between text-left text-sm font-serif font-bold text-[#102B3A] cursor-pointer"
                >
                  <span>Shipping & Returns</span>
                  {openAccordions.shipping ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <motion.div
                  variants={accordionVariant}
                  initial={false}
                  animate={openAccordions.shipping ? "expanded" : "collapsed"}
                  className="overflow-hidden"
                >
                  <div className="pt-3 text-xs text-[#77716A] space-y-2">
                    <p>{product.shippingInfo}</p>
                    <p>7-day reverse pickup available with no questions asked return policy.</p>
                  </div>
                </motion.div>
              </div>

              {/* Customer Reviews */}
              <div className="py-3.5">
                <button
                  onClick={() => toggleAccordion("reviews")}
                  className="w-full flex items-center justify-between text-left text-sm font-serif font-bold text-[#102B3A] cursor-pointer"
                >
                  <span>Reviews ({product.reviewCount})</span>
                  {openAccordions.reviews ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <motion.div
                  variants={accordionVariant}
                  initial={false}
                  animate={openAccordions.reviews ? "expanded" : "collapsed"}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-3 text-xs text-[#77716A]">
                    <div className="p-3.5 bg-white rounded-xl border border-[#DED6CB] shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#102B3A]">Ananya Singhania</span>
                        <span className="text-[10px] text-green-700 font-semibold">Verified Buyer</span>
                      </div>
                      <div className="flex text-amber-500 my-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-[11px] text-[#171717]">
                        &ldquo;The zari work and luster of this fabric exceeded my expectations. Wore it to my brother&apos;s sangeet and received endless compliments!&rdquo;
                      </p>
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-[#DED6CB] shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#102B3A]">Pooja Verma</span>
                        <span className="text-[10px] text-green-700 font-semibold">Verified Buyer</span>
                      </div>
                      <div className="flex text-amber-500 my-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-[11px] text-[#171717]">
                        &ldquo;Authentic silk mark feel, packaging was magnificent. Will definitely be a repeat buyer.&rdquo;
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

            </div>
          </motion.div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 pt-14 border-t border-[#DED6CB]">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#EF8557]">
                  RECOMMENDED
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#102B3A]">
                  You May Also Like
                </h3>
              </div>
              <Link
                href={`/collections/${product.category}`}
                className="text-xs font-semibold uppercase tracking-wider text-[#102B3A] hover:text-[#EF8557]"
              >
                View Category →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.slice(0, 4).map((rel) => (
                <ProductCard key={rel.id} product={rel} showSizes={false} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Size Guide Modal with Motion Pop */}
      <AnimatePresence>
        {isSizeGuideOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSizeGuideOpen(false)}
          >
            <motion.div
              variants={modalPop}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-lg bg-[#F8F5EF] rounded-3xl p-7 border border-[#DED6CB] shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#DED6CB]">
                <h3 className="font-serif text-lg font-bold text-[#102B3A]">
                  Garment Size & Measurement Guide
                </h3>
                <button
                  onClick={() => setIsSizeGuideOpen(false)}
                  className="p-1 text-[#171717] hover:text-[#EF8557] rounded-full"
                  aria-label="Close guide"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#77716A]">
                Measurements are in inches. Sarees come in standard 5.5m drape with 0.8m unstitched blouse.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#EAE6DE] text-[#102B3A]">
                    <tr>
                      <th className="p-2.5 font-bold">Size</th>
                      <th className="p-2.5 font-bold">Bust</th>
                      <th className="p-2.5 font-bold">Waist</th>
                      <th className="p-2.5 font-bold">Hip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DED6CB]">
                    <tr>
                      <td className="p-2.5 font-semibold">XS</td>
                      <td className="p-2.5">32-34</td>
                      <td className="p-2.5">26-28</td>
                      <td className="p-2.5">36-38</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">S</td>
                      <td className="p-2.5">34-36</td>
                      <td className="p-2.5">28-30</td>
                      <td className="p-2.5">38-40</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">M</td>
                      <td className="p-2.5">36-38</td>
                      <td className="p-2.5">30-32</td>
                      <td className="p-2.5">40-42</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">L</td>
                      <td className="p-2.5">38-40</td>
                      <td className="p-2.5">32-34</td>
                      <td className="p-2.5">42-44</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold">XL</td>
                      <td className="p-2.5">40-42</td>
                      <td className="p-2.5">34-36</td>
                      <td className="p-2.5">44-46</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setIsSizeGuideOpen(false)}
                  className="px-6 py-2.5 bg-[#102B3A] text-white text-xs font-semibold rounded-xl hover:bg-[#1A3E54] transition-colors"
                >
                  Close Guide
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sticky Purchase Bar with Smooth Slide */}
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: LUXURY_EASE }}
        className="lg:hidden fixed bottom-14 inset-x-0 bg-[#F8F5EF]/95 backdrop-blur-md border-t border-[#DED6CB] p-3 z-20 flex items-center justify-between gap-3 shadow-lg"
      >
        <div>
          <p className="text-xs font-bold text-[#102B3A]">
            ₹{product.price.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-[#77716A]">Free Express Shipping</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddToCart}
            className="px-4 py-2.5 bg-[#EF8557] text-white text-xs font-bold uppercase rounded-xl shadow-sm"
          >
            Add to Bag
          </button>
          <button
            onClick={handleBuyNow}
            className="px-4 py-2.5 bg-[#102B3A] text-white text-xs font-bold uppercase rounded-xl shadow-sm"
          >
            Buy Now
          </button>
        </div>
      </motion.div>
    </div>
  );
}
