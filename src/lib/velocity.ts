import { Order } from "@/types";
import { PRODUCTS } from "@/lib/constants";

function getVelocityConfig() {
  const baseUrl = (
    process.env.VELOCITY_API_BASE_URL || "https://shazam.velocity.in"
  ).replace(/\/+$/, "");
  const token = process.env.VELOCITY_API_TOKEN?.trim() || "";
  const warehouseId = process.env.VELOCITY_WAREHOUSE_ID?.trim() || "";
  const pickupLocation = process.env.VELOCITY_PICKUP_LOCATION?.trim() || "";
  const channelId = process.env.VELOCITY_CHANNEL_ID?.trim() || "";
  const autoManifest = process.env.VELOCITY_AUTO_MANIFEST === "true";

  return {
    baseUrl,
    token,
    warehouseId,
    pickupLocation,
    channelId,
    autoManifest,
  };
}

export function isVelocityWarehouseConfigured(overrideWarehouseId?: string): boolean {
  const cfg = getVelocityConfig();
  return Boolean(cfg.token && (overrideWarehouseId?.trim() || cfg.warehouseId));
}

export function getVelocityEnvStatus() {
  const cfg = getVelocityConfig();
  return {
    hasToken: Boolean(cfg.token),
    warehouseId: cfg.warehouseId,
    pickupLocation: cfg.pickupLocation,
    channelId: cfg.channelId,
    autoManifest: cfg.autoManifest,
  };
}

function formatVelocityOrderDate(date = new Date()): string {
  // Format as "YYYY-MM-DD HH:mm" in Asia/Kolkata
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || "00";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

function normalizeIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) {
    return digits.slice(-10);
  }
  if (digits.length > 10 && digits.startsWith("0")) {
    return digits.slice(-10);
  }
  return digits.slice(-10);
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const cleaned = fullName.trim().replace(/\s+/g, " ");
  const spaceIdx = cleaned.indexOf(" ");
  if (spaceIdx === -1) {
    return { firstName: cleaned || "Customer", lastName: "" };
  }
  return {
    firstName: cleaned.slice(0, spaceIdx),
    lastName: cleaned.slice(spaceIdx + 1),
  };
}

async function velocityRequest<T>(
  path: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; data: T }> {
  const { baseUrl, token } = getVelocityConfig();
  if (!token) {
    throw new Error("VELOCITY_API_TOKEN is not configured in .env.local.");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let data: T;
  const text = await response.text();
  try {
    data = JSON.parse(text) as T;
  } catch {
    data = { message: text } as unknown as T;
  }

  return { ok: response.ok, status: response.status, data };
}

export interface VelocityWarehouseInput {
  name: string;
  phoneNumber: string;
  email: string;
  contactPerson: string;
  gstNo?: string;
  streetAddress: string;
  zip: string;
  city: string;
  state: string;
  country?: string;
}

export async function createVelocityWarehouse(input: VelocityWarehouseInput) {
  const { ok, status, data } = await velocityRequest<{
    status?: string;
    message?: string;
    payload?: { warehouse_id?: string };
  }>("/custom/api/v1/warehouse", {
    name: input.name,
    phone_number: normalizeIndianPhone(input.phoneNumber),
    ...(input.gstNo ? { gst_no: input.gstNo } : {}),
    email: input.email,
    contact_person: input.contactPerson,
    address_attributes: {
      street_address: input.streetAddress,
      zip: input.zip.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
      country: input.country || "India",
    },
  });

  if (!ok || !data?.payload?.warehouse_id) {
    throw new Error(
      data?.message || `Failed to create Velocity warehouse (HTTP ${status})`
    );
  }

  return {
    warehouseId: data.payload.warehouse_id,
    pickupLocation: input.name,
  };
}

export async function checkVelocityServiceability(params: {
  from: string;
  to: string;
  paymentMode: "cod" | "prepaid";
  shipmentType?: "forward" | "return";
}) {
  const { ok, status, data } = await velocityRequest<{
    status?: string;
    message?: string;
    result?: {
      serviceability_results?: Array<{
        carrier_id: string;
        carrier_name: string;
        expected_delivery_date?: string;
      }>;
      zone?: string;
    };
  }>("/custom/api/v1/serviceability", {
    from: params.from.trim(),
    to: params.to.trim(),
    payment_mode: params.paymentMode,
    shipment_type: params.shipmentType || "forward",
  });

  if (!ok) {
    throw new Error(
      data?.message || `Serviceability check failed (HTTP ${status})`
    );
  }

  return data;
}

export interface VelocitySyncResult {
  synced: boolean;
  velocityOrderId?: string;
  velocityShipmentId?: string;
  awbCode?: string;
  courierName?: string;
  error?: string;
}

interface VelocityOrderResponse {
  status?: number | string;
  message?: string;
  errors?: unknown;
  payload?: {
    order_created?: number;
    awb_generated?: number;
    order_id?: string;
    shipment_id?: string;
    awb_code?: string;
    courier_name?: string;
  };
}

export async function createVelocityForwardOrder(
  order: Order,
  overrides?: {
    warehouseId?: string;
    pickupLocation?: string;
    channelId?: string;
    autoManifest?: boolean;
  }
): Promise<VelocitySyncResult> {
  const cfg = getVelocityConfig();
  if (!cfg.token) {
    return {
      synced: false,
      error: "VELOCITY_API_TOKEN is missing in .env.local.",
    };
  }

  const warehouseId = overrides?.warehouseId?.trim() || cfg.warehouseId;
  const pickupLocation =
    overrides?.pickupLocation?.trim() || cfg.pickupLocation || "Primary Warehouse";
  const channelId = overrides?.channelId?.trim() || cfg.channelId;
  const autoManifest = overrides?.autoManifest ?? cfg.autoManifest;

  if (!warehouseId) {
    return {
      synced: false,
      error:
        "Velocity Warehouse ID is not configured. Set VELOCITY_WAREHOUSE_ID in .env.local or create/save it in Admin -> Brand Configuration.",
    };
  }

  const { firstName, lastName } = splitFullName(order.customer.fullName);
  const fullAddress = [order.customer.addressLine1, order.customer.addressLine2]
    .filter(Boolean)
    .join(", ");

  const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const perItemDiscount =
    order.discount > 0 && order.items.length > 0
      ? Math.round(order.discount / order.items.length)
      : 0;

  const orderItems = order.items.map((item) => {
    const catalogProd = PRODUCTS.find((p) => p.id === item.productId);
    const sku = catalogProd?.sku || item.productId;
    return {
      name: `${item.productName} (${item.color}, ${item.size})`.slice(0, 120),
      sku,
      units: item.quantity,
      selling_price: item.price,
      discount: perItemDiscount,
      tax: Math.round(item.price * 0.05),
    };
  });

  const isCod = order.paymentMethod === "cod";
  const basePayload: Record<string, unknown> = {
    order_id: order.id,
    order_date: formatVelocityOrderDate(),
    ...(channelId ? { channel_id: channelId } : {}),
    billing_customer_name: firstName,
    ...(lastName ? { billing_last_name: lastName } : {}),
    billing_address: fullAddress,
    billing_city: order.customer.city,
    billing_pincode: String(order.customer.pincode).trim(),
    billing_state: order.customer.state,
    billing_country: "India",
    billing_email: order.customer.email,
    billing_phone: normalizeIndianPhone(order.customer.phone),
    shipping_is_billing: true,
    print_label: true,
    order_items: orderItems,
    payment_method: isCod ? "COD" : "PREPAID",
    sub_total: order.total,
    cod_collectible: isCod ? order.total : 0,
    length: 30,
    breadth: 25,
    height: 5,
    weight: Number(Math.max(0.5, totalUnits * 0.5).toFixed(2)),
    pickup_location: pickupLocation,
    warehouse_id: warehouseId,
  };

  try {
    if (autoManifest) {
      const orch = await velocityRequest<VelocityOrderResponse>(
        "/custom/api/v1/forward-order-orchestration",
        {
          ...basePayload,
          carrier_id: "",
        }
      );

      if (orch.ok && orch.data?.payload?.order_created === 1) {
        return {
          synced: true,
          velocityOrderId: orch.data.payload.order_id,
          velocityShipmentId: orch.data.payload.shipment_id,
          awbCode: orch.data.payload.awb_code || undefined,
          courierName: orch.data.payload.courier_name || undefined,
        };
      }
      // Fallback to forward-order (create order without courier assignment) if auto-manifest fails
    }

    const res = await velocityRequest<VelocityOrderResponse>(
      "/custom/api/v1/forward-order",
      basePayload
    );

    if (!res.ok || res.data?.payload?.order_created !== 1) {
      const errDetail =
        res.data?.message ||
        (res.data?.errors ? JSON.stringify(res.data.errors) : "") ||
        `Velocity API error (HTTP ${res.status})`;
      return {
        synced: false,
        error: errDetail,
      };
    }

    return {
      synced: true,
      velocityOrderId: res.data.payload.order_id,
      velocityShipmentId: res.data.payload.shipment_id,
      awbCode: res.data.payload.awb_code || undefined,
      courierName: res.data.payload.courier_name || undefined,
    };
  } catch (err) {
    return {
      synced: false,
      error: err instanceof Error ? err.message : "Velocity API request failed",
    };
  }
}

export async function trackVelocityShipments(awbs: string[]) {
  const { ok, status, data } = await velocityRequest<Record<string, unknown>>(
    "/custom/api/v1/order-tracking",
    { awbs }
  );

  if (!ok) {
    throw new Error(`Velocity tracking failed (HTTP ${status})`);
  }

  return data;
}
