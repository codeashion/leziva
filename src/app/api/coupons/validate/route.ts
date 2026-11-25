import { NextResponse } from "next/server";
import { INITIAL_COUPONS } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const { code, cartSubtotal } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, message: "Coupon code is required" }, { status: 400 });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const coupon = INITIAL_COUPONS.find((c) => c.code.toUpperCase() === cleanCode && c.active);

    if (!coupon) {
      return NextResponse.json({ success: false, message: "Invalid promotional code" }, { status: 404 });
    }

    if (cartSubtotal < coupon.minOrderValue) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum order value of ₹${coupon.minOrderValue.toLocaleString("en-IN")} required for this voucher.`,
        },
        { status: 400 }
      );
    }

    let calculatedDiscount = 0;
    if (coupon.discountType === "percentage") {
      calculatedDiscount = Math.round((cartSubtotal * coupon.discountValue) / 100);
    } else {
      calculatedDiscount = coupon.discountValue;
    }

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        calculatedDiscount,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
