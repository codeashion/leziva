import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { inventoryService } from "@/server/services/inventory.service";
import { successResponse, errorResponse } from "@/utils/api-response";
import { BadRequestError, ForbiddenError, UnauthorizedError } from "@/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requirePermission(request, Permissions.INVENTORY_ADJUST);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        errorResponse("Invalid request body.", "INVALID_BODY"),
        { status: 400 }
      );
    }

    const { variantId, quantityDelta, reason, notes } = body;
    if (!variantId || typeof variantId !== "string") {
      return NextResponse.json(
        errorResponse("variantId is required.", "INVALID_VARIANT_ID"),
        { status: 400 }
      );
    }

    const delta = Number(quantityDelta);
    if (isNaN(delta) || !Number.isInteger(delta)) {
      return NextResponse.json(
        errorResponse("quantityDelta must be an integer.", "INVALID_QUANTITY_DELTA"),
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string") {
      return NextResponse.json(
        errorResponse("reason is required for inventory audit trail.", "MISSING_REASON"),
        { status: 400 }
      );
    }

    const result = await inventoryService.adjustStock({
      variantId,
      quantityDelta: delta,
      reason,
      actorId: adminUser.id,
      notes: notes || undefined,
    });

    return NextResponse.json(
      successResponse(result, { message: "Inventory adjusted successfully." })
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(errorResponse(error.message, "UNAUTHORIZED"), {
        status: 401,
      });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(errorResponse(error.message, "FORBIDDEN"), {
        status: 403,
      });
    }
    if (error instanceof BadRequestError) {
      return NextResponse.json(errorResponse(error.message, "BAD_REQUEST"), {
        status: 400,
      });
    }
    const message = error instanceof Error ? error.message : "Failed to adjust inventory";
    return NextResponse.json(errorResponse(message, "INVENTORY_ADJUST_ERROR"), {
      status: 500,
    });
  }
}
