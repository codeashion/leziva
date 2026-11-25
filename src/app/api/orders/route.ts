import { NextResponse } from "next/server";
import { INITIAL_ORDERS } from "@/lib/constants";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { createVelocityForwardOrder } from "@/lib/velocity";
import { Order } from "@/types";

export async function GET() {
  return NextResponse.json({
    success: true,
    orders: INITIAL_ORDERS,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderData,
      razorpay,
      velocityConfig,
    }: {
      orderData: Omit<Order, "id" | "orderNumber" | "createdAt">;
      razorpay?: {
        razorpay_order_id?: string;
        razorpay_payment_id?: string;
        razorpay_signature?: string;
      };
      velocityConfig?: {
        warehouseId?: string;
        pickupLocation?: string;
        channelId?: string;
      };
    } = body;

    if (!orderData || !orderData.customer || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid order payload" },
        { status: 400 }
      );
    }

    const isPrepaid = orderData.paymentMethod !== "cod";
    if (isPrepaid) {
      if (
        !razorpay?.razorpay_order_id ||
        !razorpay?.razorpay_payment_id ||
        !razorpay?.razorpay_signature
      ) {
        return NextResponse.json(
          { success: false, message: "Razorpay payment proof is required for prepaid orders" },
          { status: 400 }
        );
      }

      const isValid = verifyRazorpayPaymentSignature({
        razorpayOrderId: razorpay.razorpay_order_id,
        razorpayPaymentId: razorpay.razorpay_payment_id,
        razorpaySignature: razorpay.razorpay_signature,
      });

      if (!isValid) {
        return NextResponse.json(
          { success: false, message: "Razorpay payment signature verification failed" },
          { status: 400 }
        );
      }
    }

    const orderNumber = `#${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const createdOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: now.toISOString().replace("T", " ").substring(0, 16),
      orderStatus: "Processing",
      paymentStatus: isPrepaid ? "paid" : "pending",
      ...(razorpay?.razorpay_order_id
        ? { razorpayOrderId: razorpay.razorpay_order_id }
        : {}),
      ...(razorpay?.razorpay_payment_id
        ? { razorpayPaymentId: razorpay.razorpay_payment_id }
        : {}),
    };

    // Push order to Velocity Shipping Dashboard
    const velocityResult = await createVelocityForwardOrder(createdOrder, velocityConfig);

    const finalOrder: Order = {
      ...createdOrder,
      velocitySynced: velocityResult.synced,
      velocityOrderId: velocityResult.velocityOrderId,
      velocityShipmentId: velocityResult.velocityShipmentId,
      velocityAwbCode: velocityResult.awbCode,
      velocityCourierName: velocityResult.courierName,
      trackingNumber: velocityResult.awbCode || createdOrder.trackingNumber,
      velocityError: velocityResult.error,
    };

    return NextResponse.json({
      success: true,
      order: finalOrder,
      velocity: velocityResult,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
