import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { adminOrderService } from "@/server/services/admin-order.service";
import { OrderStatus } from "@prisma/client";
import { successResponse, errorResponse } from "@/utils/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(request, Permissions.ORDERS_READ);
    const { id } = await params;

    const order = await adminOrderService.getOrderDetails(id);
    return NextResponse.json(successResponse(order));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load order details";
    return NextResponse.json(errorResponse(message, "ORDER_NOT_FOUND"), { status: 404 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, Permissions.ORDERS_UPDATE);
    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body || !body.status) {
      return NextResponse.json(errorResponse("New status is required.", "INVALID_INPUT"), { status: 400 });
    }

    const reason = body.reason || "Administrative operational update";
    const updated = await adminOrderService.updateOrderStatus(id, body.status as OrderStatus, reason, user.id);

    return NextResponse.json(successResponse(updated, { message: "Order status updated." }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Status transition failed";
    return NextResponse.json(errorResponse(message, "TRANSITION_ERROR"), { status: 400 });
  }
}
