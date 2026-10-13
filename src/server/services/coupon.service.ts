import { couponRepository, StoredCoupon } from "@/server/repositories/coupon.repository";
import { BadRequestError } from "@/utils/errors";
import { DiscountType } from "@prisma/client";

export interface CouponValidationContext {
  subtotal: number;
  userId?: string | null;
  customerEmail?: string | null;
  categoryIds?: string[];
  productIds?: string[];
}

export interface CouponCalculationResult {
  coupon: StoredCoupon;
  discountAmount: number;
  message: string;
}

export class CouponService {
  async validateAndCalculate(
    code: string,
    context: CouponValidationContext
  ): Promise<CouponCalculationResult> {
    if (!code || !code.trim()) {
      throw new BadRequestError("Coupon code is required");
    }

    const normalizedCode = code.trim().toUpperCase();
    const coupon = await couponRepository.findByCode(normalizedCode);

    if (!coupon) {
      throw new BadRequestError(`Coupon code "${normalizedCode}" does not exist`);
    }

    if (!coupon.isActive) {
      throw new BadRequestError(`Coupon code "${normalizedCode}" is currently inactive`);
    }

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      throw new BadRequestError(`Coupon code "${normalizedCode}" is not yet active`);
    }

    if (coupon.validTo && now > coupon.validTo) {
      throw new BadRequestError(`Coupon code "${normalizedCode}" has expired`);
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestError(`Coupon code "${normalizedCode}" has reached its maximum global usage limit`);
    }

    if (coupon.minOrderValue !== null && context.subtotal < coupon.minOrderValue) {
      throw new BadRequestError(
        `Coupon code "${normalizedCode}" requires a minimum order value of ₹${coupon.minOrderValue.toLocaleString("en-IN")}`
      );
    }

    // Per-user usage limit validation
    if (coupon.perUserLimit !== null && (context.userId || context.customerEmail)) {
      const userUsages = await couponRepository.countUserUsages(
        coupon.id,
        context.userId,
        context.customerEmail
      );
      if (userUsages >= coupon.perUserLimit) {
        throw new BadRequestError(
          `You have reached the maximum usage limit (${coupon.perUserLimit}) for coupon "${normalizedCode}"`
        );
      }
    }

    // First order only validation
    if (coupon.firstOrderOnly && (context.userId || context.customerEmail)) {
      const prevOrders = await couponRepository.countCustomerPreviousOrders(
        context.userId,
        context.customerEmail
      );
      if (prevOrders > 0) {
        throw new BadRequestError(
          `Coupon code "${normalizedCode}" is reserved strictly for maiden orders`
        );
      }
    }

    // Category / Product exclusion checks
    if (coupon.excludedProductIds && coupon.excludedProductIds.length > 0 && context.productIds) {
      const hasExcluded = context.productIds.some((pId) => coupon.excludedProductIds.includes(pId));
      if (hasExcluded) {
        throw new BadRequestError(
          `Coupon code "${normalizedCode}" cannot be applied to some excluded items in your cart`
        );
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (context.subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount !== null && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.discountType === DiscountType.FIXED_AMOUNT) {
      discountAmount = coupon.discountValue;
    }

    // Ensure discount never exceeds subtotal
    discountAmount = Math.min(discountAmount, context.subtotal);
    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      coupon,
      discountAmount,
      message: `Coupon "${normalizedCode}" applied successfully. You saved ₹${discountAmount.toLocaleString("en-IN")}!`,
    };
  }

  async recordRedemption(params: {
    couponId: string;
    userId?: string | null;
    orderId?: string | null;
    customerEmail?: string | null;
    discountApplied: number;
  }): Promise<void> {
    await couponRepository.recordUsage({
      couponId: params.couponId,
      userId: params.userId,
      orderId: params.orderId,
      userEmail: params.customerEmail,
      discountApplied: params.discountApplied,
    });
  }
}

export const couponService = new CouponService();
