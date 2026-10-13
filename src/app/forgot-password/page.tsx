"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setStatus("success");
      setMessage(
        data.meta?.message ||
          "If an account exists with that email address, password reset instructions have been dispatched."
      );
    } catch {
      setStatus("error");
      setMessage("Network connection interrupted. Please try again.");
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border border-[#E2DDD3] rounded-xs p-8 shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center pb-2">
            <Logo variant="full" size="md" />
          </div>
          <h1 className="font-serif text-2xl font-normal text-[#1A1D20]">
            Password Recovery
          </h1>
          <p className="text-xs text-[#5A6065]">
            Enter your registered email address and we will send you secure recovery instructions.
          </p>
        </div>

        {status === "success" ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-xs space-y-3">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Instructions Dispatched</span>
            </div>
            <p>{message}</p>
            <div className="pt-2">
              <Link
                href="/login"
                className="text-[#226192] font-semibold hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === "error" && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xs">
                {message}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1D20]">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. patron@domain.com"
                className="w-full px-3.5 py-2.5 text-xs bg-[#FDFBF7] border border-[#E2DDD3] rounded-xs outline-none focus:border-[#226192] text-[#1A1D20]"
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-[#226192] hover:bg-[#164366] text-white py-3 rounded-xs text-xs font-semibold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {status === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Send Reset Instructions"
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-xs text-[#5A6065] hover:text-[#226192] inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
