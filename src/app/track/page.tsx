import React, { Suspense } from "react";
import { TrackOrderClient } from "./track-client";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Order | LEZIVA Luxury Atelier",
  description: "Track your bespoke LEZIVA order with live courier milestone tracking powered by Velocity Express Logistics.",
};

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 bg-[#FBFBFA]">
          <Loader2 className="w-8 h-8 text-[#226192] animate-spin" />
          <p className="font-serif text-[#5A6065] text-sm tracking-wide">Connecting to logistics satellite...</p>
        </div>
      }
    >
      <TrackOrderClient />
    </Suspense>
  );
}
