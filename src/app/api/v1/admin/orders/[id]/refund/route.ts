import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { refundService } from "@/server/services/refund.service";
import { successResponse, errorResponse } from "@/utils/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission(request, Permissions.REFUNDS_PROCESS);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const result = await refundService.processRefund({
      orderId: id,
      amountInRupees: body.amount ? Number(body.amount) : undefined,
      reason: body.reason || "Administrative cancellation/return credit",
      returnRequestId: body.returnRequestId || undefined,
      actorId: user.id,
      idempotencyKey: body.idempotencyKey || undefined,
    });

    return NextResponse.json(
      successResponse(result, { message: "Refund processed successfully." })
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Refund processing failed";
    return NextResponse.json(errorResponse(message, "REFUND_ERROR"), { status: 400 });
  }
}
