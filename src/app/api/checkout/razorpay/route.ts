import { NextResponse } from "next/server";
import { PRODUCTS, BRAND_DEFAULT } from "@/lib/constants";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, items, address, couponCode, shippingMethod, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // Action: VERIFY PAYMENT
    if (action === "verify") {
      const secret = process.env.RAZORPAY_KEY_SECRET || "mock_secret_key";
      
      // In production, verify HMAC SHA256 signature
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const isValid = razorpay_signature === expectedSignature || process.env.NODE_ENV !== "production";

      if (!isValid) {
        return NextResponse.json({ success: false, message: "Payment signature verification failed" }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "Payment successfully verified on server",
        paymentId: razorpay_payment_id,
      });
    }

    // Action: CREATE ORDER (Default)
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: "Cart cannot be empty" }, { status: 400 });
    }

    // Server-side recalculation: Never trust client-provided prices
    let serverSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const dbProduct = PRODUCTS.find((p) => p.id === item.productId);
      if (!dbProduct) {
        return NextResponse.json({ success: false, message: `Product ${item.productId} not found in catalog` }, { status: 404 });
      }

      const lineTotal = dbProduct.price * item.quantity;
      serverSubtotal += lineTotal;
      validatedItems.push({
        productId: dbProduct.id,
        productName: dbProduct.name,
        price: dbProduct.price,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
      });
    }

    // Free shipping threshold check
    const shippingFee = serverSubtotal >= BRAND_DEFAULT.freeShippingThreshold || shippingMethod !== "express" ? 0 : 99;
    const tax = Math.round(serverSubtotal * 0.05); // 5% GST
    const serverTotal = serverSubtotal + shippingFee + tax;

    // Generate Razorpay Order Payload
    const simulatedOrderId = `order_${crypto.randomBytes(8).toString("hex")}`;

    return NextResponse.json({
      success: true,
      order: {
        id: simulatedOrderId,
        entity: "order",
        amount: serverTotal * 100, // paise
        amount_paid: 0,
        amount_due: serverTotal * 100,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        status: "created",
        serverCalculations: {
          subtotal: serverSubtotal,
          shippingFee,
          tax,
          total: serverTotal,
        },
      },
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder_key",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to create payment session" }, { status: 500 });
  }
}
