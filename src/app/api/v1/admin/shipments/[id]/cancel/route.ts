import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/server/auth/guards";
import { velocityCancellationService } from "@/server/integrations/velocity/velocity-cancellation.service";
import { successResponse, errorResponse } from "@/utils/api-response";
import { RoleType } from "@prisma/client";
import { UnauthorizedError, ForbiddenError } from "@/utils/errors";
import { logger } from "@/utils/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireRoles(request, [RoleType.SUPER_ADMIN, RoleType.ORDER_MANAGER]);
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === "string" ? body.reason : "Admin requested cancellation";

    logger.info(`[AdminCancelShipment] Admin ${adminUser.email} requested cancellation for shipment ${id}`, {
      reason,
    });

    const result = await velocityCancellationService.cancelShipment(id, reason, adminUser.id);

    return NextResponse.json(
      successResponse(result, {
        message: result.carrierAcknowledged
          ? "Shipment successfully cancelled with carrier."
          : "Shipment cancellation is pending carrier confirmation.",
      })
    );
  } catch (error: unknown) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(errorResponse(error.message, "UNAUTHORIZED"), { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(errorResponse(error.message, "FORBIDDEN"), { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Shipment cancellation failed";
    return NextResponse.json(errorResponse(message, "CANCELLATION_FAILED"), { status: 400 });
  }
}
