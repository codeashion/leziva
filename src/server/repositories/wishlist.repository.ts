import { prisma } from "@/server/db/prisma";
import { logger } from "@/utils/logger";

export interface StoredWishlistItem {
  id: string;
  userId: string | null;
  sessionToken: string | null;
  productId: string;
  variantId: string | null;
  createdAt: Date;
}

export class WishlistRepository {
  private memoryWishlist: StoredWishlistItem[] = [];

  async findItems(params: { userId?: string | null; sessionToken?: string | null }): Promise<StoredWishlistItem[]> {
    const { userId, sessionToken } = params;

    try {
      const dbItems = await prisma.wishlistItem.findMany({
        where: {
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(sessionToken ? [{ sessionToken }] : []),
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      if (dbItems.length > 0) {
        return dbItems.map((item) => ({
          id: item.id,
          userId: item.userId,
          sessionToken: item.sessionToken,
          productId: item.productId,
          variantId: item.variantId,
          createdAt: item.createdAt,
        }));
      }
    } catch {
      logger.info("Using resilient in-memory wishlist fallback", undefined, "WishlistRepository");
    }

    return this.memoryWishlist.filter((item) => {
      if (userId && item.userId === userId) return true;
      if (sessionToken && item.sessionToken === sessionToken) return true;
      return false;
    });
  }

  async addItem(params: {
    userId?: string | null;
    sessionToken?: string | null;
    productId: string;
    variantId?: string | null;
  }): Promise<StoredWishlistItem> {
    const { userId, sessionToken, productId, variantId } = params;
    const now = new Date();
    const itemId = `wsh_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    try {
      if (userId) {
        const item = await prisma.wishlistItem.upsert({
          where: {
            userId_productId: { userId, productId },
          },
          update: {
            variantId: variantId || null,
          },
          create: {
            id: itemId,
            userId,
            sessionToken: sessionToken || null,
            productId,
            variantId: variantId || null,
            createdAt: now,
          },
        });
        return item;
      }
    } catch {
      // Memory fallback
    }

    // Memory store
    const existing = this.memoryWishlist.find(
      (i) =>
        (userId ? i.userId === userId : i.sessionToken === sessionToken) &&
        i.productId === productId
    );

    if (existing) {
      existing.variantId = variantId || null;
      return existing;
    }

    const newItem: StoredWishlistItem = {
      id: itemId,
      userId: userId || null,
      sessionToken: sessionToken || null,
      productId,
      variantId: variantId || null,
      createdAt: now,
    };
    this.memoryWishlist.push(newItem);
    return newItem;
  }

  async removeItem(params: {
    userId?: string | null;
    sessionToken?: string | null;
    productId: string;
  }): Promise<boolean> {
    const { userId, sessionToken, productId } = params;

    try {
      if (userId) {
        await prisma.wishlistItem.deleteMany({
          where: { userId, productId },
        });
      } else if (sessionToken) {
        await prisma.wishlistItem.deleteMany({
          where: { sessionToken, productId },
        });
      }
    } catch {
      // Memory fallback
    }

    this.memoryWishlist = this.memoryWishlist.filter(
      (i) =>
        !(
          (userId ? i.userId === userId : i.sessionToken === sessionToken) &&
          i.productId === productId
        )
    );
    return true;
  }

  async clearGuestWishlist(sessionToken: string): Promise<void> {
    try {
      await prisma.wishlistItem.deleteMany({
        where: { sessionToken },
      });
    } catch {
      this.memoryWishlist = this.memoryWishlist.filter((i) => i.sessionToken !== sessionToken);
    }
  }
}

export const wishlistRepository = new WishlistRepository();
export default wishlistRepository;
