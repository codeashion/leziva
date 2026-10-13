import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { analyticsService, DateFilterType } from "@/server/services/analytics.service";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, Permissions.DASHBOARD_READ);

    const { searchParams } = new URL(request.url);
    const dateRange = (searchParams.get("dateRange") as DateFilterType) || "30d";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const metrics = await analyticsService.getOverviewMetrics({
      dateRange,
      startDate,
      endDate,
    });

    return NextResponse.json(
      successResponse(metrics, { message: "Dashboard overview metrics loaded." })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load analytics";
    return NextResponse.json(errorResponse(message, "ANALYTICS_ERROR"), { status: 400 });
  }
}
