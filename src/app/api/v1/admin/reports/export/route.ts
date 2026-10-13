import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { exportService, ExportType } from "@/server/services/export.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(request, Permissions.REPORTS_EXPORT);

    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type")?.toUpperCase() as ExportType) || "ORDERS";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const result = await exportService.generateCsv({
      type,
      startDate,
      endDate,
      actorId: user.id,
    });

    return new NextResponse(result.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Report generation failed";
    return new NextResponse(JSON.stringify({ error: message }), { status: 400 });
  }
}
