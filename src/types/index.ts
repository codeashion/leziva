export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  category: "sarees" | "kurtas" | "lehengas" | "mens" | "kids" | "accessories";
  categoryDisplayName: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  rating: number;
  reviewCount: number;
  images: string[];
  primaryColor: string;
  colorName: string;
  colorHex: string;
  availableColors: {
    name: string;
    hex: string;
  }[];
  sizes: string[];
  fabric: string;
  occasion: string;
  description: string;
  details: string[];
  careInstructions: string[];
  shippingInfo: string;
  inStock: boolean;
  stockCount: number;
  featured?: boolean;
  isNewArrival?: boolean;
  sku: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  image: string;
  actionText: string;
  itemCount: number;
}

export interface CartItem {
  product: Product;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
}

export interface Address {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customer: Address;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shippingFee: number;
  tax: number;
  total: number;
  shippingMethod: "standard" | "express";
  paymentMethod: "razorpay" | "card" | "cod";
  paymentStatus: "paid" | "pending" | "failed";
  orderStatus: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  trackingNumber?: string;
  estimatedDelivery: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  velocityOrderId?: string;
  velocityShipmentId?: string;
  velocityAwbCode?: string;
  velocityCourierName?: string;
  velocitySynced?: boolean;
  velocityError?: string;
}

export interface Coupon {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue: number;
  description: string;
  validUntil: string;
  active: boolean;
}

export interface FilterState {
  category: string[];
  fabrics: string[];
  occasions: string[];
  colors: string[];
  minPrice: number;
  maxPrice: number;
  sortBy: "featured" | "newest" | "price-low" | "price-high" | "rating";
}
