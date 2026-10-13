"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Automatically login user
        const loginRes = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (loginRes.ok) {
          router.push("/account");
        } else {
          router.push("/login");
        }
      } else {
        setStatus("error");
        setErrorMessage(data.error?.message || "Registration failed. Please check requirements.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
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
            Create Atelier Account
          </h1>
          <p className="text-xs text-[#5A6065]">
            Enjoy curated private trunk shows, faster checkout, and personalized bridal styling.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1D20]">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Radhika Sharma"
              className="w-full px-3.5 py-2.5 text-xs bg-[#FDFBF7] border border-[#E2DDD3] rounded-xs outline-none focus:border-[#226192] text-[#1A1D20]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1D20]">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. radhika@domain.com"
              className="w-full px-3.5 py-2.5 text-xs bg-[#FDFBF7] border border-[#E2DDD3] rounded-xs outline-none focus:border-[#226192] text-[#1A1D20]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#1A1D20]">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters with 1 number"
                className="w-full px-3.5 py-2.5 text-xs bg-[#FDFBF7] border border-[#E2DDD3] rounded-xs outline-none focus:border-[#226192] text-[#1A1D20] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#5A6065] hover:text-[#1A1D20]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-[#5A6065]">
              Must contain at least 8 characters, one uppercase letter, and one number.
            </p>
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-[#226192] hover:bg-[#164366] text-white py-3 rounded-xs text-xs font-semibold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {status === "loading" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Register Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-[#5A6065] pt-2 border-t border-[#E2DDD3]/60">
          <span>Already registered? </span>
          <Link href="/login" className="text-[#226192] font-semibold hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
