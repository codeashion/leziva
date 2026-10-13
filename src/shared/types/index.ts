/**
 * Core Shared Domain Types for LEZIVA
 */

export type UserRole = "CUSTOMER" | "ADMIN" | "CATALOG_MANAGER" | "SUPPORT";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: string;
  userId?: string;
  fullName: string;
  phone: string;
  alternatePhone?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export type CategorySlug =
  | "sarees"
  | "lehengas"
  | "dresses"
  | "kurtis"
  | "contemporary-wear"
  | "bridal-couture"
  | "coord-sets"
  | "festive-wear";

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface Category {
  id: string;
  name: string;
  slug: CategorySlug | string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  isActive: boolean;
  sortOrder?: number;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  isFeatured?: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  title: string;
  size: "XS" | "S" | "M" | "L" | "XL" | "XXL" | "FREE_SIZE" | "CUSTOM";
  colorName: string;
  colorHex: string;
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  inventoryQuantity: number;
  lowStockThreshold?: number;
  weightGrams: number;
  dimensionsCm?: {
    length: number;
    width: number;
    height: number;
  };
  imageUrl?: string | null;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string | null;
  mediaType?: string;
  sortOrder: number;
  isPrimary: boolean;
  variantId?: string | null;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  description: string;
  fabricDetails?: string;
  careInstructions?: string;
  categoryId: string;
  category?: Category;
  status?: ProductStatus;
  isFeatured: boolean;
  isNewArrival?: boolean;
  isActive: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  tags: string[];
  variants: ProductVariant[];
  images: ProductImage[];
  collections?: Collection[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryMovement {
  id: string;
  variantId: string;
  quantityDelta: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  actorId?: string | null;
  notes?: string | null;
  createdAt: Date;
}

export interface CartItem {
  id: string;
  cartId?: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  productTitle: string;
  variantTitle: string;
  imageThumbnail: string;
  sku: string;
  size?: string;
  colorName?: string;
  maxAvailable?: number;
  isLowStock?: boolean;
}

export interface Cart {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  couponCode?: string | null;
  shippingEstimate: number;
  grandTotal: number;
  warnings?: string[];
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REFUNDED";

export type PaymentMethod = "RAZORPAY" | "COD";

export type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED"
  | "REFUNDED";

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  currency: "INR";
  shippingAddress: Address;
  billingAddress: Address;
  items: Array<{
    id: string;
    variantId: string;
    quantity: number;
    price: number;
    productTitle: string;
    variantTitle: string;
    sku: string;
  }>;
  shipmentAwb?: string | null;
  shipmentCourier?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
