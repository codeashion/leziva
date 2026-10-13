"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Banknote,
  Printer,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderDetail {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingFee: number;
  codFee: number;
  totalAmount: number;
  currency: string;
  shippingAddressSnapshot: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    landmark?: string | null;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: Array<{
    id: string;
    productTitle: string;
    variantTitle: string;
    sku: string;
    selectedSize?: string | null;
    selectedColor?: string | null;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }>;
  payments: Array<{
    gateway: string;
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
    status: string;
    amount: number;
    verifiedAt?: string | null;
  }>;
}

interface OrderConfirmationClientProps {
  orderNumber: string;
}

export function OrderConfirmationClient({ orderNumber }: OrderConfirmationClientProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/v1/orders/${orderNumber}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setOrder(data.data);
        } else {
          setError(data.error?.message || "Order details could not be retrieved");
        }
      } catch {
        setError("Network error connecting to atelier order services");
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
  }, [orderNumber]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-[#226192] animate-spin" />
        <p className="font-serif text-[#5A6065] text-sm">Verifying atelier order credentials...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#FEE4E2] flex items-center justify-center text-[#B42318]">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl text-[#1A1D20]">Order Not Found</h1>
        <p className="text-[#5A6065] text-sm">{error || "Unable to locate this order reference."}</p>
        <Button variant="primary" asChild className="bg-[#226192] hover:bg-[#164366] text-white">
          <Link href="/shop">Return to Storefront</Link>
        </Button>
      </div>
    );
  }

  const isPaid = order.paymentStatus === "CAPTURED" || order.paymentStatus === "AUTHORIZED";
  const isCod = order.paymentMethod === "COD";

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Celebration Banner */}
        <div className="bg-white p-8 sm:p-12 rounded-xs border border-[#E2DDD3] shadow-xs text-center space-y-4 relative overflow-hidden">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#EAE6DE] flex items-center justify-center text-[#226192] shadow-xs">
            <CheckCircle2 className="w-9 h-9 fill-[#226192] text-white" />
          </div>

          <div className="space-y-1">
            <span className="text-xs uppercase tracking-widest text-[#EF8557] font-semibold">
              {isCod ? "Cash on Delivery Reserved" : isPaid ? "Payment Verified & Order Confirmed" : "Order Placed (Pending Payment)"}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1D20]">
              Thank You for Your Order
            </h1>
          </div>

          <p className="text-sm text-[#5A6065] max-w-lg mx-auto">
            Your haute couture ensemble has been registered at the LEZIVA Atelier. Our master craftsmen will begin bespoke curation immediately.
          </p>

          <div className="inline-flex items-center gap-2 bg-[#F9F7F3] px-4 py-2 rounded-xs border border-[#E2DDD3] text-sm">
            <span className="text-[#5A6065]">Order Reference:</span>
            <strong className="text-[#226192] font-mono tracking-wider text-base">{order.orderNumber}</strong>
          </div>
        </div>

        {/* Order Lifecycle Progress Tracker */}
        <div className="bg-white p-6 sm:p-8 rounded-xs border border-[#E2DDD3] shadow-xs space-y-4">
          <h2 className="font-serif text-base text-[#1A1D20] pb-2 border-b border-[#E2DDD3]">
            Atelier Fulfillment Timeline
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#226192]">
                <CheckCircle2 className="w-4 h-4" /> 1. Order Placed
              </div>
              <p className="text-[11px] text-[#5A6065]">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#226192]">
                <CheckCircle2 className="w-4 h-4" /> 2. {isCod ? "COD Confirmed" : "Payment Verified"}
              </div>
              <p className="text-[11px] text-emerald-700 font-medium">{isCod ? "Pending Delivery" : isPaid ? "Verified" : "Pending"}</p>
            </div>

            <div className="space-y-1 text-center sm:text-left opacity-75">
              <div className="flex items-center gap-2 text-xs font-medium text-[#1A1D20]">
                <Package className="w-4 h-4 text-[#5A6065]" /> 3. Atelier Crafting
              </div>
              <p className="text-[11px] text-[#5A6065]">Quality inspection</p>
            </div>

            <div className="space-y-1 text-center sm:text-left opacity-60">
              <div className="flex items-center gap-2 text-xs font-medium text-[#1A1D20]">
                <Truck className="w-4 h-4 text-[#5A6065]" /> 4. Express Dispatch
              </div>
              <p className="text-[11px] text-[#5A6065]">Velocity Logistics</p>
            </div>
          </div>
        </div>

        {/* Details Grid: Items Ordered & Delivery/Payment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Items & Financial Breakdown */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-xs border border-[#E2DDD3] shadow-xs space-y-6">
            <h2 className="font-serif text-lg text-[#1A1D20] pb-3 border-b border-[#E2DDD3]">
              Ensemble Details
            </h2>

            <div className="divide-y divide-[#E2DDD3]/60 space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="pt-4 first:pt-0 flex items-start justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-sm text-[#1A1D20]">{item.productTitle}</p>
                    <p className="text-[#5A6065]">{item.variantTitle}</p>
                    <div className="flex gap-3 text-[11px] text-[#5A6065] pt-0.5">
                      <span>Size: <strong>{item.selectedSize || "Standard"}</strong></span>
                      <span>Qty: <strong>{item.quantity}</strong></span>
                      <span>SKU: <strong className="font-mono">{item.sku}</strong></span>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-semibold text-sm text-[#1A1D20]">
                      ₹{item.totalPrice.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[11px] text-[#5A6065]">
                      (₹{item.unitPrice.toLocaleString("en-IN")} each)
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-[#E2DDD3] space-y-2 text-xs">
              <div className="flex justify-between text-[#5A6065]">
                <span>Item Subtotal</span>
                <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-[#226192] font-semibold">
                  <span>Privilege Discount</span>
                  <span>-₹{order.discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between text-[#5A6065]">
                <span>Taxes (5% Apparel GST)</span>
                <span>₹{order.taxAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between text-[#5A6065]">
                <span>Express Atelier Shipping</span>
                <span>{order.shippingFee === 0 ? "Complimentary" : `₹${order.shippingFee.toLocaleString("en-IN")}`}</span>
              </div>

              {order.codFee > 0 && (
                <div className="flex justify-between text-[#5A6065]">
                  <span>COD Convenience Fee</span>
                  <span>₹{order.codFee.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="pt-3 border-t-2 border-[#1A1D20] flex justify-between items-baseline font-serif">
                <span className="text-base text-[#1A1D20] font-semibold">Total Amount</span>
                <span className="text-2xl text-[#226192] font-semibold">
                  ₹{order.totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Snapshot & Payment Details */}
          <div className="lg:col-span-5 space-y-6">
            {/* Delivery Snapshot */}
            <div className="bg-white p-6 rounded-xs border border-[#E2DDD3] shadow-xs space-y-3">
              <h3 className="font-serif text-sm uppercase tracking-wider text-[#1A1D20] flex items-center gap-2 pb-2 border-b border-[#E2DDD3]">
                <MapPin className="w-4 h-4 text-[#226192]" /> Delivery Address Snapshot
              </h3>
              <div className="text-xs text-[#5A6065] leading-relaxed">
                <p className="font-semibold text-sm text-[#1A1D20]">
                  {order.shippingAddressSnapshot.fullName}
                </p>
                <p>{order.shippingAddressSnapshot.addressLine1}</p>
                {order.shippingAddressSnapshot.addressLine2 && (
                  <p>{order.shippingAddressSnapshot.addressLine2}</p>
                )}
                <p>
                  {order.shippingAddressSnapshot.city}, {order.shippingAddressSnapshot.state} - <strong>{order.shippingAddressSnapshot.pincode}</strong>
                </p>
                <p className="text-[#1A1D20] font-medium pt-1">
                  Contact: {order.shippingAddressSnapshot.phone}
                </p>
              </div>
            </div>

            {/* Payment Record */}
            <div className="bg-white p-6 rounded-xs border border-[#E2DDD3] shadow-xs space-y-3">
              <h3 className="font-serif text-sm uppercase tracking-wider text-[#1A1D20] flex items-center gap-2 pb-2 border-b border-[#E2DDD3]">
                {isCod ? <Banknote className="w-4 h-4 text-[#EF8557]" /> : <CreditCard className="w-4 h-4 text-[#226192]" />}
                Payment Verification
              </h3>
              <div className="text-xs space-y-1.5 text-[#5A6065]">
                <div className="flex justify-between">
                  <span>Method:</span>
                  <strong className="text-[#1A1D20]">{order.paymentMethod === "RAZORPAY" ? "Razorpay Online" : "Cash on Delivery (COD)"}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Payment Status:</span>
                  <span className={`font-semibold ${isPaid ? "text-emerald-700" : isCod ? "text-[#EF8557]" : "text-amber-700"}`}>
                    {order.paymentStatus}
                  </span>
                </div>
                {order.payments[0]?.razorpayPaymentId && (
                  <div className="flex justify-between">
                    <span>Transaction Ref:</span>
                    <span className="font-mono text-[#1A1D20]">{order.payments[0].razorpayPaymentId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Velocity Shipping Live Tracking Widget */}
            <div className="bg-[#FAF8F5] p-5 rounded-xs border border-[#E2DDD3] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif text-xs uppercase tracking-wider text-[#1A1D20] flex items-center gap-1.5 font-semibold">
                  <Truck className="w-4 h-4 text-[#226192]" /> Velocity Express Delivery
                </span>
                <span className="px-2 py-0.5 bg-[#226192]/10 text-[#226192] text-[10px] font-semibold rounded-full uppercase">
                  Complimentary
                </span>
              </div>
              <p className="text-xs text-[#5A6065] leading-relaxed">
                Your order is manifested with Velocity Shipping. Track live carriage milestones from our Surat atelier directly to your address.
              </p>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full border-[#226192] text-[#226192] hover:bg-[#226192] hover:text-white transition-all text-xs font-medium"
              >
                <Link href={`/track?orderNumber=${encodeURIComponent(order.orderNumber)}`}>
                  <span>Track Consignment Milestones</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 border-[#E2DDD3] text-[#1A1D20]"
              >
                <Printer className="w-4 h-4" /> Print Atelier Receipt
              </Button>

              <Button
                variant="primary"
                size="md"
                asChild
                className="w-full bg-[#226192] hover:bg-[#164366] text-white flex items-center justify-center gap-2"
              >
                <Link href="/shop">
                  <span>Explore More Collections</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
