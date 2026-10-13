import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/server/services/order.service";
import { authenticateRequest } from "@/server/auth/guards";
import { successResponse, errorResponse } from "@/utils/api-response";

interface Params {
  params: Promise<{ orderNumber: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { orderNumber } = await params;
    const user = await authenticateRequest(request);
    const guestEmail = request.nextUrl.searchParams.get("email");

    const order = await orderService.getOrderByNumber(orderNumber, user?.id, guestEmail || undefined);
    return NextResponse.json(successResponse(order));
  } catch (error: unknown) {
    const err = error as { message?: string; statusCode?: number };
    const message = err.message || "Order not found";
    return NextResponse.json(errorResponse(message, "ORDER_NOT_FOUND"), { status: err.statusCode || 404 });
  }
}
