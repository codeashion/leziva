"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  LogOut,
  Package,
  MapPin,
  Heart,
  Loader2,
  Sparkles,
  ExternalLink,
  Ban,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserProfileData {
  id: string;
  name: string | null;
  email: string;
  roles: string[];
  status: string;
  createdAt: string;
}

interface CustomerOrder {
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
  totalAmount: number;
  items: Array<{
    id: string;
    productTitle: string;
    variantTitle: string;
    selectedSize?: string | null;
    selectedColor?: string | null;
    quantity: number;
    totalPrice: number;
  }>;
  shippingAddressSnapshot: {
    fullName: string;
    city: string;
    state: string;
    pincode: string;
  };
}

interface CustomerAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  addressLabel?: string | null;
  isDefaultShipping: boolean;
}

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "addresses">("overview");

  // Orders State
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [cancellingOrderNumber, setCancellingOrderNumber] = useState<string | null>(null);
  const [cancelFeedback, setCancelFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // Addresses State
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isAddressesLoading, setIsAddressesLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const json = await res.json();
          setProfile(json.data);
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Fetch Orders when tab selected
  useEffect(() => {
    if (activeTab === "orders" && profile) {
      async function loadOrders() {
        setIsOrdersLoading(true);
        try {
          const res = await fetch("/api/v1/orders");
          if (res.ok) {
            const data = await res.json();
            setOrders(data.data || []);
          }
        } catch {
          // ignore
        } finally {
          setIsOrdersLoading(false);
        }
      }
      loadOrders();
    }
  }, [activeTab, profile]);

  // Fetch Addresses when tab selected
  useEffect(() => {
    if (activeTab === "addresses" && profile) {
      async function loadAddresses() {
        setIsAddressesLoading(true);
        try {
          const res = await fetch("/api/v1/addresses");
          if (res.ok) {
            const data = await res.json();
            setAddresses(data.data || []);
          }
        } catch {
          // ignore
        } finally {
          setIsAddressesLoading(false);
        }
      }
      loadAddresses();
    }
  }, [activeTab, profile]);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {
      // logout error
    } finally {
      setProfile(null);
      router.push("/login");
    }
  };

  const handleCancelOrder = async (orderNumber: string) => {
    const reason = prompt("Please state the reason for cancellation request:") || "Customer cancellation request";
    setCancellingOrderNumber(orderNumber);
    setCancelFeedback(null);

    try {
      const res = await fetch(`/api/v1/orders/${orderNumber}/cancel-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCancelFeedback({ message: `Order #${orderNumber} has been successfully cancelled.`, isError: false });
        // Update local state
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === orderNumber ? { ...o, status: "CANCELLED" } : o))
        );
      } else {
        setCancelFeedback({ message: data.error?.message || "Failed to cancel order", isError: true });
      }
    } catch {
      setCancelFeedback({ message: "Network error during cancellation", isError: true });
    } finally {
      setCancellingOrderNumber(null);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Are you sure you want to remove this saved address?")) return;
    try {
      const res = await fetch(`/api/v1/addresses/${addressId}`, { method: "DELETE" });
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== addressId));
      }
    } catch {
      // ignore
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#226192] animate-spin" />
      </div>
    );
  }

  // Guest State: Prompts to sign in or register
  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#EAE6DE] text-[#226192] flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-normal text-[#1A1D20]">
            Atelier Customer Access
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6065] max-w-md mx-auto">
            Please sign in to access your saved bespoke orders, atelier sizing profiles, and private lookbook privileges.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Button variant="primary" size="lg" asChild>
            <Link href="/login">Sign In to Account</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/register">Create New Account</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">Pending Payment</span>;
      case "PAYMENT_CONFIRMED":
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">Payment Confirmed</span>;
      case "PROCESSING":
      case "PACKED":
        return <span className="bg-sky-100 text-sky-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-sky-200">In Atelier Crafting</span>;
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-purple-200">Dispatched</span>;
      case "DELIVERED":
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">Delivered</span>;
      case "CANCELLED":
        return <span className="bg-gray-100 text-gray-700 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-gray-300">Cancelled</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Account Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2DDD3] gap-4">
        <div className="space-y-1">
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#226192]">
            Patron Account
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1A1D20] font-normal">
            Welcome, {profile.name || "Esteemed Patron"}
          </h1>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5A6065] hover:text-[#1A1D20] transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {cancelFeedback && (
        <div
          className={`p-4 rounded-xs border text-xs flex items-center gap-2 ${
            cancelFeedback.isError
              ? "bg-[#FEE4E2] border-[#FECDCA] text-[#B42318]"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {cancelFeedback.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{cancelFeedback.message}</span>
        </div>
      )}

      {/* Main Grid: Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Navigation */}
        <div className="lg:col-span-3 space-y-1 bg-white border border-[#E2DDD3] rounded-xs p-2 text-xs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xs font-semibold transition-colors text-left ${
              activeTab === "overview"
                ? "bg-[#226192] text-white"
                : "text-[#1A1D20] hover:bg-[#EAE6DE]/50"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xs font-semibold transition-colors text-left ${
              activeTab === "orders"
                ? "bg-[#226192] text-white"
                : "text-[#1A1D20] hover:bg-[#EAE6DE]/50"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders &amp; Invoices</span>
          </button>

          <button
            onClick={() => setActiveTab("addresses")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xs font-semibold transition-colors text-left ${
              activeTab === "addresses"
                ? "bg-[#226192] text-white"
                : "text-[#1A1D20] hover:bg-[#EAE6DE]/50"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Addresses</span>
          </button>

          <Link
            href="/wishlist"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xs font-semibold text-[#1A1D20] hover:bg-[#EAE6DE]/50 transition-colors text-left"
          >
            <Heart className="w-4 h-4 text-[#EF8557]" />
            <span>My Wishlist</span>
          </Link>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-9">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E2DDD3] rounded-xs p-6 space-y-4">
                <h3 className="font-serif text-lg font-semibold text-[#1A1D20] border-b border-[#E2DDD3] pb-3">
                  Account Credentials &amp; Tier
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#5A6065] block">Full Name</span>
                    <strong className="text-sm text-[#1A1D20]">{profile.name || "Not specified"}</strong>
                  </div>
                  <div>
                    <span className="text-[#5A6065] block">Email Address</span>
                    <strong className="text-sm text-[#1A1D20]">{profile.email}</strong>
                  </div>
                  <div>
                    <span className="text-[#5A6065] block">Account Status</span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      {profile.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5A6065] block">Membership Role</span>
                    <span className="font-semibold text-[#226192]">
                      {profile.roles.join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#EAE6DE]/30 border border-[#E2DDD3] rounded-xs p-6 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#EF8557]" />
                  <h4 className="font-serif text-sm font-semibold text-[#1A1D20]">
                    Atelier Concierge Privileges
                  </h4>
                </div>
                <p className="text-xs text-[#5A6065] leading-relaxed">
                  As an active LEZIVA member, you have access to bespoke tailoring consultations and priority reservations for handwoven festive capsules.
                </p>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-4">
              {isOrdersLoading ? (
                <div className="bg-white border border-[#E2DDD3] rounded-xs p-12 text-center">
                  <Loader2 className="w-6 h-6 text-[#226192] animate-spin mx-auto mb-2" />
                  <p className="text-xs text-[#5A6065]">Loading your bespoke orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white border border-[#E2DDD3] rounded-xs p-8 text-center space-y-4">
                  <Package className="w-10 h-10 text-[#5A6065]/40 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg font-medium text-[#1A1D20]">
                      No Orders Placed Yet
                    </h3>
                    <p className="text-xs text-[#5A6065] max-w-sm mx-auto">
                      Explore our handloom sarees and couture lehengas to place your maiden ensemble order.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" asChild className="bg-[#226192] hover:bg-[#164366] text-white">
                    <Link href="/shop">Start Shopping</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const isCancellable = [
                      "PENDING_PAYMENT",
                      "PAYMENT_CONFIRMED",
                      "PROCESSING",
                      "PACKED",
                    ].includes(order.status);

                    return (
                      <div
                        key={order.id}
                        className="bg-white border border-[#E2DDD3] rounded-xs p-5 sm:p-6 space-y-4 shadow-xs"
                      >
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2DDD3] text-xs">
                          <div>
                            <span className="text-[#5A6065]">Order Reference:</span>{" "}
                            <strong className="font-mono text-sm text-[#226192]">{order.orderNumber}</strong>
                            <span className="text-[#5A6065] ml-2">
                              • {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {getStatusBadge(order.status)}
                          </div>
                        </div>

                        {/* Items Preview */}
                        <div className="space-y-2 text-xs">
                          {order.items.map((it) => (
                            <div key={it.id} className="flex justify-between items-center text-[#1A1D20]">
                              <div>
                                <span className="font-medium">{it.productTitle}</span>
                                <span className="text-[#5A6065] ml-1">({it.variantTitle} × {it.quantity})</span>
                              </div>
                              <span className="font-semibold">₹{it.totalPrice.toLocaleString("en-IN")}</span>
                            </div>
                          ))}
                        </div>

                        {/* Order Footer & Actions */}
                        <div className="pt-3 border-t border-[#E2DDD3] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                          <div>
                            <span className="text-[#5A6065]">Total Payable:</span>{" "}
                            <strong className="text-sm text-[#1A1D20]">₹{order.totalAmount.toLocaleString("en-IN")}</strong>
                            <span className="text-[#5A6065] ml-2">({order.paymentMethod})</span>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            {isCancellable && (
                              <button
                                type="button"
                                disabled={cancellingOrderNumber === order.orderNumber}
                                onClick={() => handleCancelOrder(order.orderNumber)}
                                className="text-xs text-[#B42318] hover:underline font-semibold flex items-center gap-1"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                {cancellingOrderNumber === order.orderNumber ? "Cancelling..." : "Cancel Order"}
                              </button>
                            )}

                            <Button variant="outline" size="sm" asChild className="text-xs border-[#226192] text-[#226192] hover:bg-[#226192]/5">
                              <Link href={`/track?orderNumber=${encodeURIComponent(order.orderNumber)}`}>
                                <span>Track</span>
                              </Link>
                            </Button>

                            <Button variant="outline" size="sm" asChild className="text-xs">
                              <Link href={`/order-confirmation/${order.orderNumber}`}>
                                <span>View Receipt</span>
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "addresses" && (
            <div className="space-y-4">
              {isAddressesLoading ? (
                <div className="bg-white border border-[#E2DDD3] rounded-xs p-12 text-center">
                  <Loader2 className="w-6 h-6 text-[#226192] animate-spin mx-auto mb-2" />
                  <p className="text-xs text-[#5A6065]">Loading saved addresses...</p>
                </div>
              ) : addresses.length === 0 ? (
                <div className="bg-white border border-[#E2DDD3] rounded-xs p-8 text-center space-y-4">
                  <MapPin className="w-10 h-10 text-[#5A6065]/40 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg font-medium text-[#1A1D20]">
                      No Saved Delivery Addresses
                    </h3>
                    <p className="text-xs text-[#5A6065] max-w-sm mx-auto">
                      You can add and save delivery addresses during your checkout session.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" asChild className="bg-[#226192] hover:bg-[#164366] text-white">
                    <Link href="/checkout">Go to Checkout</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="bg-white border border-[#E2DDD3] rounded-xs p-4 text-xs space-y-2 relative shadow-xs"
                    >
                      <div className="flex justify-between items-center">
                        <strong className="text-sm text-[#1A1D20]">{addr.fullName}</strong>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] bg-[#EAE6DE] px-2 py-0.5 rounded-full font-bold uppercase">
                            {addr.addressLabel || "Home"}
                          </span>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-[#5A6065] hover:text-[#B42318] p-1 transition-colors"
                            title="Delete address"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[#5A6065] leading-relaxed">
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                        <br />
                        {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                      </p>
                      <p className="text-[#1A1D20]">Phone: {addr.phone}</p>
                      {addr.isDefaultShipping && (
                        <span className="inline-block text-[10px] text-[#226192] font-semibold bg-[#F4F8FB] px-2 py-0.5 rounded-full border border-[#226192]/30 mt-1">
                          Default Shipping
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
