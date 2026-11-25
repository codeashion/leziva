"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Sparkles, Feather, Heart, MapPin } from "lucide-react";
import { LUXURY_EASE, staggerContainer, fadeUp } from "@/lib/animations";

export function CampaignSection() {
  return (
    <section className="relative overflow-hidden bg-[#102B3A] text-white py-24 lg:py-28 border-b border-[#226192]/30">
      {/* Background Ambience with Slow Floating Parallax Motion */}
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.22, 0.28, 0.22] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 z-0 mix-blend-overlay pointer-events-none"
      >
        <img
          src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1800&q=80"
          alt="Campaign Ambience"
          className="w-full h-full object-cover"
        />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Festive Elegance CTA with Staggered Scroll Reveal */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.85, ease: LUXURY_EASE }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#EF8557]/20 border border-[#EF8557]/40 rounded-full shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#EF8557]" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#EF8557]">
                SEASONAL CAMPAIGN
              </span>
            </div>

            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#F8F5EF] leading-tight">
              Festive Elegance
            </h2>

            <p className="text-lg sm:text-xl text-[#F8F5EF]/80 max-w-xl font-light leading-relaxed">
              Celebrate moments that matter with ensembles tailored in pure silk, hand-embroidered zardozi, and royal silhouettes.
            </p>

            <div className="pt-2">
              <Link
                href="/collections/sarees"
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#EF8557] hover:bg-[#DF7446] text-white font-medium text-xs sm:text-sm tracking-widest uppercase rounded-full shadow-xl shadow-[#EF8557]/20 transition-all duration-300 hover:scale-105 active:scale-95 hover:gap-4"
              >
                <span>Shop Festive Edit</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          {/* Right Column: 4 Brand Value Cards with Staggered Entrance */}
          <motion.div
            variants={staggerContainer(0.12, 0.15)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
              transition={{ duration: 0.3 }}
              className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-start gap-3.5 shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-[#EF8557]/20 flex items-center justify-center shrink-0 text-[#EF8557]">
                <Feather className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-white">Premium Fabrics</h4>
                <p className="text-xs text-[#F8F5EF]/70 mt-1">Pure mulberry silk, breathable cottons & sheer organza.</p>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
              transition={{ duration: 0.3 }}
              className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-start gap-3.5 shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-[#EF8557]/20 flex items-center justify-center shrink-0 text-[#EF8557]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-white">Thoughtful Design</h4>
                <p className="text-xs text-[#F8F5EF]/70 mt-1">Ergonomic cuts, pre-pleated drapes & custom sizing ease.</p>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
              transition={{ duration: 0.3 }}
              className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-start gap-3.5 shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-[#EF8557]/20 flex items-center justify-center shrink-0 text-[#EF8557]">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-white">Made for India</h4>
                <p className="text-xs text-[#F8F5EF]/70 mt-1">Celebrations, grand weddings, festivals & everyday royalty.</p>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
              transition={{ duration: 0.3 }}
              className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-start gap-3.5 shadow-md"
            >
              <div className="w-10 h-10 rounded-full bg-[#EF8557]/20 flex items-center justify-center shrink-0 text-[#EF8557]">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-white">Loved by You</h4>
                <p className="text-xs text-[#F8F5EF]/70 mt-1">Over 25,000+ satisfied connoisseurs across the nation.</p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
