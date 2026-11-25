"use client";

import React from "react";
import { useStore } from "@/context/StoreContext";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export function ToastNotification() {
  const { toast } = useStore();

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-full animate-bounce-in transition-all">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-sm backdrop-blur-md ${
          toast.type === "success"
            ? "bg-[#102B3A] text-white border-[#226192]/40"
            : toast.type === "error"
            ? "bg-red-900 text-white border-red-700"
            : "bg-[#F8F5EF] text-[#171717] border-[#DED6CB]"
        }`}
      >
        {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-[#EF8557] shrink-0" />}
        {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
        {toast.type === "info" && <Info className="w-5 h-5 text-[#226192] shrink-0" />}
        <p className="font-medium text-xs md:text-sm tracking-wide leading-relaxed">{toast.message}</p>
      </div>
    </div>
  );
}
