"use client";

import React from "react";
import { motion } from "motion/react";
import { Truck, RefreshCw, ShieldCheck, Award } from "lucide-react";
import { LUXURY_EASE, staggerContainer, fadeUp } from "@/lib/animations";

export function TrustSection() {
  const trustItems = [
    {
      icon: Truck,
      title: "Free Shipping",
      desc: "On orders above ₹999",
    },
    {
      icon: RefreshCw,
      title: "Easy Returns",
      desc: "7 days doorstep return policy",
    },
    {
      icon: ShieldCheck,
      title: "Secure Payments",
      desc: "100% safe & 256-bit encrypted",
    },
    {
      icon: Award,
      title: "Assured Quality",
      desc: "Premium craftsmanship guarantee",
    },
  ];

  return (
    <section className="py-14 bg-[#F8F5EF] border-b border-[#DED6CB] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer(0.08, 0.05)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
        >
          {trustItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3, ease: LUXURY_EASE }}
                className="flex flex-col items-center p-4 rounded-xl hover:bg-[#EAE6DE]/50 transition-colors cursor-default"
              >
                <div className="w-12 h-12 rounded-full bg-[#EAE6DE] flex items-center justify-center text-[#102B3A] mb-3 border border-[#DED6CB] shadow-xs">
                  <Icon className="w-5 h-5 text-[#EF8557]" />
                </div>
                <h4 className="font-serif text-sm font-bold text-[#102B3A]">{item.title}</h4>
                <p className="text-xs text-[#77716A] mt-0.5">{item.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
