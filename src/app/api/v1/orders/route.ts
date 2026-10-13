import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/server/services/order.service";
import { authenticateRequest } from "@/server/auth/guards";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(errorResponse("Authentication required to view orders", "UNAUTHORIZED"), {
        status: 401,
      });
    }

    const orders = await orderService.getUserOrders(user.id);
    return NextResponse.json(successResponse(orders));
  } catch (error: unknown) {
    const err = error as { message?: string; statusCode?: number };
    const message = err.message || "Failed to load orders";
    return NextResponse.json(errorResponse(message, "ORDERS_FETCH_ERROR"), { status: err.statusCode || 500 });
  }
}
