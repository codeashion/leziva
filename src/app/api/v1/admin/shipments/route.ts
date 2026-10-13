import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/server/auth/guards";
import { shipmentRepository } from "@/server/repositories/shipment.repository";
import { velocityShipmentService } from "@/server/integrations/velocity/velocity-shipment.service";
import { successResponse, errorResponse } from "@/utils/api-response";
import { RoleType, ShipmentStatus, ShipmentType } from "@prisma/client";
import { UnauthorizedError, ForbiddenError } from "@/utils/errors";
import { logger } from "@/utils/logger";

export async function GET(request: NextRequest) {
  try {
    await requireRoles(request, [RoleType.SUPER_ADMIN, RoleType.ORDER_MANAGER]);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status") as ShipmentStatus | null;
    const shipmentType = searchParams.get("type") as ShipmentType | null;
    const search = searchParams.get("search") || undefined;

    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const offset = (pageNum - 1) * limitNum;

    const [shipments, total] = await Promise.all([
      shipmentRepository.findMany({
        limit: limitNum,
        offset,
        status: status || undefined,
        shipmentType: shipmentType || undefined,
        search,
      }),
      shipmentRepository.count({
        status: status || undefined,
        shipmentType: shipmentType || undefined,
        search,
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return NextResponse.json(
      successResponse(shipments, {
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
        },
      })
    );
  } catch (error: unknown) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(errorResponse(error.message, "UNAUTHORIZED"), { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(errorResponse(error.message, "FORBIDDEN"), { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Failed to retrieve shipments";
    return NextResponse.json(errorResponse(message, "INTERNAL_ERROR"), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireRoles(request, [RoleType.SUPER_ADMIN, RoleType.ORDER_MANAGER]);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        errorResponse("Invalid request body.", "INVALID_BODY"),
        { status: 400 }
      );
    }

    const { orderId, carrierId, twoStep } = body;
    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        errorResponse("orderId is required.", "MISSING_ORDER_ID"),
        { status: 400 }
      );
    }

    logger.info(`[AdminShipments] Admin ${adminUser.email} initiating forward shipment for order ${orderId}`, {
      carrierId,
      twoStep: Boolean(twoStep),
    });

    const shipment = await velocityShipmentService.createForwardShipment({
      orderId,
      carrierId,
      useTwoStepFlow: Boolean(twoStep),
    });

    return NextResponse.json(
      successResponse(shipment, {
        message: "Shipment manifested and AWB assigned successfully via Velocity.",
      }),
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(errorResponse(error.message, "UNAUTHORIZED"), { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(errorResponse(error.message, "FORBIDDEN"), { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Shipment creation failed";
    return NextResponse.json(errorResponse(message, "SHIPMENT_CREATION_FAILED"), { status: 400 });
  }
}
