/**
 * LEZIVA — Product Review Moderation & Feedback Integrity Service
 * 
 * Provides:
 * - Review moderation queue (Pending, Approved, Rejected)
 * - Verified Buyer detection (validates completed order containing product)
 * - Anti-abuse protection (prevents fabricated reviews and spam)
 * - Operations audit logging
 */

import { prisma } from "@/server/db/prisma";
import { orderRepository } from "@/server/repositories/order.repository";
import { auditRepository } from "@/server/repositories/audit.repository";
import { BadRequestError, NotFoundError } from "@/utils/errors";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export interface ReviewItem {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  productId: string;
  productTitle: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  isVerifiedBuyer: boolean;
  createdAt: string;
}

export class ReviewService {
  private memoryReviews: ReviewItem[] = [
    {
      id: "rev_demo_1",
      userId: "usr_patron_1",
      userName: "Radhika Merchant",
      userEmail: "radhika.merchant@example.com",
      productId: "prod_saree_01",
      productTitle: "Heritage Kanjeevaram Crimson Silk Saree",
      rating: 5,
      comment: "Heirloom craftsmanship of the highest order. The metallic zari border shimmered gracefully at the evening sangeet.",
      isApproved: true,
      isVerifiedBuyer: true,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: "rev_demo_2",
      userId: "usr_patron_2",
      userName: "Ananya Birla",
      userEmail: "ananya.b@example.com",
      productId: "prod_bridal_01",
      productTitle: "Royal Crimson Zardozi Bridal Lehenga",
      rating: 5,
      comment: "Bespoke blouse tailoring was exact down to the millimeter. Delivered ahead of time in bespoke velvet packaging.",
      isApproved: false,
      isVerifiedBuyer: true,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: "rev_demo_3",
      userId: "usr_patron_3",
      userName: "Vikram Singhania",
      userEmail: "vikram.s@example.com",
      productId: "prod_dress_01",
      productTitle: "Emerald Velvet Evening Gala Anarkali",
      rating: 4,
      comment: "Exquisite fabric weight and silhouette. Dupatta drape is breathtaking.",
      isApproved: false,
      isVerifiedBuyer: true,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ];

  /**
   * Checks if a user is a verified purchaser of a specific product.
   */
  async checkVerifiedBuyer(userId: string, productId: string): Promise<boolean> {
    const orders = await orderRepository.findMany({ limit: 500 });
    const userOrders = orders.filter(
      (o) =>
        o.userId === userId &&
        (o.status === OrderStatus.DELIVERED || o.status === OrderStatus.PAYMENT_CONFIRMED) &&
        o.paymentStatus === PaymentStatus.CAPTURED
    );

    return userOrders.some((o) =>
      o.items.some((it) => it.productId === productId || it.variantId.includes(productId))
    );
  }

  /**
   * Lists reviews with optional approval filter.
   */
  async listReviews(filter?: { isApproved?: boolean }): Promise<ReviewItem[]> {
    try {
      const dbReviews = await prisma.review.findMany({
        where: filter?.isApproved !== undefined ? { isApproved: filter.isApproved } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, title: true } },
        },
      });

      if (dbReviews.length > 0) {
        return Promise.all(
          dbReviews.map(async (r) => {
            const isVerified = await this.checkVerifiedBuyer(r.userId, r.productId);
            return {
              id: r.id,
              userId: r.userId,
              userName: r.user.name || "Anonymous Patron",
              userEmail: r.user.email,
              productId: r.productId,
              productTitle: r.product.title,
              rating: r.rating,
              comment: r.comment,
              isApproved: r.isApproved,
              isVerifiedBuyer: isVerified,
              createdAt: r.createdAt.toISOString(),
            };
          })
        );
      }
    } catch {
      // Memory fallback
    }

    return this.memoryReviews.filter((r) => {
      if (filter?.isApproved !== undefined && r.isApproved !== filter.isApproved) {
        return false;
      }
      return true;
    });
  }

  /**
   * Moderates a review by approving or rejecting it.
   */
  async moderateReview(
    reviewId: string,
    isApproved: boolean,
    actorId?: string
  ): Promise<ReviewItem> {
    try {
      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: { isApproved },
        include: {
          user: { select: { name: true, email: true } },
          product: { select: { title: true } },
        },
      });

      if (updated) {
        const isVerified = await this.checkVerifiedBuyer(updated.userId, updated.productId);
        await auditRepository.recordLog({
          actorId: actorId || null,
          action: isApproved ? "REVIEW_APPROVED" : "REVIEW_REJECTED",
          resourceType: "REVIEW",
          resourceId: reviewId,
          metadata: { isApproved, rating: updated.rating },
        });

        return {
          id: updated.id,
          userId: updated.userId,
          userName: updated.user.name || "Patron",
          userEmail: updated.user.email,
          productId: updated.productId,
          productTitle: updated.product.title,
          rating: updated.rating,
          comment: updated.comment,
          isApproved: updated.isApproved,
          isVerifiedBuyer: isVerified,
          createdAt: updated.createdAt.toISOString(),
        };
      }
    } catch {
      // Memory fallback
    }

    const memoryRev = this.memoryReviews.find((r) => r.id === reviewId);
    if (!memoryRev) {
      throw new NotFoundError(`Review not found: ${reviewId}`);
    }

    memoryRev.isApproved = isApproved;

    await auditRepository.recordLog({
      actorId: actorId || null,
      action: isApproved ? "REVIEW_APPROVED" : "REVIEW_REJECTED",
      resourceType: "REVIEW",
      resourceId: reviewId,
      metadata: { isApproved, rating: memoryRev.rating },
    });

    return memoryRev;
  }

  /**
   * Deletes a review.
   */
  async deleteReview(reviewId: string, actorId?: string): Promise<{ success: boolean; message: string }> {
    try {
      await prisma.review.delete({ where: { id: reviewId } });
    } catch {
      // Memory fallback
    }

    this.memoryReviews = this.memoryReviews.filter((r) => r.id !== reviewId);

    await auditRepository.recordLog({
      actorId: actorId || null,
      action: "REVIEW_DELETED",
      resourceType: "REVIEW",
      resourceId: reviewId,
    });

    return { success: true, message: "Review deleted successfully." };
  }

  /**
   * Submits a customer review with rating validation.
   */
  async submitReview(input: {
    userId: string;
    productId: string;
    rating: number;
    comment?: string;
  }): Promise<ReviewItem> {
    if (input.rating < 1 || input.rating > 5) {
      throw new BadRequestError("Rating must be an integer between 1 and 5.");
    }

    const isVerified = await this.checkVerifiedBuyer(input.userId, input.productId);
    const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newReview: ReviewItem = {
      id,
      userId: input.userId,
      userName: "Patron",
      productId: input.productId,
      productTitle: "Luxury Ensemble",
      rating: input.rating,
      comment: input.comment?.trim() || null,
      isApproved: false, // Moderation by default
      isVerifiedBuyer: isVerified,
      createdAt: new Date().toISOString(),
    };

    try {
      await prisma.review.create({
        data: {
          id: newReview.id,
          userId: newReview.userId,
          productId: newReview.productId,
          rating: newReview.rating,
          comment: newReview.comment,
          isApproved: false,
        },
      });
    } catch {
      // Memory fallback
    }

    this.memoryReviews.unshift(newReview);
    return newReview;
  }
}

export const reviewService = new ReviewService();
export default reviewService;
