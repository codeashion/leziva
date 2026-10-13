import { cartRepository } from "@/server/repositories/cart.repository";
import { productRepository } from "@/server/repositories/product.repository";
import { Cart, CartItem } from "@/shared/types";
import { BadRequestError, NotFoundError } from "@/utils/errors";
import { logger } from "@/utils/logger";

const FREE_SHIPPING_THRESHOLD = 2999;
const STANDARD_SHIPPING_FEE = 250;
const MAX_ITEM_QUANTITY = 10;

export interface CartIdentification {
  userId?: string | null;
  guestCartId?: string | null;
}

export class CartService {
  /**
   * Retrieves and authoritatively calculates cart summary.
   */
  async getCart(auth: CartIdentification): Promise<Cart> {
    const { userId, guestCartId } = auth;
    if (!userId && !guestCartId) {
      return this.getEmptyCart();
    }

    const storedCart = await cartRepository.findCart({
      userId: userId || undefined,
      sessionToken: guestCartId || undefined,
    });

    if (!storedCart || storedCart.items.length === 0) {
      return this.getEmptyCart(storedCart?.id);
    }

    const enrichedItems: CartItem[] = [];
    const warnings: string[] = [];

    for (const item of storedCart.items) {
      const variantData = await productRepository.findVariantById(item.variantId);
      if (!variantData) {
        warnings.push("An item in your cart is no longer available and was omitted.");
        continue;
      }

      const { variant, product } = variantData;

      // Ensure product is active and published
      if (product.status !== "ACTIVE" || !product.isActive || !variant.isActive) {
        warnings.push(`"${product.title}" is currently unavailable.`);
        continue;
      }

      const availableStock = variant.inventoryQuantity;
      let effectiveQuantity = item.quantity;

      if (availableStock <= 0) {
        warnings.push(`"${product.title} (${variant.title})" is currently out of stock.`);
        continue;
      }

      if (effectiveQuantity > availableStock) {
        effectiveQuantity = availableStock;
        warnings.push(
          `Quantity for "${product.title} (${variant.title})" was adjusted to available stock (${availableStock}).`
        );
        // Persist the adjusted quantity
        await cartRepository.upsertCartItem(storedCart.id, variant.id, effectiveQuantity);
      }

      const isLowStock = availableStock <= (variant.lowStockThreshold || 3);
      if (isLowStock && availableStock > 0) {
        warnings.push(`Only ${availableStock} unit(s) left in stock for "${product.title}".`);
      }

      const unitPrice = variant.price;
      const totalPrice = unitPrice * effectiveQuantity;
      const imageThumbnail =
        variant.imageUrl ||
        product.images.find((img) => img.isPrimary)?.url ||
        product.images[0]?.url ||
        "/images/catalog/cat_sarees.jpg";

      enrichedItems.push({
        id: item.id,
        cartId: storedCart.id,
        variantId: variant.id,
        quantity: effectiveQuantity,
        unitPrice,
        totalPrice,
        productTitle: product.title,
        variantTitle: variant.title,
        imageThumbnail,
        sku: variant.sku,
        size: variant.size,
        colorName: variant.colorName,
        maxAvailable: availableStock,
        isLowStock,
      });
    }

    const subtotal = enrichedItems.reduce((acc, i) => acc + (i.totalPrice || 0), 0);
    const itemCount = enrichedItems.reduce((acc, i) => acc + i.quantity, 0);
    const shippingEstimate = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : (subtotal > 0 ? STANDARD_SHIPPING_FEE : 0);
    const grandTotal = subtotal + shippingEstimate;

    return {
      id: storedCart.id,
      items: enrichedItems,
      itemCount,
      subtotal,
      discountTotal: 0,
      couponCode: storedCart.couponCode,
      shippingEstimate,
      grandTotal,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Add variant to cart with authoritative server pricing and stock verification.
   */
  async addItem(
    auth: CartIdentification,
    variantId: string,
    quantity: number = 1
  ): Promise<Cart> {
    if (!auth.userId && !auth.guestCartId) {
      throw new BadRequestError("Cart identifier (user session or guest token) required.");
    }

    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new BadRequestError("Quantity must be a positive integer.");
    }

    if (quantity > MAX_ITEM_QUANTITY) {
      throw new BadRequestError(`Cannot add more than ${MAX_ITEM_QUANTITY} units of a single item.`);
    }

    // 1. Authoritative lookup of variant & product
    const variantData = await productRepository.findVariantById(variantId);
    if (!variantData) {
      throw new NotFoundError(`Product variant not found: ${variantId}`);
    }

    const { variant, product } = variantData;

    if (product.status !== "ACTIVE" || !product.isActive || !variant.isActive) {
      throw new BadRequestError("This product variant is currently not available for purchase.");
    }

    // 2. Fetch or create cart
    const cart = await cartRepository.getOrCreateCart({
      userId: auth.userId || undefined,
      sessionToken: auth.guestCartId || undefined,
    });

    // 3. Check existing item in cart
    const existingItem = cart.items.find((i) => i.variantId === variantId);
    const currentQty = existingItem ? existingItem.quantity : 0;
    const requestedTotalQty = currentQty + quantity;

    if (requestedTotalQty > MAX_ITEM_QUANTITY) {
      throw new BadRequestError(
        `Total quantity in cart cannot exceed ${MAX_ITEM_QUANTITY} units for this item.`
      );
    }

    // 4. Verify inventory
    const availableStock = variant.inventoryQuantity;
    if (availableStock <= 0) {
      throw new BadRequestError(`"${product.title}" is currently out of stock.`);
    }

    if (requestedTotalQty > availableStock) {
      throw new BadRequestError(
        `Cannot add ${quantity} more. Only ${availableStock} unit(s) available in total (you currently have ${currentQty} in cart).`
      );
    }

    // 5. Authoritative persistence
    await cartRepository.upsertCartItem(cart.id, variantId, requestedTotalQty);

    logger.info(
      `Added variant ${variantId} (qty: ${quantity}, new total: ${requestedTotalQty}) to cart ${cart.id}`,
      undefined,
      "CartService"
    );

    return this.getCart(auth);
  }

  /**
   * Update quantity of a cart line item.
   */
  async updateQuantity(
    auth: CartIdentification,
    itemId: string,
    quantity: number
  ): Promise<Cart> {
    if (quantity <= 0) {
      return this.removeItem(auth, itemId);
    }

    if (quantity > MAX_ITEM_QUANTITY) {
      throw new BadRequestError(`Cannot set more than ${MAX_ITEM_QUANTITY} units per item.`);
    }

    const cart = await cartRepository.findCart({
      userId: auth.userId || undefined,
      sessionToken: auth.guestCartId || undefined,
    });

    if (!cart) {
      throw new NotFoundError("Cart not found.");
    }

    const item = cart.items.find((i) => i.id === itemId || i.variantId === itemId);
    if (!item) {
      throw new NotFoundError("Cart item not found.");
    }

    // Verify stock
    const variantData = await productRepository.findVariantById(item.variantId);
    if (!variantData) {
      throw new NotFoundError("Associated variant no longer exists.");
    }

    const availableStock = variantData.variant.inventoryQuantity;
    if (quantity > availableStock) {
      throw new BadRequestError(`Only ${availableStock} unit(s) available in stock.`);
    }

    await cartRepository.upsertCartItem(cart.id, item.variantId, quantity);

    return this.getCart(auth);
  }

  /**
   * Remove line item from cart.
   */
  async removeItem(auth: CartIdentification, itemId: string): Promise<Cart> {
    const cart = await cartRepository.findCart({
      userId: auth.userId || undefined,
      sessionToken: auth.guestCartId || undefined,
    });

    if (cart) {
      await cartRepository.removeItem(cart.id, itemId);
    }

    return this.getCart(auth);
  }

  /**
   * Clear all items from cart.
   */
  async clearCart(auth: CartIdentification): Promise<Cart> {
    const cart = await cartRepository.findCart({
      userId: auth.userId || undefined,
      sessionToken: auth.guestCartId || undefined,
    });

    if (cart) {
      await cartRepository.clearCart(cart.id);
    }

    return this.getEmptyCart(cart?.id);
  }

  /**
   * Merges guest items into authenticated customer cart upon login.
   */
  async mergeGuestCart(userId: string, guestCartId: string): Promise<Cart> {
    if (!guestCartId || !userId) {
      return this.getCart({ userId });
    }

    const guestCart = await cartRepository.findCart({ sessionToken: guestCartId });
    if (!guestCart || guestCart.items.length === 0) {
      return this.getCart({ userId });
    }

    // Ensure user has an active cart
    const userCart = await cartRepository.getOrCreateCart({ userId });
    const warnings: string[] = [];

    for (const guestItem of guestCart.items) {
      const variantData = await productRepository.findVariantById(guestItem.variantId);
      if (!variantData) continue;

      const { variant, product } = variantData;
      if (product.status !== "ACTIVE" || !product.isActive || !variant.isActive) continue;

      const availableStock = variant.inventoryQuantity;
      if (availableStock <= 0) {
        warnings.push(`"${product.title}" from guest cart is out of stock and was not merged.`);
        continue;
      }

      // Find existing item in user cart
      const existingUserItem = userCart.items.find((i) => i.variantId === guestItem.variantId);
      const currentUserQty = existingUserItem ? existingUserItem.quantity : 0;
      let mergedQty = currentUserQty + guestItem.quantity;

      if (mergedQty > availableStock) {
        mergedQty = availableStock;
        warnings.push(
          `Merged quantity for "${product.title}" was capped at available stock (${availableStock}).`
        );
      }

      mergedQty = Math.min(MAX_ITEM_QUANTITY, mergedQty);

      await cartRepository.upsertCartItem(userCart.id, variant.id, mergedQty);
    }

    // Clean up guest cart after merge
    await cartRepository.clearCart(guestCart.id);
    await cartRepository.deleteCart(guestCart.id);

    logger.info(
      `Merged guest cart ${guestCartId} into user cart ${userCart.id} for user ${userId}`,
      undefined,
      "CartService"
    );

    const finalCart = await this.getCart({ userId });
    if (warnings.length > 0) {
      finalCart.warnings = [...(finalCart.warnings || []), ...warnings];
    }
    return finalCart;
  }

  private getEmptyCart(id: string = "empty_cart"): Cart {
    return {
      id,
      items: [],
      itemCount: 0,
      subtotal: 0,
      discountTotal: 0,
      shippingEstimate: 0,
      grandTotal: 0,
    };
  }
}

export const cartService = new CartService();
export default cartService;
