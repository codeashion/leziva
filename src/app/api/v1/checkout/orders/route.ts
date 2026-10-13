import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/server/services/order.service";
import { authenticateRequest, getGuestCartIdFromRequest } from "@/server/auth/guards";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    const guestCartId = getGuestCartIdFromRequest(request);
    const body = await request.json();

    const idempotencyKey =
      request.headers.get("x-idempotency-key") || body.idempotencyKey || undefined;

    const result = await orderService.createOrder({
      userId: user?.id,
      guestCartId,
      guestEmail: user?.email || body.guestEmail,
      guestPhone: body.guestPhone,
      guestName: user?.name || body.guestName,
      shippingAddressId: body.shippingAddressId,
      shippingAddress: body.shippingAddress,
      billingAddressId: body.billingAddressId,
      billingAddress: body.billingAddress,
      billingSameAsShipping: body.billingSameAsShipping,
      couponCode: body.couponCode,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
      idempotencyKey,
      items: body.items,
    });

    return NextResponse.json(
      successResponse(
        {
          orderNumber: result.order.orderNumber,
          orderId: result.order.id,
          totalAmount: result.order.totalAmount,
          currency: result.order.currency,
          status: result.order.status,
          paymentMethod: result.order.paymentMethod,
          paymentStatus: result.order.paymentStatus,
          razorpayOrder: result.razorpayOrder
            ? {
                id: result.razorpayOrder.id,
                amount: result.razorpayOrder.amount,
                currency: result.razorpayOrder.currency,
                keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder_key_id",
                isMock: result.razorpayOrder.isMock,
              }
            : null,
        },
        { message: "Order created successfully" }
      ),
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as { message?: string; statusCode?: number };
    const message = err.message || "Failed to create order";
    return NextResponse.json(errorResponse(message, "ORDER_CREATION_ERROR"), {
      status: err.statusCode || 400,
    });
  }
}
