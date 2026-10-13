import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/server/auth/guards";
import { velocityReverseService } from "@/server/integrations/velocity/velocity-reverse.service";
import { successResponse, errorResponse } from "@/utils/api-response";
import { RoleType } from "@prisma/client";
import { UnauthorizedError, ForbiddenError } from "@/utils/errors";
import { logger } from "@/utils/logger";

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

    const { returnRequestId, carrierId } = body;
    if (!returnRequestId || typeof returnRequestId !== "string") {
      return NextResponse.json(
        errorResponse("returnRequestId is required.", "MISSING_RETURN_ID"),
        { status: 400 }
      );
    }

    logger.info(`[AdminReversePickup] Admin ${adminUser.email} initiating reverse pickup for return ${returnRequestId}`);

    const result = await velocityReverseService.orchestrateReversePickup(
      returnRequestId,
      adminUser.id,
      carrierId
    );

    return NextResponse.json(
      successResponse(result, {
        message: "Reverse pickup successfully orchestrated with carrier via Velocity.",
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
    const message = error instanceof Error ? error.message : "Reverse pickup creation failed";
    return NextResponse.json(errorResponse(message, "REVERSE_PICKUP_FAILED"), { status: 400 });
  }
}
