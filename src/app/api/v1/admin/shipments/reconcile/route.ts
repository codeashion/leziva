import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/server/auth/guards";
import { velocityReportingService } from "@/server/integrations/velocity/velocity-reporting.service";
import { successResponse, errorResponse } from "@/utils/api-response";
import { RoleType } from "@prisma/client";
import { UnauthorizedError, ForbiddenError } from "@/utils/errors";
import { logger } from "@/utils/logger";

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireRoles(request, [RoleType.SUPER_ADMIN, RoleType.ORDER_MANAGER]);

    const body = await request.json().catch(() => ({}));
    const { startDateTime, endDateTime, shipmentType, autoApply } = body;

    const now = new Date();
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    const start =
      typeof startDateTime === "string"
        ? startDateTime
        : sevenDaysAgo.toISOString().replace("T", " ").substring(0, 19);

    const end =
      typeof endDateTime === "string"
        ? endDateTime
        : now.toISOString().replace("T", " ").substring(0, 19);

    const type = shipmentType === "return" ? "return" : "forward";
    const applyResolution = autoApply !== false;

    logger.info(`[AdminReconcile] Admin ${adminUser.email} running shipment reconciliation`, {
      start,
      end,
      type,
      applyResolution,
    });

    const report = await velocityReportingService.reconcileShipments(
      start,
      end,
      type,
      applyResolution
    );

    return NextResponse.json(
      successResponse(report, {
        message: `Reconciliation completed. ${report.discrepanciesCount} discrepancies evaluated, ${report.syncedCount} synchronized.`,
      })
    );
  } catch (error: unknown) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(errorResponse(error.message, "UNAUTHORIZED"), { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(errorResponse(error.message, "FORBIDDEN"), { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Reconciliation failed";
    return NextResponse.json(errorResponse(message, "RECONCILIATION_ERROR"), { status: 400 });
  }
}
