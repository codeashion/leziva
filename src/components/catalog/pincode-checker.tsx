"use client";

import React, { useState } from "react";
import { Truck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function PincodeChecker() {
  const [pincode, setPincode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [data, setData] = useState<{
    estimatedDelivery?: string;
    codAvailable?: boolean;
    shippingCarrier?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode.trim())) {
      setStatus("error");
      setErrorMsg("Please enter a valid 6-digit Indian PIN code.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/v1/pincode/check?pincode=${pincode.trim()}`);
      const json = await res.json();

      if (res.ok) {
        setStatus("success");
        setData(json.data);
      } else {
        setStatus("error");
        setErrorMsg(json.error?.message || "PIN code is currently unserviceable.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Failed to check delivery serviceability. Please try again.");
    }
  };

  return (
    <div className="border border-[#E2DDD3] rounded-xs p-4 bg-[#FDFBF7] space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1A1D20]">
        <Truck className="w-4 h-4 text-[#226192]" />
        <span>Check Atelier Delivery &amp; COD</span>
      </div>

      <form onSubmit={handleCheck} className="flex gap-2">
        <input
          type="text"
          maxLength={6}
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
          placeholder="Enter 6-digit PIN code (e.g. 400001)"
          className="flex-1 px-3 py-2 text-xs bg-white border border-[#E2DDD3] rounded-xs outline-none focus:border-[#226192] text-[#1A1D20]"
          aria-label="Indian PIN code"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-[#226192] hover:bg-[#164366] text-white px-4 py-2 text-xs font-medium uppercase tracking-wider rounded-xs transition-colors disabled:opacity-50"
        >
          {status === "loading" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            "Verify"
          )}
        </button>
      </form>

      {status === "success" && data && (
        <div className="text-xs text-[#1A1D20] space-y-1.5 pt-1 border-t border-[#E2DDD3]/50">
          <p className="text-emerald-700 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Serviceable via {data.shippingCarrier || "Velocity Express Partner"}</span>
          </p>
          <p className="text-[#5A6065]">
            Estimated Delivery: <strong className="text-[#1A1D20]">{data.estimatedDelivery}</strong>
          </p>
          <p className="text-[#5A6065]">
            Cash on Delivery:{" "}
            {data.codAvailable ? (
              <span className="text-emerald-700 font-medium">Available (Verified)</span>
            ) : (
              <span className="text-amber-700 font-medium">Prepaid Only</span>
            )}
          </p>
        </div>
      )}

      {status === "error" && (
        <p className="text-xs text-[#D92D20] flex items-center gap-1.5 pt-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </p>
      )}
    </div>
  );
}
