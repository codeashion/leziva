import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { supportService } from "@/server/services/support.service";
import { TicketStatus, TicketPriority } from "@prisma/client";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, Permissions.SUPPORT_READ);

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") as TicketStatus) || undefined;
    const priority = (searchParams.get("priority") as TicketPriority) || undefined;
    const search = searchParams.get("search") || undefined;

    const tickets = await supportService.getTickets({ status, priority, search });
    return NextResponse.json(successResponse(tickets));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load support tickets";
    return NextResponse.json(errorResponse(message, "SUPPORT_ERROR"), { status: 400 });
  }
}
