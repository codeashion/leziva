import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { reviewService } from "@/server/services/review.service";
import { NotFoundError } from "@/utils/errors";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(req, Permissions.REVIEWS_MODERATE);
    const { id } = await params;
    const body = await req.json();
    const updated = await reviewService.moderateReview(
      id,
      Boolean(body.isApproved),
      user.id
    );
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const status = error instanceof NotFoundError ? 404 : 500;
    const message = error instanceof Error ? error.message : "Failed to moderate review";
    return NextResponse.json({ success: false, error: { message } }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission(req, Permissions.REVIEWS_MODERATE);
    const { id } = await params;
    const result = await reviewService.deleteReview(id, user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const status = error instanceof NotFoundError ? 404 : 500;
    const message = error instanceof Error ? error.message : "Failed to delete review";
    return NextResponse.json({ success: false, error: { message } }, { status });
  }
}
