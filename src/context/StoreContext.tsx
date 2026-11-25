"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product, CartItem, Order, Coupon } from "@/types";
import { PRODUCTS as INITIAL_CATALOG, BRAND_DEFAULT, INITIAL_COUPONS, INITIAL_ORDERS } from "@/lib/constants";

interface StoreContextType {
  // Brand Configuration
  brandConfig: {
    name: string;
    tagline: string;
    announcement: string;
    freeShippingThreshold: number;
    currency: string;
  };
  updateBrandConfig: (newConfig: Partial<typeof BRAND_DEFAULT>) => void;

  // Products
  products: Product[];
  addProduct: (newProd: Product) => void;
  updateProduct: (updatedProd: Product) => void;
  deleteProduct: (id: string) => void;

  // Cart
  cart: CartItem[];
  cartCount: number;
  addToCart: (
    product: Product,
    selectedColor?: string,
    selectedSize?: string,
    quantity?: number,
    openDrawer?: boolean
  ) => void;
  removeFromCart: (productId: string, color: string, size: string) => void;
  updateQuantity: (productId: string, color: string, size: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;

  // Pricing & Coupon
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  cartSubtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  cartTotal: number;

  // Wishlist
  wishlist: string[];
  wishlistCount: number;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Quick View
  quickViewProduct: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;

  // Orders
  orders: Order[];
  createOrder: (
    order:
      | Order
      | (Omit<Order, "id" | "orderNumber" | "createdAt"> & {
          id?: string;
          orderNumber?: string;
          createdAt?: string;
        })
  ) => Order;
  updateOrderStatus: (orderId: string, status: Order["orderStatus"], trackingNumber?: string) => void;

  // Velocity Shipping Config
  velocityConfig: {
    warehouseId: string;
    pickupLocation: string;
    channelId: string;
  };
  updateVelocityConfig: (cfg: {
    warehouseId?: string;
    pickupLocation?: string;
    channelId?: string;
  }) => void;

  // Toast
  toast: { message: string; type: "success" | "info" | "error" } | null;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  // Brand
  const [brandConfig, setBrandConfig] = useState({
    name: BRAND_DEFAULT.name,
    tagline: BRAND_DEFAULT.tagline,
    announcement: BRAND_DEFAULT.announcementText,
    freeShippingThreshold: BRAND_DEFAULT.freeShippingThreshold,
    currency: BRAND_DEFAULT.currency,
  });

  // Products catalog
  const [products, setProducts] = useState<Product[]>(INITIAL_CATALOG);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Wishlist
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Coupons
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Quick View Modal
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Orders
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);

  // Velocity Shipping Config (optional override for .env.local warehouse settings)
  const [velocityConfig, setVelocityConfig] = useState({
    warehouseId: "",
    pickupLocation: "",
    channelId: "",
  });

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("brand_cart");
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedWishlist = localStorage.getItem("brand_wishlist");
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

      const savedOrders = localStorage.getItem("brand_orders");
      if (savedOrders) setOrders(JSON.parse(savedOrders));

      const savedProducts = localStorage.getItem("brand_products");
      if (savedProducts) setProducts(JSON.parse(savedProducts));

      const savedBrand = localStorage.getItem("brand_config");
      if (savedBrand) setBrandConfig(JSON.parse(savedBrand));

      const savedVelocity = localStorage.getItem("brand_velocity_config");
      if (savedVelocity) setVelocityConfig(JSON.parse(savedVelocity));
    } catch (e) {
      console.warn("Storage hydration skipped:", e);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("brand_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem("brand_wishlist", JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem("brand_orders", JSON.stringify(orders));
    } catch {}
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem("brand_products", JSON.stringify(products));
    } catch {}
  }, [products]);

  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  const updateBrandConfig = (newConfig: Partial<typeof BRAND_DEFAULT>) => {
    setBrandConfig((prev) => {
      const updated = {
        ...prev,
        ...newConfig,
        announcement: newConfig.announcementText ?? prev.announcement,
      };
      localStorage.setItem("brand_config", JSON.stringify(updated));
      return updated;
    });
    showToast("Brand settings updated successfully", "success");
  };

  const addProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    showToast(`Product "${newProd.name}" added to catalog`, "success");
  };

  const updateProduct = (updatedProd: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
    showToast(`Product "${updatedProd.name}" updated`, "success");
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast("Product deleted from catalog", "info");
  };

  // Cart operations
  const addToCart = (
    product: Product,
    selectedColor?: string,
    selectedSize?: string,
    quantity: number = 1,
    openDrawer: boolean = true
  ) => {
    const color = selectedColor || product.colorName;
    const size = selectedSize || product.sizes[0] || "Free Size";

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedColor === color &&
          item.selectedSize === size
      );

      if (existingIndex > -1) {
        const copy = [...prev];
        copy[existingIndex].quantity += quantity;
        return copy;
      } else {
        return [...prev, { product, selectedColor: color, selectedSize: size, quantity }];
      }
    });

    showToast(`Added "${product.name}" to your bag`, "success");
    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (productId: string, color: string, size: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(item.product.id === productId && item.selectedColor === color && item.selectedSize === size)
      )
    );
    showToast("Item removed from bag", "info");
  };

  const updateQuantity = (productId: string, color: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, color, size);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (
          item.product.id === productId &&
          item.selectedColor === color &&
          item.selectedSize === size
        ) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  // Pricing calculations
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  let discountAmount = 0;
  if (appliedCoupon && cartSubtotal >= appliedCoupon.minOrderValue) {
    if (appliedCoupon.discountType === "percentage") {
      discountAmount = Math.round((cartSubtotal * appliedCoupon.discountValue) / 100);
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  const shippingFee =
    cartSubtotal >= brandConfig.freeShippingThreshold || cartSubtotal === 0 ? 0 : 99;
  const taxableAmount = Math.max(0, cartSubtotal - discountAmount);
  const taxAmount = Math.round(taxableAmount * 0.05); // 5% GST on Indian Textiles
  const cartTotal = taxableAmount + shippingFee;

  const applyCoupon = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const coupon = INITIAL_COUPONS.find((c) => c.code.toUpperCase() === cleanCode && c.active);

    if (!coupon) {
      return { success: false, message: "Invalid coupon code" };
    }
    if (cartSubtotal < coupon.minOrderValue) {
      return {
        success: false,
        message: `Coupon requires minimum order of ₹${coupon.minOrderValue.toLocaleString("en-IN")}`,
      };
    }

    setAppliedCoupon(coupon);
    showToast(`Coupon ${coupon.code} applied!`, "success");
    return { success: true, message: `Coupon ${coupon.code} applied successfully!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast("Coupon removed", "info");
  };

  // Wishlist operations
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast("Removed from wishlist", "info");
        return prev.filter((id) => id !== productId);
      } else {
        showToast("Added to wishlist", "success");
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Quick View
  const openQuickView = (product: Product) => setQuickViewProduct(product);
  const closeQuickView = () => setQuickViewProduct(null);

  // Orders
  const createOrder = (
    orderData:
      | Order
      | (Omit<Order, "id" | "orderNumber" | "createdAt"> & {
          id?: string;
          orderNumber?: string;
          createdAt?: string;
        })
  ): Order => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      ...orderData,
      id: orderData.id || `ord-${Date.now()}`,
      orderNumber: orderData.orderNumber || `#${randomNum}`,
      createdAt:
        orderData.createdAt ||
        new Date().toISOString().replace("T", " ").substring(0, 16),
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const updateVelocityConfig = (cfg: {
    warehouseId?: string;
    pickupLocation?: string;
    channelId?: string;
  }) => {
    setVelocityConfig((prev) => {
      const updated = { ...prev, ...cfg };
      try {
        localStorage.setItem("brand_velocity_config", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast("Velocity Shipping settings saved", "success");
  };

  const updateOrderStatus = (
    orderId: string,
    status: Order["orderStatus"],
    trackingNumber?: string
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: status,
              trackingNumber: trackingNumber ?? o.trackingNumber,
            }
          : o
      )
    );
    showToast(`Order status updated to ${status}`, "success");
  };

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
  const wishlistCount = wishlist.length;

  return (
    <StoreContext.Provider
      value={{
        brandConfig,
        updateBrandConfig,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        cart,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        cartSubtotal,
        discountAmount,
        shippingFee,
        taxAmount,
        cartTotal,
        wishlist,
        wishlistCount,
        toggleWishlist,
        isInWishlist,
        quickViewProduct,
        openQuickView,
        closeQuickView,
        orders,
        createOrder,
        updateOrderStatus,
        velocityConfig,
        updateVelocityConfig,
        toast,
        showToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
