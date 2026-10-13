import { NextRequest, NextResponse } from "next/server";
import { couponService } from "@/server/services/coupon.service";
import { authenticateRequest } from "@/server/auth/guards";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    const body = await request.json();
    const { code, subtotal, productIds } = body;

    if (!code) {
      return NextResponse.json(errorResponse("Coupon code is required", "COUPON_REQUIRED"), { status: 400 });
    }

    const result = await couponService.validateAndCalculate(code, {
      subtotal: Number(subtotal || 0),
      userId: user?.id,
      customerEmail: user?.email,
      productIds: Array.isArray(productIds) ? productIds : [],
    });

    return NextResponse.json(
      successResponse({
        code: result.coupon.code,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
        discountAmount: result.discountAmount,
        message: result.message,
      })
    );
  } catch (error: unknown) {
    const err = error as { message?: string; statusCode?: number };
    const message = err.message || "Invalid coupon code";
    return NextResponse.json(errorResponse(message, "COUPON_INVALID"), { status: err.statusCode || 400 });
  }
}
