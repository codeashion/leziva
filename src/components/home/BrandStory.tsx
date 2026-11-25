"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Sparkles, Feather } from "lucide-react";
import { LUXURY_EASE, fadeUp, imageMaskReveal } from "@/lib/animations";

export function BrandStory() {
  return (
    <section id="stories" className="py-28 bg-[#EAE6DE] border-b border-[#DED6CB] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Story Editorial with Staggered Scroll Reveal */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.85, ease: LUXURY_EASE }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] font-bold text-[#EF8557]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>OUR STORY</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#102B3A] leading-tight">
              More Than Fashion
            </h2>

            <p className="text-base sm:text-lg text-[#77716A] leading-relaxed">
              We celebrate culture, craftsmanship, and the people who wear our stories. Born out of deep reverence for Indian handloom guilds, every thread is an ode to timeless grace.
            </p>

            {/* Statistics Counters */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#DED6CB]">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2, ease: LUXURY_EASE }}
              >
                <p className="font-serif text-3xl font-bold text-[#102B3A]">350+</p>
                <p className="text-xs text-[#77716A] uppercase tracking-wider mt-1">Master Weavers</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.35, ease: LUXURY_EASE }}
              >
                <p className="font-serif text-3xl font-bold text-[#102B3A]">100%</p>
                <p className="text-xs text-[#77716A] uppercase tracking-wider mt-1">Pure Certified Silk</p>
              </motion.div>
            </div>

            <div className="pt-2">
              <Link
                href="/collections"
                className="group inline-flex items-center gap-2.5 text-sm font-semibold tracking-wider text-[#102B3A] hover:text-[#EF8557] transition-colors"
              >
                <span>Discover Our Story</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
              </Link>
            </div>
          </motion.div>

          {/* Right Column: Asymmetric Photo Composition with Mask Reveal & Layered Parallax */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            
            {/* Center Main Editorial Image with Mask Reveal */}
            <motion.div
              variants={imageMaskReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="sm:col-span-7 relative aspect-[3/4.2] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#F8F5EF] group"
            >
              <img
                src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=85"
                alt="Indian Fashion Heritage Story"
                className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-108"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-[11px] tracking-widest uppercase opacity-80">Heirloom Handloom</p>
                <p className="font-serif text-sm font-semibold">Varanasi Brocades & Pure Zari</p>
              </div>
            </motion.div>

            {/* Side Column with Secondary Image & Floating Luxury Quote Card */}
            <div className="sm:col-span-5 space-y-6">
              
              {/* Secondary Image */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, delay: 0.2, ease: LUXURY_EASE }}
                className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border-2 border-[#F8F5EF] group"
              >
                <img
                  src="https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80"
                  alt="Artisan Textile Detail"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-106"
                  loading="lazy"
                />
              </motion.div>

              {/* Floating Quote Card matching UI kit reference */}
              <motion.div
                initial={{ opacity: 0, y: 25, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, delay: 0.35, ease: LUXURY_EASE }}
                whileHover={{ y: -4 }}
                className="p-7 bg-[#F8F5EF] rounded-2xl border border-[#DED6CB] shadow-xl relative transition-shadow hover:shadow-2xl"
              >
                <Feather className="w-6 h-6 text-[#EF8557] mb-3" />
                <p className="font-serif text-lg font-bold text-[#102B3A] italic leading-snug">
                  &ldquo;Modern Fashion with Indian Soul&rdquo;
                </p>
                <p className="text-xs text-[#77716A] uppercase tracking-widest mt-4 font-semibold">
                  — from the family
                </p>
              </motion.div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
