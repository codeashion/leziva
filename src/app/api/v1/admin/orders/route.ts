import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { adminOrderService } from "@/server/services/admin-order.service";
import { OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, Permissions.ORDERS_READ);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = (searchParams.get("status") as OrderStatus) || undefined;
    const paymentStatus = (searchParams.get("paymentStatus") as PaymentStatus) || undefined;
    const paymentMethod = (searchParams.get("paymentMethod") as PaymentMethod) || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await adminOrderService.getOrders({
      search,
      status,
      paymentStatus,
      paymentMethod,
      startDate,
      endDate,
      page,
      limit,
    });

    return NextResponse.json(successResponse(result, { message: "Orders retrieved." }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load orders";
    return NextResponse.json(errorResponse(message, "ORDERS_ERROR"), { status: 400 });
  }
}
