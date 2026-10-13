import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { reviewService } from "@/server/services/review.service";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, Permissions.REVIEWS_MODERATE);

    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status");

    let isApproved: boolean | undefined = undefined;
    if (statusParam === "APPROVED") isApproved = true;
    if (statusParam === "PENDING") isApproved = false;

    const reviews = await reviewService.listReviews(
      isApproved !== undefined ? { isApproved } : undefined
    );
    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load reviews";
    return NextResponse.json({ success: false, error: { message } }, { status: 400 });
  }
}
