"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Product } from "@/shared/types";

interface WishlistContextType {
  items: Product[];
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const WISHLIST_STORAGE_KEY = "leziva_wishlist_v1";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const refreshWishlist = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/wishlist", {
        cache: "no-store",
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload?.success && Array.isArray(payload?.data)) {
          setItems(payload.data);
          try {
            localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(payload.data));
          } catch {
            // Ignore quota
          }
        }
      }
    } catch {
      // Offline fallback
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
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
      refreshWishlist();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshWishlist]);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
      } catch {
        // Ignore
      }
    }
  }, [items, isInitialized]);

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.id === productId);
  };

  const toggleWishlist = async (product: Product) => {
    const exists = items.some((item) => item.id === product.id);

    // Optimistic update
    setItems((prev) => {
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      }
      return [...prev, product];
    });

    try {
      if (exists) {
        await fetch(`/api/v1/wishlist/${product.id}`, { method: "DELETE" });
      } else {
        await fetch("/api/v1/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        });
      }
    } catch {
      // Offline fallback
    }
  };

  const removeFromWishlist = async (productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
    try {
      await fetch(`/api/v1/wishlist/${productId}`, { method: "DELETE" });
    } catch {
      // Offline fallback
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        wishlistCount: items.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
