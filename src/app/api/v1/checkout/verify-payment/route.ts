import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/server/services/order.service";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!orderNumber || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        errorResponse("Missing required payment verification parameters", "MISSING_PAYMENT_PARAMS"),
        { status: 400 }
      );
    }

    const verifiedOrder = await orderService.verifyPayment({
      orderNumber,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    return NextResponse.json(
      successResponse(
        {
          orderNumber: verifiedOrder.orderNumber,
          status: verifiedOrder.status,
          paymentStatus: verifiedOrder.paymentStatus,
          totalAmount: verifiedOrder.totalAmount,
        },
        { message: "Payment verified successfully" }
      )
    );
  } catch (error: unknown) {
    const err = error as { message?: string; statusCode?: number };
    const message = err.message || "Payment verification failed";
    return NextResponse.json(errorResponse(message, "PAYMENT_VERIFICATION_FAILED"), {
      status: err.statusCode || 400,
    });
  }
}
