"use client";

import React, { useEffect, use } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Printer,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface OrderConfirmationProps {
  params: Promise<{ orderId: string }>;
}

export default function OrderConfirmationPage({ params }: OrderConfirmationProps) {
  const { orderId } = use(params);
  const { orders, brandConfig } = useStore();

  const order = orders.find((o) => o.id === orderId) || orders[0];

  useEffect(() => {
    // Launch festive gold and coral confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#EF8557", "#102B3A", "#C89B53", "#168454", "#F8F5EF"],
      });
    } catch {}
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-[#EAE6DE] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Success Header Card */}
        <div className="bg-[#F8F5EF] p-8 sm:p-10 rounded-2xl border border-[#DED6CB] shadow-lg text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#168454]/15 border border-[#168454] flex items-center justify-center mx-auto text-[#168454]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#EF8557] block">
            ORDER CONFIRMED
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#102B3A]">
            Thank You for Your Order!
          </h1>

          <p className="text-sm text-[#77716A] max-w-md mx-auto">
            Your payment has been verified. We are preparing your heirloom garment with authentic packaging at our artisan atelier.
          </p>

          <div className="pt-2 inline-flex items-center gap-3 bg-[#EAE6DE] px-4 py-2 rounded-lg text-xs">
            <span className="text-[#77716A]">Order ID:</span>
            <strong className="text-[#102B3A] font-serif text-sm">{order?.orderNumber || "#1248"}</strong>
            <span className="text-[#DED6CB]">|</span>
            <span className="text-[#168454] font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Razorpay Verified
            </span>
          </div>
        </div>

        {/* Tracking & Timeline Card */}
        <div className="bg-[#F8F5EF] p-6 sm:p-8 rounded-2xl border border-[#DED6CB] shadow-sm space-y-6">
          <h2 className="font-serif text-lg font-bold text-[#102B3A] flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#EF8557]" />
            <span>Delivery Timeline & Tracking</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-white rounded-xl border border-[#DED6CB]">
              <p className="text-[#77716A]">Current Status</p>
              <p className="text-sm font-bold text-[#102B3A] mt-1">{order?.orderStatus || "Processing"}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#DED6CB]">
              <p className="text-[#77716A]">Estimated Arrival</p>
              <p className="text-sm font-bold text-[#102B3A] mt-1">3 - 5 Business Days</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#DED6CB]">
              <p className="text-[#77716A]">Courier Partner</p>
              <p className="text-sm font-bold text-[#102B3A] mt-1">
                {order?.trackingNumber ? `BlueDart (${order.trackingNumber})` : "Insured Express Dispatch"}
              </p>
            </div>
          </div>
        </div>

        {/* Itemised Order Snapshot */}
        {order && (
          <div className="bg-[#F8F5EF] p-6 sm:p-8 rounded-2xl border border-[#DED6CB] shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#DED6CB]">
              <h3 className="font-serif text-lg font-bold text-[#102B3A] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#102B3A]" />
                <span>Garments in this Order</span>
              </h3>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 text-xs text-[#226192] hover:text-[#102B3A] font-semibold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>

            <div className="divide-y divide-[#DED6CB]">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-4 flex gap-4 items-center">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-16 h-20 object-cover rounded-lg border border-[#DED6CB]"
                  />
                  <div className="flex-1">
                    <h4 className="font-serif text-sm font-bold text-[#102B3A]">
                      {item.productName}
                    </h4>
                    <p className="text-xs text-[#77716A] mt-0.5">
                      Color: {item.color} • Size: {item.size} • Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="font-serif text-sm font-bold text-[#102B3A]">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            {/* Address & Payment Info */}
            <div className="pt-4 border-t border-[#DED6CB] grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div>
                <p className="font-bold text-[#102B3A] mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#EF8557]" /> Delivery Address:
                </p>
                <p className="text-[#171717]">{order.customer.fullName}</p>
                <p className="text-[#77716A]">{order.customer.phone}</p>
                <p className="text-[#77716A]">
                  {order.customer.addressLine1}, {order.customer.city}, {order.customer.state} - {order.customer.pincode}
                </p>
              </div>

              <div>
                <p className="font-bold text-[#102B3A] mb-1">Billing Summary:</p>
                <div className="space-y-1 text-[#77716A]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Discount</span>
                      <span>-₹{order.discount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#102B3A] pt-1 border-t border-[#DED6CB]">
                    <span>Total Paid</span>
                    <span>₹{order.total.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="text-center pt-4">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#EF8557] hover:bg-[#DF7446] text-white font-medium text-xs sm:text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
