"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Play, Sparkles, X } from "lucide-react";
import { LUXURY_EASE, fadeUp, modalPop } from "@/lib/animations";

const HERO_SLIDES = [
  {
    tagline: "NEW FESTIVE COLLECTION",
    headline: "Crafted for Every You",
    subtitle: "Timeless styles. Modern stories. Made for every moment of your life.",
    cta: "Shop The Collection",
    ctaLink: "/collections",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=90",
    badgeText: "Bespoke Indian Heritage Craftsmanship",
    insetHeading: "Tradition Reimagined",
    insetCategory: "Heirloom Sarees & Lehengas",
  },
  {
    tagline: "ROYAL ATELIER COUTURE",
    headline: "The Silk Mark Dynasty",
    subtitle: "Authentic Varanasi Kadwa weaves spun with real silver and gold zari threads.",
    cta: "Explore Silk Sarees",
    ctaLink: "/collections/sarees",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1600&q=90",
    badgeText: "Pure Handloom Authenticity Guaranteed",
    insetHeading: "Handwoven in Kashi",
    insetCategory: "Pure Banarasi Masterpieces",
  },
  {
    tagline: "BRIDAL MAISON 2026",
    headline: "Poetry in Motion",
    subtitle: "Opulent hand-embroidered lehengas designed for unforgettable celebrations.",
    cta: "Discover Bridal",
    ctaLink: "/collections/lehengas",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=90",
    badgeText: "Intricate Zardozi & Mukaish Work",
    insetHeading: "Imperial Splendor",
    insetCategory: "Couture Bridal Ensembles",
  },
];

export function CinematicHero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7500);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlide];
  const headlineWords = slide.headline.split(" ");

  return (
    <section className="relative overflow-hidden bg-[#EAE6DE] border-b border-[#DED6CB] min-h-[640px] lg:min-h-[780px] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Editorial Typography & CTAs with Staggered Word Reveal */}
          <div className="lg:col-span-6 z-10 space-y-6">
            
            {/* Tagline Pill */}
            <motion.div
              key={`tagline-${currentSlide}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: LUXURY_EASE }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#F8F5EF] border border-[#DED6CB] rounded-full shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#EF8557]" />
              <span className="text-[11px] font-bold tracking-[0.2em] text-[#102B3A] uppercase">
                {slide.tagline}
              </span>
            </motion.div>

            {/* Word-by-Word Staggered Display Headline */}
            <div className="overflow-hidden">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#102B3A] leading-[1.1] flex flex-wrap gap-x-3 gap-y-1">
                {headlineWords.map((word, idx) => (
                  <span key={`${word}-${idx}-${currentSlide}`} className="inline-block overflow-hidden pb-1">
                    <motion.span
                      initial={{ y: "105%", opacity: 0 }}
                      animate={{ y: "0%", opacity: 1 }}
                      transition={{
                        duration: 0.75,
                        delay: idx * 0.09,
                        ease: LUXURY_EASE,
                      }}
                      className="inline-block"
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
              </h1>
            </div>

            {/* Subtitle with Fade Up */}
            <motion.p
              key={`sub-${currentSlide}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: LUXURY_EASE }}
              className="text-base sm:text-lg text-[#77716A] max-w-lg leading-relaxed font-normal"
            >
              {slide.subtitle}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              key={`cta-${currentSlide}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.35, ease: LUXURY_EASE }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Link
                href={slide.ctaLink}
                className="group relative inline-flex items-center gap-2.5 px-8 py-4 bg-[#EF8557] hover:bg-[#DF7446] text-white font-medium text-xs sm:text-sm tracking-wider uppercase rounded-full shadow-lg shadow-[#EF8557]/25 transition-all duration-300 hover:shadow-xl hover:gap-3.5 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{slide.cta}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="group inline-flex items-center gap-2.5 px-6 py-4 bg-transparent hover:bg-white/60 text-[#102B3A] border border-[#102B3A]/25 hover:border-[#102B3A] font-medium text-xs sm:text-sm rounded-full transition-all duration-300 shadow-xs active:scale-[0.98]"
              >
                <div className="w-6 h-6 rounded-full bg-[#102B3A] text-white flex items-center justify-center transition-transform group-hover:scale-110">
                  <Play className="w-3 h-3 fill-white ml-0.5" />
                </div>
                <span>Watch Story Film</span>
              </button>
            </motion.div>

            {/* Interactive Slide Index Indicators with Progress Fill */}
            <div className="pt-8 flex items-center space-x-5 text-xs font-semibold text-[#102B3A]">
              {HERO_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`flex items-center gap-2.5 py-1.5 transition-all cursor-pointer ${
                    currentSlide === idx ? "opacity-100 font-bold" : "opacity-40 hover:opacity-75"
                  }`}
                  aria-label={`Switch to slide 0${idx + 1}`}
                >
                  <span className="font-mono text-xs">0{idx + 1}</span>
                  <div className="relative w-10 h-[2px] bg-[#77716A]/30 rounded-full overflow-hidden">
                    {currentSlide === idx ? (
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-[#102B3A] rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 7.5, ease: "linear" }}
                      />
                    ) : (
                      <div className="w-0 h-full bg-[#102B3A]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Hero Visual with Clip-Path Reveal & Subtle Ken Burns Zoom */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <motion.div
              initial={{ clipPath: "inset(12% 0% 0% 0%)", opacity: 0 }}
              animate={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
              transition={{ duration: 1.1, ease: LUXURY_EASE }}
              className="relative w-full max-w-lg aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#F8F5EF] group"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.9, ease: LUXURY_EASE }}
                  className="w-full h-full"
                >
                  <img
                    src={slide.image}
                    alt="Luxury Indian Fashion Couture Campaign"
                    className="w-full h-full object-cover object-top transition-transform duration-[8000ms] ease-out hover:scale-105"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Gradient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10 pointer-events-none" />

              {/* Floating Editorial Card with Slide Transition */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`inset-${currentSlide}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: LUXURY_EASE }}
                  className="absolute bottom-6 left-6 right-6 p-4.5 bg-[#F8F5EF]/95 backdrop-blur-md rounded-2xl border border-[#DED6CB] shadow-xl flex items-center justify-between"
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#EF8557] font-bold">
                      {slide.insetCategory}
                    </p>
                    <p className="font-serif text-base font-bold text-[#102B3A] mt-0.5">
                      {slide.insetHeading}
                    </p>
                  </div>
                  <Link
                    href="/collections"
                    className="w-10 h-10 rounded-full bg-[#102B3A] text-white flex items-center justify-center hover:bg-[#EF8557] transition-all hover:scale-105 shadow-md"
                    aria-label="Explore collection"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Rotating Circular Stamp Badge with Floating Micro-motion */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="hidden sm:block absolute -top-4 -right-4 lg:-top-6 lg:-right-6 w-32 h-32 z-20 pointer-events-none"
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <svg
                  className="w-full h-full animate-spin-slow"
                  viewBox="0 0 120 120"
                >
                  <path
                    id="textPathHero"
                    d="M 60, 60 m -46, 0 a 46,46 0 1,1 92,0 a 46,46 0 1,1 -92,0"
                    fill="none"
                  />
                  <text className="text-[9px] uppercase tracking-[0.25em] font-bold fill-[#102B3A]">
                    <textPath href="#textPathHero" startOffset="0%">
                      • BESPOKE HERITAGE • CRAFTSMANSHIP •
                    </textPath>
                  </text>
                </svg>
                <div className="absolute w-12 h-12 rounded-full bg-[#102B3A] text-white flex items-center justify-center shadow-lg border-2 border-[#EAE6DE]">
                  <Sparkles className="w-5 h-5 text-[#EF8557]" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Video Modal with Smooth Motion Transition */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => setIsVideoModalOpen(false)}
          >
            <motion.div
              variants={modalPop}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-2xl bg-[#102B3A] rounded-3xl overflow-hidden shadow-2xl p-8 border border-[#226192]/50 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="absolute top-5 right-5 text-white/70 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close film modal"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#EF8557]/20 border border-[#EF8557] flex items-center justify-center mx-auto text-[#EF8557] shadow-inner">
                  <Play className="w-7 h-7 fill-[#EF8557] ml-1" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                  The Heritage Loom Room
                </h3>
                <p className="text-sm text-white/70 max-w-md mx-auto leading-relaxed">
                  Step inside our sacred weaving ateliers in Varanasi and Tamil Nadu. Witness master artisans weaving pure silk threads and gold zari into enduring bridal heirlooms.
                </p>
                <div className="pt-4 flex justify-center">
                  <Link
                    href="/collections/sarees"
                    onClick={() => setIsVideoModalOpen(false)}
                    className="px-7 py-3 bg-[#EF8557] hover:bg-[#DF7446] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg transition-transform hover:scale-105"
                  >
                    Explore Handloom Sarees
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
