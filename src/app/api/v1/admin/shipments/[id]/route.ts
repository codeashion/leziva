import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/server/auth/guards";
import { shipmentRepository } from "@/server/repositories/shipment.repository";
import { orderRepository } from "@/server/repositories/order.repository";
import { successResponse, errorResponse } from "@/utils/api-response";
import { RoleType, ShipmentStatus } from "@prisma/client";
import { UnauthorizedError, ForbiddenError } from "@/utils/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRoles(request, [RoleType.SUPER_ADMIN, RoleType.ORDER_MANAGER]);
    const { id } = await params;

    const shipment = await shipmentRepository.findById(id);
    if (!shipment) {
      return NextResponse.json(errorResponse("Shipment not found", "NOT_FOUND"), { status: 404 });
    }

    const order = await orderRepository.findById(shipment.orderId);

    return NextResponse.json(
      successResponse({
        shipment,
        order: order
          ? {
              id: order.id,
              orderNumber: order.orderNumber,
              customerEmail: order.guestEmail,
              totalAmount: order.totalAmount,
              paymentMethod: order.paymentMethod,
              shippingAddress: order.shippingAddressSnapshot,
              items: order.items,
            }
          : null,
      })
    );
  } catch (error: unknown) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(errorResponse(error.message, "UNAUTHORIZED"), { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(errorResponse(error.message, "FORBIDDEN"), { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Failed to load shipment";
    return NextResponse.json(errorResponse(message, "INTERNAL_ERROR"), { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRoles(request, [RoleType.SUPER_ADMIN, RoleType.ORDER_MANAGER]);
    const { id } = await params;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(errorResponse("Invalid request body", "INVALID_BODY"), { status: 400 });
    }

    const { status, lastProviderError } = body;
    const updateData: { status?: ShipmentStatus; lastProviderError?: string } = {};

    if (status && Object.values(ShipmentStatus).includes(status)) {
      updateData.status = status;
    }
    if (typeof lastProviderError === "string") {
      updateData.lastProviderError = lastProviderError;
    }

    const updated = await shipmentRepository.update(id, updateData);

    return NextResponse.json(successResponse(updated, { message: "Shipment updated successfully" }));
  } catch (error: unknown) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(errorResponse(error.message, "UNAUTHORIZED"), { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(errorResponse(error.message, "FORBIDDEN"), { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json(errorResponse(message, "UPDATE_FAILED"), { status: 400 });
  }
}
