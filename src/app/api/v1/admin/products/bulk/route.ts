import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { adminProductService } from "@/server/services/admin-product.service";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, Permissions.PRODUCTS_WRITE);
    const body = await request.json().catch(() => null);

    if (!body || !body.action) {
      return NextResponse.json(errorResponse("Action is required.", "INVALID_INPUT"), { status: 400 });
    }

    if (body.action === "PUBLISH" || body.action === "UNPUBLISH") {
      const publish = body.action === "PUBLISH";
      const result = await adminProductService.bulkPublish(body.productIds || [], publish, user.id);
      return NextResponse.json(successResponse(result, { message: `Products bulk ${publish ? "published" : "unpublished"}.` }));
    }

    if (body.action === "UPDATE_PRICES") {
      const result = await adminProductService.bulkUpdatePrices(body.updates || [], user.id);
      return NextResponse.json(successResponse(result, { message: "Prices updated in bulk." }));
    }

    return NextResponse.json(errorResponse("Unsupported bulk action.", "INVALID_ACTION"), { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bulk action failed";
    return NextResponse.json(errorResponse(message, "BULK_ERROR"), { status: 400 });
  }
}
