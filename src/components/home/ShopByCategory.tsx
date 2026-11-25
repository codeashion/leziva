"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { CATEGORIES } from "@/lib/constants";
import { ArrowRight } from "lucide-react";
import { LUXURY_EASE, archCardVariant, staggerContainer } from "@/lib/animations";

export function ShopByCategory() {
  return (
    <section className="py-24 bg-[#F8F5EF] border-b border-[#DED6CB] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Subtle Scroll Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: LUXURY_EASE }}
          className="flex flex-col sm:flex-row sm:items-end justify-between mb-14"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.25em] font-bold text-[#EF8557] mb-2">
              CURATED ARCHIVES
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#102B3A]">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/collections"
            className="group mt-4 sm:mt-0 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#102B3A] hover:text-[#EF8557] transition-colors"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* 5 Arch Category Cards Grid with Staggered Entrance */}
        <motion.div
          variants={staggerContainer(0.12, 0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6"
        >
          {CATEGORIES.map((cat, index) => (
            <motion.div
              key={cat.id}
              variants={archCardVariant}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.4, ease: LUXURY_EASE }}
            >
              <Link
                href={`/collections/${cat.slug}`}
                className="group flex flex-col items-center text-center cursor-pointer block"
              >
                {/* Arch Shaped Image Container */}
                <div className="relative w-full aspect-[3/4.2] rounded-t-full rounded-b-xl overflow-hidden bg-[#EAE6DE] shadow-md border-2 border-[#DED6CB] group-hover:border-[#EF8557] group-hover:shadow-xl transition-all duration-500">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Subtle Gradient vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                  {/* Subtitle Pill inside arch bottom */}
                  <div className="absolute bottom-3 inset-x-2 text-center">
                    <span className="inline-block text-[10px] text-white/95 font-medium tracking-wide bg-[#102B3A]/75 backdrop-blur-xs px-3 py-1 rounded-full shadow-sm group-hover:bg-[#EF8557] transition-colors">
                      {cat.itemCount} Designs
                    </span>
                  </div>
                </div>

                {/* Title & Action Link */}
                <div className="mt-4 space-y-1">
                  <h3 className="font-serif text-lg font-bold text-[#102B3A] group-hover:text-[#EF8557] transition-colors">
                    {cat.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#77716A] group-hover:text-[#102B3A] transition-colors">
                    <span>{cat.actionText}</span>
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
