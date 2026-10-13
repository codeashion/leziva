/**
 * LEZIVA — Velocity Shipping API Reverse Logistics & Returns Service
 * 
 * Endpoint: POST /custom/api/v1/reverse-order-orchestration
 * 
 * Enforces business rules:
 * - Return request must exist and be in APPROVED status
 * - Order must exist and be eligible
 * - Deduplication: Prevents duplicate reverse shipments
 * - Persists reverse shipment record in DB with carrier AWB and pickup details
 * - Does not trigger refunds prematurely until items are received and inspected
 */

import { velocityApiClient } from "./velocity.client";
import { velocityConfigService } from "./velocity.config";
import { shipmentRepository } from "@/server/repositories/shipment.repository";
import { returnRequestRepository } from "@/server/repositories/return-request.repository";
import { orderRepository } from "@/server/repositories/order.repository";
import { logger } from "@/utils/logger";
import {
  VelocityReverseOrderOrchestrationRequest,
  VelocityReverseOrderOrchestrationResponse,
  ShipmentStatus,
  ShipmentType,
  ReturnRequestStatus,
  VelocityAddressInput,
  VelocityOrderItemInput,
} from "./velocity.types";

export interface CreateReversePickupResult {
  returnRequestId: string;
  shipmentId: string;
  awb: string;
  courierName: string;
  labelUrl: string | null;
  pickupScheduledDate: string | null;
  status: ShipmentStatus;
}

export class VelocityReverseService {
  private static instance: VelocityReverseService;

  private constructor() {}

  public static getInstance(): VelocityReverseService {
    if (!VelocityReverseService.instance) {
      VelocityReverseService.instance = new VelocityReverseService();
    }
    return VelocityReverseService.instance;
  }

  /**
   * Orchestrates a reverse pickup for an approved return request.
   */
  public async orchestrateReversePickup(
    returnRequestId: string,
    adminStaffId?: string,
    carrierId?: string
  ): Promise<CreateReversePickupResult> {
    const returnReq = await returnRequestRepository.findById(returnRequestId);
    if (!returnReq) {
      throw new Error(`Return request '${returnRequestId}' not found`);
    }

    // Return request must be APPROVED
    if (returnReq.status !== ReturnRequestStatus.APPROVED && returnReq.status !== ReturnRequestStatus.PICKUP_SCHEDULED) {
      throw new Error(
        `Cannot create reverse pickup for return request in '${returnReq.status}' status. It must be approved first.`
      );
    }

    const order = await orderRepository.findById(returnReq.orderId);
    if (!order) {
      throw new Error(`Associated order '${returnReq.orderId}' not found`);
    }

    // Check for existing active reverse shipment to prevent duplicates
    const existingShipments = await shipmentRepository.findByOrderId(order.id);
    const existingReverse = existingShipments.find(
      (s) => s.shipmentType === ShipmentType.REVERSE && s.status !== ShipmentStatus.CANCELLED
    );

    if (existingReverse && existingReverse.awb) {
      logger.info(
        `[VelocityReverse] Active reverse shipment already exists for order ${order.orderNumber}: AWB ${existingReverse.awb}`
      );
      return {
        returnRequestId,
        shipmentId: existingReverse.id,
        awb: existingReverse.awb,
        courierName: existingReverse.courierName || "Reverse Logistics Partner",
        labelUrl: existingReverse.labelUrl,
        pickupScheduledDate: existingReverse.pickupDate ? existingReverse.pickupDate.toISOString() : null,
        status: existingReverse.status,
      };
    }

    const config = velocityConfigService.getConfig();
    const returnOrderRef = `RET-${order.orderNumber}`;

    // Prepare pickup address
    const pickupAddr = returnReq.pickupAddress as Record<string, string>;
    const orderAddr = (order.shippingAddressSnapshot as Record<string, string>) || {};
    const customerAddress: VelocityAddressInput = {
      name: (pickupAddr.fullName || pickupAddr.name || orderAddr.fullName || "Customer") as string,
      phone: (pickupAddr.phone || orderAddr.phone || "9876543210") as string,
      email: (pickupAddr.email || order.guestEmail || "patron@leziva.com") as string,
      address: (pickupAddr.addressLine1 || pickupAddr.address || orderAddr.addressLine1 || "Customer Address") as string,
      address2: (pickupAddr.addressLine2 as string) || (orderAddr.addressLine2 as string) || undefined,
      city: (pickupAddr.city || orderAddr.city || "Mumbai") as string,
      state: (pickupAddr.state || orderAddr.state || "Maharashtra") as string,
      pincode: (pickupAddr.pincode || pickupAddr.postalCode || orderAddr.pincode || "400001") as string,
      country: (pickupAddr.country || orderAddr.country || "India") as string,
    };

    // Prepare return items
    const rawItems = Array.isArray(returnReq.items) ? returnReq.items : [];
    const returnItems: VelocityOrderItemInput[] =
      rawItems.length > 0
        ? (rawItems as Record<string, unknown>[]).map((item) => ({
            name: String(item.productName || item.productTitle || item.name || "Leziva Garment"),
            sku: String(item.sku || `SKU-RET-${order.orderNumber}`),
            quantity: Number(item.quantity) || 1,
            selling_price: Number(item.unitPrice || item.selling_price) || 1000,
          }))
        : order.items.map((item) => ({
            name: item.productTitle,
            sku: item.sku,
            quantity: item.quantity,
            selling_price: item.unitPrice,
          }));

    const payload: VelocityReverseOrderOrchestrationRequest = {
      return_order_id: returnOrderRef,
      original_order_id: order.orderNumber,
      order_date: new Date().toISOString().replace("T", " ").substring(0, 19),
      warehouse_id: config.warehouseId,
      customer_address: customerAddress,
      order_items: returnItems,
      package_dimensions: {
        length: 30,
        breadth: 25,
        height: 10,
      },
      package_weight: 1200, // standard fashion weight in grams
      carrier_id: carrierId || "delhivery_reverse",
      reason: returnReq.reason || "Customer Return Request",
    };

    logger.info(`[VelocityReverse] Orchestrating reverse shipment for order ${order.orderNumber}`, {
      returnRequestId,
      adminStaffId,
      returnOrderRef,
    });

    const response = await velocityApiClient.request<VelocityReverseOrderOrchestrationResponse>(
      "/custom/api/v1/reverse-order-orchestration",
      "POST",
      payload
    );

    const data = response.data;
    const awb = data?.awb_code || response.awb_code || `REV${Date.now()}`;
    const courierId = data?.courier_id || response.courier_id || "delhivery_reverse";
    const courierName = data?.courier_name || response.courier_name || "Delhivery Reverse Logistics";
    const labelUrl = data?.label_url || response.label_url || null;
    const shipmentId = data?.shipment_id || response.shipment_id || `shp_rev_${Date.now()}`;
    const pickupScheduledDate = data?.pickup_scheduled_date || response.pickup_scheduled_date || null;

    // Persist reverse shipment
    const createdShipment = await shipmentRepository.create({
      orderId: order.id,
      velocityOrderId: returnOrderRef,
      velocityShipmentId: shipmentId,
      awb,
      courierId,
      courierName,
      shipmentType: ShipmentType.REVERSE,
      status: ShipmentStatus.PICKUP_PENDING,
      labelUrl,
      pickupDate: pickupScheduledDate ? new Date(pickupScheduledDate) : new Date(Date.now() + 86400000),
      packageLength: 30,
      packageBreadth: 25,
      packageHeight: 10,
      packageWeight: 1200,
    });

    // Update return request status
    await returnRequestRepository.update(returnRequestId, {
      status: ReturnRequestStatus.PICKUP_SCHEDULED,
      adminNotes: `Reverse pickup booked with ${courierName}. AWB: ${awb}. Scheduled: ${pickupScheduledDate || "Next business day"}`,
    });

    return {
      returnRequestId,
      shipmentId: createdShipment.id,
      awb,
      courierName,
      labelUrl,
      pickupScheduledDate,
      status: createdShipment.status,
    };
  }
}

export const velocityReverseService = VelocityReverseService.getInstance();
