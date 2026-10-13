import { wishlistRepository } from "@/server/repositories/wishlist.repository";
import { productRepository } from "@/server/repositories/product.repository";
import { Product } from "@/shared/types";
import { BadRequestError, NotFoundError } from "@/utils/errors";
import { logger } from "@/utils/logger";

export interface WishlistIdentification {
  userId?: string | null;
  guestWishlistId?: string | null;
}

export class WishlistService {
  /**
   * Retrieves all active products in the customer or guest wishlist.
   */
  async getWishlist(auth: WishlistIdentification): Promise<Product[]> {
    const { userId, guestWishlistId } = auth;
    if (!userId && !guestWishlistId) {
      return [];
    }

    const items = await wishlistRepository.findItems({
      userId: userId || undefined,
      sessionToken: guestWishlistId || undefined,
    });

    const products: Product[] = [];
    for (const item of items) {
      const product = await productRepository.findById(item.productId);
      if (product && product.status === "ACTIVE" && product.isActive) {
        products.push(product);
      }
    }

    return products;
  }

  /**
   * Adds product to wishlist. Validates product exists and is ACTIVE.
   */
  async addToWishlist(
    productId: string,
    auth: WishlistIdentification,
    variantId?: string | null
  ): Promise<Product[]> {
    if (!auth.userId && !auth.guestWishlistId) {
      throw new BadRequestError("Wishlist identifier (user session or guest token) required.");
    }

    const product = await productRepository.findById(productId);
    if (!product || product.status !== "ACTIVE" || !product.isActive) {
      throw new NotFoundError("Product not found or unavailable for wishlist.");
    }

    await wishlistRepository.addItem({
      userId: auth.userId || undefined,
      sessionToken: auth.guestWishlistId || undefined,
      productId,
      variantId,
    });

    logger.info(
      `Added product ${productId} to wishlist for ${auth.userId || auth.guestWishlistId}`,
      undefined,
      "WishlistService"
    );

    return this.getWishlist(auth);
  }

  /**
   * Removes product from wishlist.
   */
  async removeFromWishlist(
    productId: string,
    auth: WishlistIdentification
  ): Promise<Product[]> {
    await wishlistRepository.removeItem({
      userId: auth.userId || undefined,
      sessionToken: auth.guestWishlistId || undefined,
      productId,
    });

    return this.getWishlist(auth);
  }

  /**
   * Checks if product is currently wishlisted.
   */
  async isInWishlist(
    productId: string,
    auth: WishlistIdentification
  ): Promise<boolean> {
    const items = await wishlistRepository.findItems({
      userId: auth.userId || undefined,
      sessionToken: auth.guestWishlistId || undefined,
    });

    return items.some((item) => item.productId === productId);
  }

  /**
   * Merges guest wishlist into customer account upon login.
   */
  async mergeGuestWishlist(
    userId: string,
    guestWishlistId: string
  ): Promise<Product[]> {
    if (!guestWishlistId || !userId) {
      return this.getWishlist({ userId });
    }

    const guestItems = await wishlistRepository.findItems({
      sessionToken: guestWishlistId,
    });

    for (const item of guestItems) {
      const product = await productRepository.findById(item.productId);
      if (product && product.status === "ACTIVE" && product.isActive) {
        await wishlistRepository.addItem({
          userId,
          productId: item.productId,
          variantId: item.variantId,
        });
      }
    }

    // Clean up guest entries
    await wishlistRepository.clearGuestWishlist(guestWishlistId);

    logger.info(
      `Merged guest wishlist ${guestWishlistId} into user ${userId}`,
      undefined,
      "WishlistService"
    );

    return this.getWishlist({ userId });
  }
}

export const wishlistService = new WishlistService();
export default wishlistService;
