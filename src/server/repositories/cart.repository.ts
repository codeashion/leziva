import { prisma } from "@/server/db/prisma";
import { logger } from "@/utils/logger";

export interface StoredCartItem {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredCart {
  id: string;
  userId: string | null;
  sessionToken: string | null;
  couponCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: StoredCartItem[];
}

export class CartRepository {
  private memoryCarts = new Map<string, StoredCart>();

  /**
   * Find cart by userId or sessionToken (guestId)
   */
  async findCart(params: { userId?: string | null; sessionToken?: string | null }): Promise<StoredCart | null> {
    const { userId, sessionToken } = params;

    try {
      const dbCart = await prisma.cart.findFirst({
        where: {
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(sessionToken ? [{ sessionToken }] : []),
          ],
        },
        include: {
          items: true,
        },
      });

      if (dbCart) {
        return {
          id: dbCart.id,
          userId: dbCart.userId,
          sessionToken: dbCart.sessionToken,
          couponCode: dbCart.couponCode,
          createdAt: dbCart.createdAt,
          updatedAt: dbCart.updatedAt,
          items: dbCart.items.map((i) => ({
            id: i.id,
            cartId: i.cartId,
            variantId: i.variantId,
            quantity: i.quantity,
            createdAt: i.createdAt,
            updatedAt: i.updatedAt,
          })),
        };
      }
    } catch {
      logger.info("Using resilient in-memory cart repository fallback", undefined, "CartRepository");
    }

    // Memory fallback lookup
    for (const cart of this.memoryCarts.values()) {
      if (userId && cart.userId === userId) return cart;
      if (sessionToken && cart.sessionToken === sessionToken) return cart;
    }

    return null;
  }

  /**
   * Create or return active cart
   */
  async getOrCreateCart(params: { userId?: string | null; sessionToken?: string | null }): Promise<StoredCart> {
    const existing = await this.findCart(params);
    if (existing) return existing;

    const cartId = `crt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date();

    try {
      const created = await prisma.cart.create({
        data: {
          id: cartId,
          userId: params.userId || null,
          sessionToken: params.sessionToken || null,
        },
        include: { items: true },
      });

      return {
        id: created.id,
        userId: created.userId,
        sessionToken: created.sessionToken,
        couponCode: created.couponCode,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        items: [],
      };
    } catch {
      // Memory fallback
      const newCart: StoredCart = {
        id: cartId,
        userId: params.userId || null,
        sessionToken: params.sessionToken || null,
        couponCode: null,
        createdAt: now,
        updatedAt: now,
        items: [],
      };
      this.memoryCarts.set(cartId, newCart);
      return newCart;
    }
  }

  /**
   * Add or update quantity of variant in cart
   */
  async upsertCartItem(cartId: string, variantId: string, quantity: number): Promise<StoredCartItem> {
    const now = new Date();
    const itemId = `citem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    try {
      const dbItem = await prisma.cartItem.upsert({
        where: {
          cartId_variantId: { cartId, variantId },
        },
        update: {
          quantity,
          updatedAt: now,
        },
        create: {
          id: itemId,
          cartId,
          variantId,
          quantity,
          createdAt: now,
          updatedAt: now,
        },
      });

      return {
        id: dbItem.id,
        cartId: dbItem.cartId,
        variantId: dbItem.variantId,
        quantity: dbItem.quantity,
        createdAt: dbItem.createdAt,
        updatedAt: dbItem.updatedAt,
      };
    } catch {
      // Memory fallback
      let cart = this.memoryCarts.get(cartId);
      if (!cart) {
        cart = {
          id: cartId,
          userId: null,
          sessionToken: null,
          couponCode: null,
          createdAt: now,
          updatedAt: now,
          items: [],
        };
        this.memoryCarts.set(cartId, cart);
      }

      const existingIndex = cart.items.findIndex((i) => i.variantId === variantId);
      if (existingIndex >= 0) {
        cart.items[existingIndex].quantity = quantity;
        cart.items[existingIndex].updatedAt = now;
        return cart.items[existingIndex];
      }

      const newItem: StoredCartItem = {
        id: itemId,
        cartId,
        variantId,
        quantity,
        createdAt: now,
        updatedAt: now,
      };
      cart.items.push(newItem);
      return newItem;
    }
  }

  /**
   * Remove single item from cart
   */
  async removeItem(cartId: string, itemId: string): Promise<boolean> {
    try {
      await prisma.cartItem.deleteMany({
        where: {
          id: itemId,
          cartId,
        },
      });
      return true;
    } catch {
      const cart = this.memoryCarts.get(cartId);
      if (cart) {
        cart.items = cart.items.filter((i) => i.id !== itemId && i.variantId !== itemId);
        return true;
      }
      return false;
    }
  }

  /**
   * Clear all items in cart
   */
  async clearCart(cartId: string): Promise<void> {
    try {
      await prisma.cartItem.deleteMany({
        where: { cartId },
      });
    } catch {
      const cart = this.memoryCarts.get(cartId);
      if (cart) {
        cart.items = [];
      }
    }
  }

  /**
   * Delete cart entirely (used after merging guest cart)
   */
  async deleteCart(cartId: string): Promise<void> {
    try {
      await prisma.cart.delete({
        where: { id: cartId },
      });
    } catch {
      this.memoryCarts.delete(cartId);
    }
  }
}

export const cartRepository = new CartRepository();
export default cartRepository;
