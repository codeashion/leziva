import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/server/auth/guards";
import { velocityWarehouseService } from "@/server/integrations/velocity/velocity-warehouse.service";
import { successResponse, errorResponse } from "@/utils/api-response";
import { RoleType } from "@prisma/client";
import { UnauthorizedError, ForbiddenError } from "@/utils/errors";

export async function GET(request: NextRequest) {
  try {
    await requireRoles(request, [RoleType.SUPER_ADMIN, RoleType.ORDER_MANAGER]);

    const diagnostics = await velocityWarehouseService.getWarehouseDiagnostics();

    return NextResponse.json(
      successResponse(diagnostics, {
        message: "Warehouse configuration diagnostic retrieved.",
      })
    );
  } catch (error: unknown) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(errorResponse(error.message, "UNAUTHORIZED"), { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(errorResponse(error.message, "FORBIDDEN"), { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Diagnostics failed";
    return NextResponse.json(errorResponse(message, "INTERNAL_ERROR"), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRoles(request, [RoleType.SUPER_ADMIN]);

    const body = await request.json().catch(() => ({}));
    const result = await velocityWarehouseService.registerWarehouse(body);

    return NextResponse.json(
      successResponse(result, {
        message: "Warehouse registered/validated successfully with Velocity Shipping.",
      })
    );
  } catch (error: unknown) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(errorResponse(error.message, "UNAUTHORIZED"), { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(errorResponse(error.message, "FORBIDDEN"), { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Warehouse registration failed";
    return NextResponse.json(errorResponse(message, "REGISTRATION_FAILED"), { status: 400 });
  }
}
