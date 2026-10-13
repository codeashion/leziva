"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Product, ProductVariant } from "@/shared/types";

export interface CartLineItem {
  id: string; // unique item id (or variantId)
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

interface CartContextType {
  items: CartLineItem[];
  itemCount: number;
  subtotal: number;
  freeShippingThreshold: number;
  isFreeShippingEligible: boolean;
  amountUntilFreeShipping: number;
  isCartOpen: boolean;
  isLoading: boolean;
  error: string | null;
  warnings: string[];
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FREE_SHIPPING_THRESHOLD = 2999;
const CART_STORAGE_KEY = "leziva_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync with backend API
  const refreshCart = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/v1/cart", {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (res.ok) {
        const payload = await res.json();
        if (payload?.success && payload?.data) {
          const serverCart = payload.data;
          if (Array.isArray(serverCart.warnings)) {
            setWarnings(serverCart.warnings);
          }

          // If server cart has items, map them to CartLineItem
          if (Array.isArray(serverCart.items) && serverCart.items.length > 0) {
            setItems((prevItems) => {
              const mappedItems: CartLineItem[] = serverCart.items.map(
                (si: {
                  id: string;
                  variantId: string;
                  quantity: number;
                  unitPrice: number;
                  productTitle: string;
                  variantTitle: string;
                  sku: string;
                  size?: string;
                  colorName?: string;
                  imageThumbnail?: string;
                }) => {
                  // Check if we already have local product reference for richer client details
                  const localMatch = prevItems.find((li) => li.variant.id === si.variantId);
                  if (localMatch) {
                    return {
                      ...localMatch,
                      id: si.id,
                      quantity: si.quantity,
                      variant: {
                        ...localMatch.variant,
                        price: si.unitPrice,
                      },
                    };
                  }

                  // Construct fallback Product and Variant object from server response
                  const fallbackVariant: ProductVariant = {
                    id: si.variantId,
                    productId: si.variantId,
                    sku: si.sku,
                    title: si.variantTitle,
                    size: (si.size as ProductVariant["size"]) || "FREE_SIZE",
                    colorName: si.colorName || "Editorial Palette",
                    colorHex: "#226192",
                    price: si.unitPrice,
                    inventoryQuantity: 10,
                    weightGrams: 800,
                    isActive: true,
                  };

                  const fallbackProduct: Product = {
                    id: si.variantId,
                    title: si.productTitle,
                    slug: si.productTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    description: "",
                    categoryId: "cat_sarees",
                    isFeatured: false,
                    isActive: true,
                    tags: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    images: [
                      {
                        id: `img_${si.variantId}`,
                        productId: si.variantId,
                        url: si.imageThumbnail || "/images/catalog/cat_sarees.jpg",
                        sortOrder: 1,
                        isPrimary: true,
                      },
                    ],
                    variants: [fallbackVariant],
                  };

                  return {
                    id: si.id,
                    product: fallbackProduct,
                    variant: fallbackVariant,
                    quantity: si.quantity,
                  };
                }
              );

              try {
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(mappedItems));
              } catch {
                // Ignore quota
              }

              return mappedItems;
            });
          }
        }
      }
    } catch {
      // Backend not yet available or fetch failed
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  // Initial load from storage and background server fetch
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          queueMicrotask(() => {
            setItems(parsed);
          });
        }
      }
    } catch {
      // Ignore
    }

    const timer = setTimeout(() => {
      refreshCart();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshCart]);

  // Update storage upon changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch {
        // Ignore
      }
    }
  }, [items, isInitialized]);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce(
    (acc, item) => acc + item.variant.price * item.quantity,
    0
  );

  const isFreeShippingEligible = subtotal >= FREE_SHIPPING_THRESHOLD;
  const amountUntilFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addItem = async (
    product: Product,
    variant: ProductVariant,
    quantity: number = 1
  ) => {
    const lineId = `${product.id}_${variant.id}`;
    setError(null);

    // Optimistic UI update
    setItems((prev) => {
      const existing = prev.find((item) => item.variant.id === variant.id);
      if (existing) {
        return prev.map((item) =>
          item.variant.id === variant.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { id: lineId, product, variant, quantity }];
    });
    setIsCartOpen(true);

    // Server synchronization
    try {
      const res = await fetch("/api/v1/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: variant.id,
          quantity,
        }),
      });

      if (!res.ok) {
        const errPayload = await res.json().catch(() => null);
        const errMsg = errPayload?.error?.message || "Failed to add item to cart.";
        setError(errMsg);
        // Rollback optimistic update
        await refreshCart();
      } else {
        const payload = await res.json();
        if (payload?.data?.warnings) {
          setWarnings(payload.data.warnings);
        }
      }
    } catch {
      // Offline resilience
    }
  };

  const removeItem = async (itemId: string) => {
    setError(null);
    const targetItem = items.find((i) => i.id === itemId || i.variant.id === itemId);
    setItems((prev) => prev.filter((item) => item.id !== itemId && item.variant.id !== itemId));

    try {
      const serverItemId = targetItem?.id || itemId;
      await fetch(`/api/v1/cart/items/${serverItemId}`, {
        method: "DELETE",
      });
    } catch {
      // Graceful
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    setError(null);
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId || item.variant.id === itemId
          ? { ...item, quantity }
          : item
      )
    );

    try {
      const targetItem = items.find((i) => i.id === itemId || i.variant.id === itemId);
      const serverItemId = targetItem?.id || itemId;

      const res = await fetch(`/api/v1/cart/items/${serverItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      if (!res.ok) {
        const errPayload = await res.json().catch(() => null);
        setError(errPayload?.error?.message || "Failed to update item quantity.");
        await refreshCart();
      }
    } catch {
      // Graceful
    }
  };

  const clearCart = async () => {
    setError(null);
    setItems([]);
    try {
      await fetch("/api/v1/cart", { method: "DELETE" });
    } catch {
      // Graceful
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        isFreeShippingEligible,
        amountUntilFreeShipping,
        isCartOpen,
        isLoading,
        error,
        warnings,
        openCart,
        closeCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
