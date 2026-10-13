import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/server/services/order.service";
import { authenticateRequest } from "@/server/auth/guards";
import { successResponse, errorResponse } from "@/utils/api-response";

interface Params {
  params: Promise<{ orderNumber: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { orderNumber } = await params;
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(errorResponse("Authentication required to cancel an order", "UNAUTHORIZED"), {
        status: 401,
      });
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "Cancelled by customer";

    const cancelledOrder = await orderService.requestCancellation(orderNumber, user.id, reason);
    return NextResponse.json(
      successResponse(
        {
          orderNumber: cancelledOrder.orderNumber,
          status: cancelledOrder.status,
          message: "Your cancellation request has been processed successfully",
        },
        { message: "Order cancelled successfully" }
      )
    );
  } catch (error: unknown) {
    const err = error as { message?: string; statusCode?: number };
    const message = err.message || "Failed to cancel order";
    return NextResponse.json(errorResponse(message, "ORDER_CANCEL_ERROR"), { status: err.statusCode || 400 });
  }
}
