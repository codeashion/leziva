import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { adminProductService } from "@/server/services/admin-product.service";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, Permissions.PRODUCTS_READ);

    const csvData = await adminProductService.exportProductsToCsv();
    const filename = `leziva_products_export_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Export failed";
    return new NextResponse(JSON.stringify({ error: message }), { status: 400 });
  }
}
