import { NextResponse } from "next/server";
import { PRODUCTS, INITIAL_COUPONS } from "@/lib/constants";
import {
  createRazorpayOrder,
  getRazorpayCredentials,
  verifyRazorpayPaymentSignature,
} from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      action,
      items,
      address,
      couponCode,
      shippingMethod,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    // Action: VERIFY PAYMENT
    if (action === "verify") {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json(
          { success: false, message: "Missing Razorpay payment verification fields" },
          { status: 400 }
        );
      }

      const isValid = verifyRazorpayPaymentSignature({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      });

      if (!isValid) {
        return NextResponse.json(
          { success: false, message: "Payment signature verification failed" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Payment successfully verified on server",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
    }

    // Action: CREATE ORDER (Default)
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cart cannot be empty" },
        { status: 400 }
      );
    }

    // Server-side recalculation: Never trust client-provided prices
    let serverSubtotal = 0;

    for (const item of items) {
      const dbProduct = PRODUCTS.find((p) => p.id === item.productId);
      if (!dbProduct) {
        return NextResponse.json(
          { success: false, message: `Product ${item.productId} not found in catalog` },
          { status: 404 }
        );
      }

      const qty = Math.max(1, Number(item.quantity) || 1);
      serverSubtotal += dbProduct.price * qty;
    }

    // Coupon discount calculation matching StoreContext
    let discountAmount = 0;
    if (couponCode) {
      const cleanCode = String(couponCode).trim().toUpperCase();
      const coupon = INITIAL_COUPONS.find(
        (c) => c.code.toUpperCase() === cleanCode && c.active
      );
      if (coupon && serverSubtotal >= coupon.minOrderValue) {
        discountAmount =
          coupon.discountType === "percentage"
            ? Math.round((serverSubtotal * coupon.discountValue) / 100)
            : coupon.discountValue;
      }
    }

    const taxableAmount = Math.max(0, serverSubtotal - discountAmount);
    const shippingFee = shippingMethod === "express" ? 99 : 0;
    const tax = Math.round(taxableAmount * 0.05); // 5% GST (inclusive display)
    const serverTotal = taxableAmount + shippingFee;

    if (serverTotal <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid payable order amount" },
        { status: 400 }
      );
    }

    const { keyId } = getRazorpayCredentials();

    const razorpayOrder = await createRazorpayOrder({
      amountPaise: Math.round(serverTotal * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        customerName: address?.fullName ? String(address.fullName).slice(0, 80) : "",
        customerPhone: address?.phone ? String(address.phone).slice(0, 20) : "",
        shippingMethod: shippingMethod === "express" ? "express" : "standard",
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        ...razorpayOrder,
        serverCalculations: {
          subtotal: serverSubtotal,
          discount: discountAmount,
          shippingFee,
          tax,
          total: serverTotal,
        },
      },
      keyId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create payment session";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
