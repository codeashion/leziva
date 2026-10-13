/**
 * LEZIVA — Velocity Shipping API Data Contracts & Types
 * 
 * Based strictly on "Velocity Shipping Custom API Documentation V1":
 * Production Base URL: https://shazam.velocity.in/
 */

// Domain enums are defined below in Section 9 with robust const objects and types.

// ============================================================================
// 1. Authentication Contracts
// ============================================================================

export interface VelocityAuthRequest {
  username: string;
  password: string;
}

export interface VelocityAuthResponse {
  status: boolean | string;
  message?: string;
  token?: string;
  token_type?: string;
  expires_in?: number; // In seconds (default: 86400 / 24 hours)
  data?: {
    token: string;
    token_type?: string;
    expires_in?: number;
  };
}

export interface CachedTokenData {
  token: string;
  expiresAt: number; // Unix timestamp in ms
}

// ============================================================================
// 2. Warehouse Contracts
// ============================================================================

export interface VelocityWarehouseRequest {
  name: string;
  contact_number: string;
  email: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  gstin?: string;
  alternate_contact_number?: string;
}

export interface VelocityWarehouseResponse {
  status: boolean | string;
  message?: string;
  warehouse_id?: string;
  data?: {
    warehouse_id: string;
    name: string;
    pincode: string;
    city: string;
    state: string;
  };
}

// ============================================================================
// 3. Serviceability Contracts
// ============================================================================

export type VelocityPaymentMode = "cod" | "prepaid";
export type VelocityShipmentType = "forward" | "return";

export interface VelocityServiceabilityRequest {
  from: string; // Origin warehouse PIN code (e.g. "395007")
  to: string; // Destination customer PIN code
  payment_mode: VelocityPaymentMode;
  shipment_type: VelocityShipmentType;
}

export interface VelocityCourierOption {
  courier_id: string;
  courier_name: string;
  estimated_delivery_days: number;
  estimated_delivery_date?: string;
  rate?: number;
  cod_available?: boolean;
  prepaid_available?: boolean;
}

export interface VelocityServiceabilityResponse {
  status: boolean | string;
  message?: string;
  is_serviceable?: boolean;
  couriers?: VelocityCourierOption[];
  data?: {
    is_serviceable: boolean;
    available_couriers: VelocityCourierOption[];
    from_pincode: string;
    to_pincode: string;
    zone?: string;
  };
}

// ============================================================================
// 4. Forward Shipment Contracts (One-Step Orchestration & Two-Step)
// ============================================================================

export interface VelocityOrderItemInput {
  name: string;
  sku: string;
  quantity: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn_code?: string;
  category?: string;
}

export interface VelocityAddressInput {
  name: string;
  phone: string;
  email?: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface VelocityPackageDimensions {
  length: number; // in cm
  breadth: number; // in cm
  height: number; // in cm
}

export interface VelocityForwardOrderOrchestrationRequest {
  order_id: string; // Internal order number (e.g. LZV-20261012-XXXXX)
  order_date: string; // YYYY-MM-DD HH:mm:ss
  warehouse_id: string;
  pickup_location?: string;
  channel_order_id?: string;
  carrier_id?: string;
  billing_address: VelocityAddressInput;
  shipping_address: VelocityAddressInput;
  order_items: VelocityOrderItemInput[];
  payment_method: VelocityPaymentMode;
  subtotal: number;
  total_discount: number;
  total_tax: number;
  total_amount: number;
  cod_amount: number;
  package_dimensions: VelocityPackageDimensions;
  package_weight: number; // In grams
}

export interface VelocityForwardOrderOrchestrationResponse {
  status: boolean | string;
  message?: string;
  order_id?: string;
  shipment_id?: string;
  awb_code?: string;
  courier_id?: string;
  courier_name?: string;
  label_url?: string;
  manifest_url?: string;
  data?: {
    order_id: string;
    shipment_id: string;
    awb_code: string;
    courier_id: string;
    courier_name: string;
    label_url?: string;
    manifest_url?: string;
    routing_code?: string;
    expected_delivery_date?: string;
  };
}

// Two-step workflow requests:
export interface VelocityForwardOrderRequest {
  order_id: string;
  order_date: string;
  warehouse_id: string;
  billing_address: VelocityAddressInput;
  shipping_address: VelocityAddressInput;
  order_items: VelocityOrderItemInput[];
  payment_method: VelocityPaymentMode;
  subtotal: number;
  total_amount: number;
  cod_amount: number;
  package_dimensions: VelocityPackageDimensions;
  package_weight: number;
}

export interface VelocityForwardShipmentRequest {
  order_id: string;
  shipment_id: string;
  carrier_id?: string;
}

export interface VelocityForwardShipmentResponse {
  status: boolean | string;
  message?: string;
  awb_code?: string;
  courier_id?: string;
  courier_name?: string;
  label_url?: string;
  data?: {
    awb_code: string;
    courier_id: string;
    courier_name: string;
    label_url?: string;
  };
}

// ============================================================================
// 5. Tracking Contracts
// ============================================================================

export interface VelocityTrackingRequest {
  awb: string[]; // List of AWBs to query
}

export interface VelocityTrackingActivity {
  date_time: string;
  status: string;
  activity: string;
  location: string;
  courier_status_code?: string;
}

export interface VelocityAwbTrackingItem {
  awb: string;
  order_id?: string;
  courier_name?: string;
  current_status: string;
  status_code?: string;
  origin?: string;
  destination?: string;
  pickup_date?: string;
  delivered_date?: string;
  expected_delivery_date?: string;
  pod_url?: string;
  activities: VelocityTrackingActivity[];
}

export interface VelocityTrackingResponse {
  status: boolean | string;
  message?: string;
  data?: VelocityAwbTrackingItem[] | Record<string, VelocityAwbTrackingItem>;
  trackings?: VelocityAwbTrackingItem[];
}

// ============================================================================
// 6. Cancellation Contracts
// ============================================================================

export interface VelocityCancelOrderRequest {
  awb: string[]; // Maximum 50 AWBs per request
}

export interface VelocityCancelOrderItemResult {
  awb: string;
  status: boolean | string;
  message?: string;
  cancellation_status?: "SUCCESS" | "FAILED" | "PENDING";
}

export interface VelocityCancelOrderResponse {
  status: boolean | string;
  message?: string;
  data?: VelocityCancelOrderItemResult[];
}

// ============================================================================
// 7. Reverse Pickup / Returns Contracts
// ============================================================================

export interface VelocityReverseOrderOrchestrationRequest {
  return_order_id: string; // Unique return order ID (e.g. RET-LZV-20261012-XXXXX)
  original_order_id: string;
  order_date: string;
  warehouse_id: string; // Destination warehouse for return handover
  customer_address: VelocityAddressInput;
  order_items: VelocityOrderItemInput[];
  package_dimensions: VelocityPackageDimensions;
  package_weight: number;
  carrier_id?: string;
  reason?: string;
}

export interface VelocityReverseOrderOrchestrationResponse {
  status: boolean | string;
  message?: string;
  return_order_id?: string;
  shipment_id?: string;
  awb_code?: string;
  courier_id?: string;
  courier_name?: string;
  label_url?: string;
  pickup_scheduled_date?: string;
  data?: {
    return_order_id: string;
    shipment_id: string;
    awb_code: string;
    courier_id: string;
    courier_name: string;
    label_url?: string;
    pickup_scheduled_date?: string;
  };
}

// ============================================================================
// 8. Summary Reports Contracts
// ============================================================================

export interface VelocityReportRequest {
  start_date_time: string; // YYYY-MM-DD HH:mm:ss
  end_date_time: string; // YYYY-MM-DD HH:mm:ss
  shipment_type: "forward" | "return";
}

export interface VelocityReportItem {
  order_id: string;
  shipment_id?: string;
  awb_code: string;
  courier_name: string;
  status: string;
  order_date: string;
  manifest_date?: string;
  delivered_date?: string;
  cod_amount?: number;
}

export interface VelocityReportResponse {
  status: boolean | string;
  message?: string;
  data?: VelocityReportItem[];
  reports?: VelocityReportItem[];
}

// ============================================================================
// 9. Internal Domain & Mapping Types
// ============================================================================

export const ShipmentStatus = {
  PENDING: "PENDING",
  QUEUED: "QUEUED",
  CREATING: "CREATING",
  CREATED: "CREATED",
  AWB_GENERATED: "AWB_GENERATED",
  PICKUP_PENDING: "PICKUP_PENDING",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "IN_TRANSIT",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  FAILED: "FAILED",
  CANCELLATION_PENDING: "CANCELLATION_PENDING",
  CANCELLED: "CANCELLED",
  RETURN_IN_PROGRESS: "RETURN_IN_PROGRESS",
  RETURNED: "RETURNED",
  EXCEPTION: "EXCEPTION",
} as const;
export type ShipmentStatus = (typeof ShipmentStatus)[keyof typeof ShipmentStatus];

export const ShipmentType = {
  FORWARD: "FORWARD",
  REVERSE: "REVERSE",
} as const;
export type ShipmentType = (typeof ShipmentType)[keyof typeof ShipmentType];

export const ReturnRequestStatus = {
  REQUESTED: "REQUESTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PICKUP_SCHEDULED: "PICKUP_SCHEDULED",
  PICKED_UP: "PICKED_UP",
  RECEIVED: "RECEIVED",
  INSPECTED: "INSPECTED",
  REFUNDED: "REFUNDED",
  REPLACED: "REPLACED",
  CANCELLED: "CANCELLED",
} as const;
export type ReturnRequestStatus = (typeof ReturnRequestStatus)[keyof typeof ReturnRequestStatus];

export const OrderStatus = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PAYMENT_CONFIRMED: "PAYMENT_CONFIRMED",
  PROCESSING: "PROCESSING",
  PACKED: "PACKED",
  SHIPPED: "SHIPPED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  RETURN_REQUESTED: "RETURN_REQUESTED",
  RETURNED: "RETURNED",
  REFUNDED: "REFUNDED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export interface CreateForwardShipmentResult {
  shipmentId: string;
  orderNumber: string;
  velocityOrderId: string;
  velocityShipmentId: string;
  awb: string;
  courierId: string;
  courierName: string;
  labelUrl: string | null;
  manifestUrl: string | null;
  status: ShipmentStatus;
}
