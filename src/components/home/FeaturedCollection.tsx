"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/products/ProductCard";
import { ArrowRight, Sparkles } from "lucide-react";
import { LUXURY_EASE, staggerContainer } from "@/lib/animations";

export function FeaturedCollection() {
  const { products } = useStore();
  const featured = products.filter((p) => p.featured).slice(0, 4);

  return (
    <section className="py-24 bg-[#F8F5EF] border-b border-[#DED6CB] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Scroll Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: LUXURY_EASE }}
          className="flex flex-col sm:flex-row sm:items-end justify-between mb-14"
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] font-bold text-[#EF8557] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>FEATURED COLLECTION</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#102B3A]">
              Handpicked for You
            </h2>
          </div>
          <Link
            href="/collections"
            className="group mt-4 sm:mt-0 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#102B3A] hover:text-[#EF8557] transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* 4 Cards Grid with Staggered Entrance */}
        <motion.div
          variants={staggerContainer(0.1, 0.05)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {featured.map((prod) => (
            <ProductCard key={prod.id} product={prod} showSizes={true} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
