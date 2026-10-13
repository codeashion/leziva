import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { adminProductService } from "@/server/services/admin-product.service";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, Permissions.PRODUCTS_WRITE);
    const contentType = request.headers.get("content-type") || "";

    let csvText = "";
    if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
      csvText = await request.text();
    } else {
      const body = await request.json().catch(() => null);
      csvText = body?.csvText || "";
    }

    if (!csvText || !csvText.trim()) {
      return NextResponse.json(errorResponse("CSV content is required.", "INVALID_INPUT"), { status: 400 });
    }

    const report = await adminProductService.importProductsFromCsv(csvText, user.id);
    return NextResponse.json(
      successResponse(report, {
        message: `Import complete: ${report.successCount} imported, ${report.errorCount} skipped.`,
      })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "CSV import failed";
    return NextResponse.json(errorResponse(message, "IMPORT_ERROR"), { status: 400 });
  }
}
