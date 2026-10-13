import { prisma } from "@/server/db/prisma";
import { logger } from "@/utils/logger";
import { DiscountType } from "@prisma/client";

export interface StoredCoupon {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  maxUses: number | null;
  usedCount: number;
  perUserLimit: number | null;
  firstOrderOnly: boolean;
  applicableCategoryIds: string[];
  excludedProductIds: string[];
  validFrom: Date;
  validTo: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredCouponUsage {
  id: string;
  couponId: string;
  userId: string | null;
  orderId: string | null;
  userEmail: string | null;
  discountApplied: number;
  createdAt: Date;
}

const DEFAULT_COUPONS: StoredCoupon[] = [
  {
    id: "cpn_leziva10",
    code: "LEZIVA10",
    description: "10% off on luxury couture for orders above ₹5,000 (up to ₹2,500)",
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    minOrderValue: 5000,
    maxDiscount: 2500,
    maxUses: 1000,
    usedCount: 0,
    perUserLimit: 3,
    firstOrderOnly: false,
    applicableCategoryIds: [],
    excludedProductIds: [],
    validFrom: new Date("2026-01-01"),
    validTo: new Date("2028-12-31"),
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
  {
    id: "cpn_royal500",
    code: "ROYAL500",
    description: "Flat ₹500 off on heritage artisanal apparel above ₹8,000",
    discountType: DiscountType.FIXED_AMOUNT,
    discountValue: 500,
    minOrderValue: 8000,
    maxDiscount: 500,
    maxUses: 500,
    usedCount: 0,
    perUserLimit: 2,
    firstOrderOnly: false,
    applicableCategoryIds: [],
    excludedProductIds: [],
    validFrom: new Date("2026-01-01"),
    validTo: new Date("2028-12-31"),
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
  {
    id: "cpn_firstluxe",
    code: "FIRSTLUXE",
    description: "15% off your maiden Leziva ensemble above ₹3,000 (up to ₹3,000)",
    discountType: DiscountType.PERCENTAGE,
    discountValue: 15,
    minOrderValue: 3000,
    maxDiscount: 3000,
    maxUses: 10000,
    usedCount: 0,
    perUserLimit: 1,
    firstOrderOnly: true,
    applicableCategoryIds: [],
    excludedProductIds: [],
    validFrom: new Date("2026-01-01"),
    validTo: new Date("2028-12-31"),
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
  {
    id: "cpn_bridal2000",
    code: "BRIDAL2000",
    description: "Flat ₹2,000 off bridal couture ensembles above ₹25,000",
    discountType: DiscountType.FIXED_AMOUNT,
    discountValue: 2000,
    minOrderValue: 25000,
    maxDiscount: 2000,
    maxUses: 200,
    usedCount: 0,
    perUserLimit: 1,
    firstOrderOnly: false,
    applicableCategoryIds: [],
    excludedProductIds: [],
    validFrom: new Date("2026-01-01"),
    validTo: new Date("2028-12-31"),
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
];

export class CouponRepository {
  private memoryCoupons = new Map<string, StoredCoupon>();
  private memoryUsages: StoredCouponUsage[] = [];

  constructor() {
    for (const c of DEFAULT_COUPONS) {
      this.memoryCoupons.set(c.code.toUpperCase(), { ...c });
    }
  }

  async findByCode(code: string): Promise<StoredCoupon | null> {
    const normalized = code.trim().toUpperCase();
    try {
      const dbCoupon = await prisma.coupon.findUnique({
        where: { code: normalized },
      });
      if (dbCoupon) {
        return {
          id: dbCoupon.id,
          code: dbCoupon.code,
          description: dbCoupon.description,
          discountType: dbCoupon.discountType,
          discountValue: Number(dbCoupon.discountValue),
          minOrderValue: dbCoupon.minOrderValue ? Number(dbCoupon.minOrderValue) : null,
          maxDiscount: dbCoupon.maxDiscount ? Number(dbCoupon.maxDiscount) : null,
          maxUses: dbCoupon.maxUses,
          usedCount: dbCoupon.usedCount,
          perUserLimit: dbCoupon.perUserLimit,
          firstOrderOnly: dbCoupon.firstOrderOnly,
          applicableCategoryIds: dbCoupon.applicableCategoryIds,
          excludedProductIds: dbCoupon.excludedProductIds,
          validFrom: dbCoupon.validFrom,
          validTo: dbCoupon.validTo,
          isActive: dbCoupon.isActive,
          createdAt: dbCoupon.createdAt,
          updatedAt: dbCoupon.updatedAt,
        };
      }
    } catch {
      logger.info("[CouponRepository] Using memory fallback for findByCode");
    }

    return this.memoryCoupons.get(normalized) || null;
  }

  async countUserUsages(couponId: string, userId?: string | null, email?: string | null): Promise<number> {
    try {
      const count = await prisma.couponUsage.count({
        where: {
          couponId,
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(email ? [{ userEmail: email.toLowerCase() }] : []),
          ],
        },
      });
      return count;
    } catch {
      logger.info("[CouponRepository] Using memory fallback for countUserUsages");
      return this.memoryUsages.filter(
        (u) =>
          u.couponId === couponId &&
          ((userId && u.userId === userId) ||
            (email && u.userEmail?.toLowerCase() === email.toLowerCase()))
      ).length;
    }
  }

  async countCustomerPreviousOrders(userId?: string | null, email?: string | null): Promise<number> {
    try {
      const count = await prisma.order.count({
        where: {
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(email ? [{ guestEmail: email.toLowerCase() }] : []),
          ],
          status: { notIn: ["CANCELLED"] },
        },
      });
      return count;
    } catch {
      return 0;
    }
  }

  async recordUsage(params: {
    couponId: string;
    userId?: string | null;
    orderId?: string | null;
    userEmail?: string | null;
    discountApplied: number;
  }): Promise<void> {
    try {
      await prisma.$transaction([
        prisma.couponUsage.create({
          data: {
            couponId: params.couponId,
            userId: params.userId || null,
            orderId: params.orderId || null,
            userEmail: params.userEmail ? params.userEmail.toLowerCase() : null,
            discountApplied: params.discountApplied,
          },
        }),
        prisma.coupon.update({
          where: { id: params.couponId },
          data: { usedCount: { increment: 1 } },
        }),
      ]);
    } catch {
      logger.info("[CouponRepository] Using memory fallback for recordUsage");
      this.memoryUsages.push({
        id: `usg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        couponId: params.couponId,
        userId: params.userId || null,
        orderId: params.orderId || null,
        userEmail: params.userEmail ? params.userEmail.toLowerCase() : null,
        discountApplied: params.discountApplied,
        createdAt: new Date(),
      });
      for (const c of this.memoryCoupons.values()) {
        if (c.id === params.couponId) {
          c.usedCount += 1;
        }
      }
    }
  }

  async upsertCoupon(coupon: StoredCoupon): Promise<StoredCoupon> {
    this.memoryCoupons.set(coupon.code.toUpperCase(), coupon);
    try {
      const upserted = await prisma.coupon.upsert({
        where: { code: coupon.code.toUpperCase() },
        create: {
          code: coupon.code.toUpperCase(),
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderValue: coupon.minOrderValue,
          maxDiscount: coupon.maxDiscount,
          maxUses: coupon.maxUses,
          usedCount: coupon.usedCount,
          perUserLimit: coupon.perUserLimit,
          firstOrderOnly: coupon.firstOrderOnly,
          applicableCategoryIds: coupon.applicableCategoryIds,
          excludedProductIds: coupon.excludedProductIds,
          validFrom: coupon.validFrom,
          validTo: coupon.validTo,
          isActive: coupon.isActive,
        },
        update: {
          description: coupon.description,
          discountValue: coupon.discountValue,
          minOrderValue: coupon.minOrderValue,
          maxDiscount: coupon.maxDiscount,
          isActive: coupon.isActive,
        },
      });
      return {
        ...coupon,
        id: upserted.id,
      };
    } catch {
      return coupon;
    }
  }

  async listCoupons(): Promise<StoredCoupon[]> {
    try {
      const dbCoupons = await prisma.coupon.findMany({
        orderBy: { createdAt: "desc" },
      });
      if (dbCoupons.length > 0) {
        return dbCoupons.map((c) => ({
          id: c.id,
          code: c.code,
          description: c.description,
          discountType: c.discountType,
          discountValue: Number(c.discountValue),
          minOrderValue: c.minOrderValue ? Number(c.minOrderValue) : null,
          maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
          maxUses: c.maxUses,
          usedCount: c.usedCount,
          perUserLimit: c.perUserLimit,
          firstOrderOnly: c.firstOrderOnly,
          applicableCategoryIds: c.applicableCategoryIds,
          excludedProductIds: c.excludedProductIds,
          validFrom: c.validFrom,
          validTo: c.validTo,
          isActive: c.isActive,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));
      }
    } catch {
      // Memory fallback
    }
    return Array.from(this.memoryCoupons.values());
  }
}

export const couponRepository = new CouponRepository();
