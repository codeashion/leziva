import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/server/auth/guards";
import { velocityTrackingService } from "@/server/integrations/velocity/velocity-tracking.service";
import { successResponse, errorResponse } from "@/utils/api-response";
import { RoleType } from "@prisma/client";
import { UnauthorizedError, ForbiddenError } from "@/utils/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRoles(request, [RoleType.SUPER_ADMIN, RoleType.ORDER_MANAGER]);
    const { id } = await params;

    const result = await velocityTrackingService.refreshShipmentTracking(id);

    return NextResponse.json(
      successResponse(result, {
        message: "Tracking refreshed successfully from carrier.",
      })
    );
  } catch (error: unknown) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(errorResponse(error.message, "UNAUTHORIZED"), { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(errorResponse(error.message, "FORBIDDEN"), { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Tracking refresh failed";
    return NextResponse.json(errorResponse(message, "TRACKING_REFRESH_ERROR"), { status: 400 });
  }
}
