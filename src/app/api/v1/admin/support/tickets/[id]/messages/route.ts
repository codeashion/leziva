import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { supportService } from "@/server/services/support.service";
import { TicketStatus } from "@prisma/client";
import { successResponse, errorResponse } from "@/utils/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(request, Permissions.SUPPORT_READ);
    const { id } = await params;

    const ticket = await supportService.getTicketById(id);
    return NextResponse.json(successResponse(ticket));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load ticket details";
    return NextResponse.json(errorResponse(message, "TICKET_NOT_FOUND"), { status: 404 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, Permissions.SUPPORT_RESPOND);
    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body || !body.message) {
      return NextResponse.json(errorResponse("Message body is required.", "INVALID_INPUT"), { status: 400 });
    }

    const message = await supportService.addReply(
      id,
      {
        message: body.message,
        senderName: user.name || "Atelier Concierge",
        senderRole: "AGENT",
        isInternal: !!body.isInternal,
      },
      user.id
    );

    return NextResponse.json(successResponse(message, { message: "Reply added to ticket." }), { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add reply";
    return NextResponse.json(errorResponse(message, "REPLY_ERROR"), { status: 400 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, Permissions.SUPPORT_RESPOND);
    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body || !body.status) {
      return NextResponse.json(errorResponse("Status is required.", "INVALID_INPUT"), { status: 400 });
    }

    const updated = await supportService.updateTicketStatus(id, body.status as TicketStatus, user.id);
    return NextResponse.json(successResponse(updated, { message: "Ticket status updated." }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update ticket status";
    return NextResponse.json(errorResponse(message, "STATUS_ERROR"), { status: 400 });
  }
}
