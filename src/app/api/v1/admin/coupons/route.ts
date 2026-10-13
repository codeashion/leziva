import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { couponRepository } from "@/server/repositories/coupon.repository";
import { auditRepository } from "@/server/repositories/audit.repository";
import { DiscountType } from "@prisma/client";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, Permissions.COUPONS_READ);
    const coupons = await couponRepository.listCoupons();
    return NextResponse.json(successResponse(coupons));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load coupons";
    return NextResponse.json(errorResponse(message, "COUPONS_ERROR"), { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, Permissions.COUPONS_WRITE);
    const body = await request.json().catch(() => null);

    if (!body || !body.code || !body.discountValue) {
      return NextResponse.json(
        errorResponse("Code and discountValue are required.", "INVALID_INPUT"),
        { status: 400 }
      );
    }

    const code = body.code.trim().toUpperCase();
    const discountType = body.discountType === "FIXED_AMOUNT" ? DiscountType.FIXED_AMOUNT : DiscountType.PERCENTAGE;
    const discountValue = parseFloat(body.discountValue);

    const saved = await couponRepository.upsertCoupon({
      id: `cpn_${code.toLowerCase()}_${Date.now().toString(36)}`,
      code,
      description: body.description || `${discountValue}${discountType === DiscountType.PERCENTAGE ? "%" : " INR"} discount promotional code`,
      discountType,
      discountValue,
      minOrderValue: body.minOrderValue ? parseFloat(body.minOrderValue) : null,
      maxDiscount: body.maxDiscount ? parseFloat(body.maxDiscount) : null,
      maxUses: body.maxUses ? parseInt(body.maxUses, 10) : 1000,
      usedCount: 0,
      perUserLimit: body.perUserLimit ? parseInt(body.perUserLimit, 10) : 1,
      firstOrderOnly: !!body.firstOrderOnly,
      applicableCategoryIds: [],
      excludedProductIds: [],
      validFrom: new Date(),
      validTo: body.validTo ? new Date(body.validTo) : new Date("2028-12-31"),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await auditRepository.recordLog({
      actorId: user.id,
      action: "COUPON_CREATED",
      resourceType: "PROMOTION",
      resourceId: code,
      metadata: { code, discountValue, discountType },
    });

    return NextResponse.json(successResponse(saved, { message: "Coupon created." }), { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save coupon";
    return NextResponse.json(errorResponse(message, "COUPON_SAVE_ERROR"), { status: 400 });
  }
}
