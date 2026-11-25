"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "@/context/StoreContext";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { LUXURY_EASE } from "@/lib/animations";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    cartSubtotal,
    discountAmount,
    taxAmount,
    cartTotal,
    appliedCoupon,
    createOrder,
    showToast,
  } = useStore();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address Form State
  const [address, setAddress] = useState({
    fullName: "Riya Sharma",
    email: "riya.sharma@example.com",
    phone: "9876543210",
    addressLine1: "15A, Heritage Greens, Near Lotus Temple",
    addressLine2: "Block B, Flat 402",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110019",
  });

  // Shipping Method
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "card" | "cod">("razorpay");

  const shippingCost = shippingMethod === "express" ? 99 : 0;
  const finalPayable = cartTotal + shippingCost;

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName || !address.phone || !address.addressLine1 || !address.city || !address.pincode) {
      showToast("Please fill all required delivery details", "error");
      return;
    }
    setActiveStep(2);
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);

    try {
      // Simulate fast secure server-verified order
      const newOrder = createOrder({
        customer: address,
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.product.images[0],
          color: item.selectedColor,
          size: item.selectedSize,
          price: item.product.price,
          quantity: item.quantity,
        })),
        subtotal: cartSubtotal,
        discount: discountAmount,
        couponCode: appliedCoupon?.code,
        shippingFee: shippingCost,
        tax: taxAmount,
        total: finalPayable,
        shippingMethod,
        paymentMethod,
        paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
        orderStatus: "Processing",
        estimatedDelivery: "3-5 Business Days",
      });

      showToast("Payment verified! Order placed successfully.", "success");
      router.push(`/order-confirmation/${newOrder.id}`);
    } catch {
      showToast("Error processing order. Please try again.", "error");
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="bg-[#EAE6DE] min-h-screen py-20 px-4">
        <div className="max-w-md mx-auto bg-[#F8F5EF] p-8 rounded-3xl border border-[#DED6CB] text-center space-y-4 shadow-lg">
          <ShoppingBag className="w-12 h-12 text-[#77716A] mx-auto opacity-50" />
          <h2 className="font-serif text-2xl font-bold text-[#102B3A]">No Items in Bag</h2>
          <p className="text-xs text-[#77716A]">Your shopping bag is currently empty.</p>
          <Link
            href="/collections"
            className="inline-block px-6 py-2.5 bg-[#EF8557] text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md"
          >
            Explore Couture
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#EAE6DE] min-h-screen pb-24">
      {/* Checkout Header */}
      <div className="bg-[#F8F5EF] border-b border-[#DED6CB] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-bold tracking-[0.2em] text-[#102B3A]">
            BRAND
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-[#77716A]">
            <Lock className="w-3.5 h-3.5 text-[#168454]" />
            <span className="font-semibold text-[#168454]">256-Bit Encrypted Secure Checkout</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* 3-Step Progress Indicator */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 inset-x-0 h-0.5 bg-[#DED6CB] -translate-y-1/2 z-0" />

            {/* Step 1 */}
            <div
              className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer"
              onClick={() => setActiveStep(1)}
            >
              <motion.div
                animate={{ scale: activeStep === 1 ? 1.1 : 1 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  activeStep >= 1
                    ? "bg-[#102B3A] text-white"
                    : "bg-[#F8F5EF] text-[#77716A] border border-[#DED6CB]"
                }`}
              >
                1
              </motion.div>
              <span className="text-[11px] font-semibold text-[#102B3A]">Address</span>
            </div>

            {/* Step 2 */}
            <div
              className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer"
              onClick={() => setActiveStep(2)}
            >
              <motion.div
                animate={{ scale: activeStep === 2 ? 1.1 : 1 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  activeStep >= 2
                    ? "bg-[#102B3A] text-white"
                    : "bg-[#F8F5EF] text-[#77716A] border border-[#DED6CB]"
                }`}
              >
                2
              </motion.div>
              <span className="text-[11px] font-semibold text-[#102B3A]">Shipping</span>
            </div>

            {/* Step 3 */}
            <div
              className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer"
              onClick={() => setActiveStep(3)}
            >
              <motion.div
                animate={{ scale: activeStep === 3 ? 1.1 : 1 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  activeStep === 3
                    ? "bg-[#EF8557] text-white"
                    : "bg-[#F8F5EF] text-[#77716A] border border-[#DED6CB]"
                }`}
              >
                3
              </motion.div>
              <span className="text-[11px] font-semibold text-[#102B3A]">Payment</span>
            </div>
          </div>
        </div>

        {/* Main Checkout Form + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Checkout Steps Panel with AnimatePresence */}
          <div className="lg:col-span-7 bg-[#F8F5EF] p-6 sm:p-9 rounded-3xl border border-[#DED6CB] shadow-lg">
            <AnimatePresence mode="wait">
              {/* STEP 1: DELIVERY ADDRESS */}
              {activeStep === 1 && (
                <motion.form
                  key="step-1"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.35, ease: LUXURY_EASE }}
                  onSubmit={handleAddressSubmit}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#DED6CB]">
                    <h2 className="font-serif text-xl font-bold text-[#102B3A]">
                      1. Shipping & Delivery Address
                    </h2>
                    <span className="text-xs text-[#77716A]">* Required</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[#171717] block mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={address.fullName}
                        onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-[#DED6CB] rounded-xl text-xs text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#EF8557]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#171717] block mb-1">
                        Mobile Phone (+91) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={address.phone}
                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-[#DED6CB] rounded-xl text-xs text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#EF8557]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#171717] block mb-1">
                      Email Address (For Tracking & Invoice) *
                    </label>
                    <input
                      type="email"
                      required
                      value={address.email}
                      onChange={(e) => setAddress({ ...address, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DED6CB] rounded-xl text-xs text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#EF8557]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#171717] block mb-1">
                      Address Line 1 (House/Flat No, Apartment, Street) *
                    </label>
                    <input
                      type="text"
                      required
                      value={address.addressLine1}
                      onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DED6CB] rounded-xl text-xs text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#EF8557]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#171717] block mb-1">
                      Address Line 2 (Area, Landmark - Optional)
                    </label>
                    <input
                      type="text"
                      value={address.addressLine2}
                      onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#DED6CB] rounded-xl text-xs text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#EF8557]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[#171717] block mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-[#DED6CB] rounded-xl text-xs text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#EF8557]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#171717] block mb-1">
                        State *
                      </label>
                      <select
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-[#DED6CB] rounded-xl text-xs text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#EF8557]"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#171717] block mb-1">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={address.pincode}
                        onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-[#DED6CB] rounded-xl text-xs text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#EF8557]"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="px-8 py-3.5 bg-[#EF8557] hover:bg-[#DF7446] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Shipping</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.form>
              )}

              {/* STEP 2: SHIPPING METHOD */}
              {activeStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.35, ease: LUXURY_EASE }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#DED6CB]">
                    <h2 className="font-serif text-xl font-bold text-[#102B3A]">
                      2. Select Shipping Method
                    </h2>
                    <button
                      onClick={() => setActiveStep(1)}
                      className="text-xs text-[#EF8557] font-semibold underline cursor-pointer"
                    >
                      Edit Address
                    </button>
                  </div>

                  {/* Address Summary Badge */}
                  <div className="p-4 bg-[#EAE6DE] rounded-2xl text-xs text-[#171717] space-y-0.5">
                    <p className="font-bold">{address.fullName} ({address.phone})</p>
                    <p className="text-[#77716A]">
                      {address.addressLine1}, {address.city}, {address.state} - {address.pincode}
                    </p>
                  </div>

                  {/* Shipping Radio Options */}
                  <div className="space-y-3">
                    <label
                      onClick={() => setShippingMethod("standard")}
                      className={`flex items-center justify-between p-4.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        shippingMethod === "standard"
                          ? "border-[#102B3A] bg-white shadow-sm"
                          : "border-[#DED6CB] bg-[#F8F5EF]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={shippingMethod === "standard"}
                          onChange={() => setShippingMethod("standard")}
                          className="accent-[#102B3A]"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#102B3A]">Standard Delivery (3-5 Days)</p>
                          <p className="text-[11px] text-[#77716A]">Safe insured logistics across all Indian pincodes</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-green-700">FREE</span>
                    </label>

                    <label
                      onClick={() => setShippingMethod("express")}
                      className={`flex items-center justify-between p-4.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        shippingMethod === "express"
                          ? "border-[#102B3A] bg-white shadow-sm"
                          : "border-[#DED6CB] bg-[#F8F5EF]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={shippingMethod === "express"}
                          onChange={() => setShippingMethod("express")}
                          className="accent-[#102B3A]"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#102B3A]">Express Priority Air (1-2 Days)</p>
                          <p className="text-[11px] text-[#77716A]">Fast-track dispatch with BlueDart Priority</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#102B3A]">₹99</span>
                    </label>
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    <button
                      onClick={() => setActiveStep(1)}
                      className="text-xs font-semibold text-[#77716A] hover:text-[#102B3A] cursor-pointer"
                    >
                      ← Back to Address
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveStep(3)}
                      className="px-8 py-3.5 bg-[#EF8557] hover:bg-[#DF7446] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <span>Proceed to Payment</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: PAYMENT METHOD */}
              {activeStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.35, ease: LUXURY_EASE }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#DED6CB]">
                    <h2 className="font-serif text-xl font-bold text-[#102B3A]">
                      3. Payment Method
                    </h2>
                    <span className="text-xs text-[#168454] font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Razorpay Verified
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Razorpay UPI */}
                    <label
                      onClick={() => setPaymentMethod("razorpay")}
                      className={`flex items-start justify-between p-4.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        paymentMethod === "razorpay"
                          ? "border-[#102B3A] bg-white shadow-sm ring-1 ring-[#102B3A]"
                          : "border-[#DED6CB] bg-[#F8F5EF]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          checked={paymentMethod === "razorpay"}
                          onChange={() => setPaymentMethod("razorpay")}
                          className="mt-0.5 accent-[#102B3A]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-[#102B3A]">
                              Razorpay (UPI, Google Pay, PhonePe, Paytm, NetBanking)
                            </p>
                            <span className="text-[10px] bg-[#EF8557]/15 text-[#EF8557] font-bold px-1.5 py-0.5 rounded">
                              Recommended
                            </span>
                          </div>
                          <p className="text-[11px] text-[#77716A] mt-1">
                            Instant zero-fee transfer via any Indian UPI app or bank account.
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Credit / Debit Card */}
                    <label
                      onClick={() => setPaymentMethod("card")}
                      className={`flex items-start justify-between p-4.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        paymentMethod === "card"
                          ? "border-[#102B3A] bg-white shadow-sm ring-1 ring-[#102B3A]"
                          : "border-[#DED6CB] bg-[#F8F5EF]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          checked={paymentMethod === "card"}
                          onChange={() => setPaymentMethod("card")}
                          className="mt-0.5 accent-[#102B3A]"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#102B3A]">
                            Credit or Debit Card (Visa, Mastercard, RuPay, Amex)
                          </p>
                          <p className="text-[11px] text-[#77716A] mt-1">
                            International and Indian bank cards with 3D Secure OTP authentication.
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Cash on Delivery */}
                    <label
                      onClick={() => setPaymentMethod("cod")}
                      className={`flex items-start justify-between p-4.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        paymentMethod === "cod"
                          ? "border-[#102B3A] bg-white shadow-sm ring-1 ring-[#102B3A]"
                          : "border-[#DED6CB] bg-[#F8F5EF]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          checked={paymentMethod === "cod"}
                          onChange={() => setPaymentMethod("cod")}
                          className="mt-0.5 accent-[#102B3A]"
                        />
                        <div>
                          <p className="text-xs font-bold text-[#102B3A]">
                            Cash on Delivery (Pay upon arrival)
                          </p>
                          <p className="text-[11px] text-[#77716A] mt-1">
                            Pay cash or via UPI QR code directly to the courier agent upon doorstep delivery.
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="pt-4 space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePlaceOrder}
                      disabled={isSubmitting}
                      className="w-full py-4 bg-[#EF8557] hover:bg-[#DF7446] disabled:opacity-50 text-white font-medium text-xs sm:text-sm tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-[#EF8557]/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {isSubmitting
                          ? "Verifying Payment..."
                          : `Pay ₹${finalPayable.toLocaleString("en-IN")} & Confirm Order`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>

                    <p className="text-[11px] text-[#77716A] text-center">
                      By clicking &ldquo;Pay & Confirm Order&rdquo;, you agree to our Terms of Sale and 7-day return policy.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Summary Panel */}
          <div className="lg:col-span-5 bg-[#F8F5EF] p-6 sm:p-7 rounded-3xl border border-[#DED6CB] shadow-md space-y-6 sticky top-28">
            <h3 className="font-serif text-lg font-bold text-[#102B3A] pb-3 border-b border-[#DED6CB]">
              Bag Overview ({cart.length} creations)
            </h3>

            <div className="divide-y divide-[#DED6CB] max-h-60 overflow-y-auto pr-1">
              {cart.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center gap-3">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-12 h-14 object-cover rounded-lg border border-[#DED6CB]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#102B3A] truncate">{item.product.name}</p>
                    <p className="text-[11px] text-[#77716A]">
                      Qty: {item.quantity} • {item.selectedColor} • {item.selectedSize}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#102B3A]">
                    ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs text-[#77716A] pt-4 border-t border-[#DED6CB]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-[#171717] font-semibold">
                  ₹{cartSubtotal.toLocaleString("en-IN")}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>Voucher ({appliedCoupon?.code})</span>
                  <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping ({shippingMethod === "express" ? "Express" : "Standard"})</span>
                <span>
                  {shippingCost === 0 ? (
                    <span className="text-green-700 font-semibold">FREE</span>
                  ) : (
                    `₹${shippingCost}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span>₹{taxAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#102B3A] pt-3 border-t border-[#DED6CB]">
                <span>Grand Total</span>
                <span className="font-serif text-xl">₹{finalPayable.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
