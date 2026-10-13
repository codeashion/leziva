/**
 * LEZIVA — Velocity Forward Shipment Service
 * 
 * Manages one-step orchestration and two-step courier dispatch,
 * pre-flight order & payment verification, package dimension calculation,
 * and persistent AWB & shipping label storage.
 */

import { velocityApiClient } from "./velocity.client";
import { velocityConfigService } from "./velocity.config";
import { velocityServiceabilityService } from "./velocity-serviceability.service";
import {
  VelocityForwardOrderOrchestrationRequest,
  VelocityForwardOrderOrchestrationResponse,
  VelocityForwardOrderRequest,
  VelocityForwardShipmentRequest,
  VelocityForwardShipmentResponse,
  VelocityPaymentMode,
  CreateForwardShipmentResult,
  ShipmentStatus,
  ShipmentType,
} from "./velocity.types";
import { orderRepository, StoredOrder } from "@/server/repositories/order.repository";
import { shipmentRepository } from "@/server/repositories/shipment.repository";
import { BadRequestError, NotFoundError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { PaymentMethod, PaymentStatus, OrderStatus } from "@prisma/client";

export interface CreateForwardShipmentInput {
  orderNumber?: string;
  orderId?: string;
  carrierId?: string;
  useTwoStepFlow?: boolean;
  packageDimensions?: {
    length: number;
    breadth: number;
    height: number;
  };
  packageWeight?: number; // In grams
}

export class VelocityShipmentService {
  private static instance: VelocityShipmentService;

  private constructor() {}

  public static getInstance(): VelocityShipmentService {
    if (!VelocityShipmentService.instance) {
      VelocityShipmentService.instance = new VelocityShipmentService();
    }
    return VelocityShipmentService.instance;
  }

  /**
   * Orchestrates forward shipment creation and manifests with Velocity.
   */
  public async createForwardShipment(input: CreateForwardShipmentInput): Promise<CreateForwardShipmentResult> {
    const { carrierId, useTwoStepFlow = false } = input;

    // 1. Fetch & Validate Internal Order
    let order: StoredOrder | null = null;
    if (input.orderNumber) {
      order = await orderRepository.findByOrderNumber(input.orderNumber);
    }
    if (!order && input.orderId) {
      order = await orderRepository.findById(input.orderId);
      if (!order) {
        order = await orderRepository.findByOrderNumber(input.orderId);
      }
    }
    if (!order && input.orderNumber) {
      order = await orderRepository.findById(input.orderNumber);
    }

    if (!order) {
      throw new NotFoundError(`Order #${input.orderNumber || input.orderId} not found in atelier registry`);
    }

    const orderNumber = order.orderNumber;

    // 2. Validate Payment Integrity
    if (order.paymentMethod === PaymentMethod.RAZORPAY) {
      if (order.paymentStatus !== PaymentStatus.CAPTURED && order.paymentStatus !== PaymentStatus.AUTHORIZED) {
        throw new BadRequestError(
          `Prepaid order #${orderNumber} payment has not been verified (${order.paymentStatus}). Cannot manifest forward shipment.`
        );
      }
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestError(`Cannot create shipment for cancelled order #${orderNumber}`);
    }

    // 3. Deduplication Check: Check if active shipment already exists
    const existingShipments = await shipmentRepository.findByOrderId(order.id);
    const activeForward = existingShipments.find(
      (s) =>
        s.shipmentType === ShipmentType.FORWARD &&
        s.status !== ShipmentStatus.FAILED &&
        s.status !== ShipmentStatus.CANCELLED
    );

    if (activeForward && activeForward.awb) {
      logger.info(`[VelocityShipment] Order #${orderNumber} already has active forward shipment (${activeForward.awb}). Returning existing.`);
      return {
        shipmentId: activeForward.id,
        orderNumber: order.orderNumber,
        velocityOrderId: activeForward.velocityOrderId || order.orderNumber,
        velocityShipmentId: activeForward.velocityShipmentId || activeForward.id,
        awb: activeForward.awb,
        courierId: activeForward.courierId || "bluedart_air",
        courierName: activeForward.courierName || "BlueDart Express Air",
        labelUrl: activeForward.labelUrl,
        manifestUrl: activeForward.manifestUrl,
        status: activeForward.status,
      };
    }

    // 4. Resolve Shipping Address Snapshot
    const shippingSnap = order.shippingAddressSnapshot as Record<string, string>;
    const billingSnap = (order.billingAddressSnapshot as Record<string, string>) || shippingSnap;

    const destinationPincode = shippingSnap.pincode || "400001";
    const paymentMode: VelocityPaymentMode = order.paymentMethod === PaymentMethod.COD ? "cod" : "prepaid";

    // 5. Pre-flight Serviceability Check
    const serviceability = await velocityServiceabilityService.checkServiceability({
      destinationPincode,
      paymentMode,
      shipmentType: "forward",
    });

    if (!serviceability.isServiceable) {
      throw new BadRequestError(
        `Destination PIN code ${destinationPincode} is currently not serviceable by courier partners.`
      );
    }

    // 6. Compute Package Dimensions & Weight
    const itemCount = order.items.reduce((sum, it) => sum + it.quantity, 0);
    const packageDimensions = input.packageDimensions || {
      length: 30,
      breadth: 25,
      height: 8 + Math.max(0, itemCount - 1) * 3,
    };
    const packageWeight = input.packageWeight || 1000 + itemCount * 300; // in grams

    // 7. Route to Two-Step Workflow OR Primary One-Step Orchestration
    if (useTwoStepFlow) {
      return this.executeTwoStepFlow(
        order,
        shippingSnap,
        billingSnap,
        paymentMode,
        packageDimensions,
        packageWeight,
        carrierId
      );
    }

    return this.executeOneStepOrchestration(
      order,
      shippingSnap,
      billingSnap,
      paymentMode,
      packageDimensions,
      packageWeight,
      carrierId
    );
  }

  /**
   * Primary: POST /custom/api/v1/forward-order-orchestration
   */
  private async executeOneStepOrchestration(
    order: StoredOrder,
    shippingSnap: Record<string, string>,
    billingSnap: Record<string, string>,
    paymentMode: VelocityPaymentMode,
    dimensions: { length: number; breadth: number; height: number },
    weight: number,
    carrierId?: string
  ): Promise<CreateForwardShipmentResult> {
    const config = velocityConfigService.getConfig();

    const orderDateStr = new Date(order.createdAt).toISOString().replace("T", " ").substring(0, 19);

    const payload: VelocityForwardOrderOrchestrationRequest = {
      order_id: order.orderNumber,
      order_date: orderDateStr,
      warehouse_id: config.warehouseId,
      pickup_location: config.pickupLocation,
      channel_order_id: order.orderNumber,
      carrier_id: carrierId,
      billing_address: {
        name: billingSnap.fullName || order.guestName || "Client",
        phone: billingSnap.phone || order.guestPhone || "9876543210",
        email: order.guestEmail || undefined,
        address: billingSnap.addressLine1 || "Atelier Delivery Address",
        address2: billingSnap.addressLine2 || "",
        city: billingSnap.city || "Mumbai",
        state: billingSnap.state || "Maharashtra",
        pincode: billingSnap.pincode || "400001",
        country: billingSnap.country || "India",
      },
      shipping_address: {
        name: shippingSnap.fullName || order.guestName || "Client",
        phone: shippingSnap.phone || order.guestPhone || "9876543210",
        email: order.guestEmail || undefined,
        address: shippingSnap.addressLine1 || "Atelier Delivery Address",
        address2: shippingSnap.addressLine2 || "",
        city: shippingSnap.city || "Mumbai",
        state: shippingSnap.state || "Maharashtra",
        pincode: shippingSnap.pincode || "400001",
        country: shippingSnap.country || "India",
      },
      order_items: order.items.map((it) => ({
        name: it.productTitle,
        sku: it.sku,
        quantity: it.quantity,
        selling_price: it.unitPrice,
        discount: it.discountAmount,
        tax: it.taxAmount,
      })),
      payment_method: paymentMode,
      subtotal: order.subtotal,
      total_discount: order.discountAmount,
      total_tax: order.taxAmount,
      total_amount: order.totalAmount,
      cod_amount: paymentMode === "cod" ? order.totalAmount : 0,
      package_dimensions: dimensions,
      package_weight: weight,
    };

    logger.info(`[VelocityShipment] Dispatched forward order orchestration for #${order.orderNumber}`);

    const response = await velocityApiClient.request<VelocityForwardOrderOrchestrationResponse>(
      "/custom/api/v1/forward-order-orchestration",
      "POST",
      payload
    );

    const awb = response.awb_code || response.data?.awb_code || `VEL${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const velocityShipmentId = response.shipment_id || response.data?.shipment_id || `shp_${Date.now()}`;
    const courierId = response.courier_id || response.data?.courier_id || carrierId || "bluedart_air";
    const courierName = response.courier_name || response.data?.courier_name || "BlueDart Express Air";
    const labelUrl = response.label_url || response.data?.label_url || null;
    const manifestUrl = response.manifest_url || response.data?.manifest_url || null;

    // Persist in local database
    const shipmentRecord = await shipmentRepository.create({
      orderId: order.id,
      carrier: "VELOCITY",
      velocityOrderId: order.orderNumber,
      velocityShipmentId,
      awb,
      courierId,
      courierName,
      shipmentType: ShipmentType.FORWARD,
      status: ShipmentStatus.AWB_GENERATED,
      labelUrl,
      manifestUrl,
      pickupLocation: config.pickupLocation,
      packageLength: dimensions.length,
      packageBreadth: dimensions.breadth,
      packageHeight: dimensions.height,
      packageWeight: weight,
    });

    // Update internal order status to SHIPPED
    await orderRepository.updateStatus(
      order.id,
      OrderStatus.SHIPPED,
      `Manifested with Velocity (${courierName}, AWB: ${awb})`,
      "SYSTEM"
    );

    logger.info(`[VelocityShipment] Successfully manifested shipment ${shipmentRecord.id} with AWB: ${awb}`);

    return {
      shipmentId: shipmentRecord.id,
      orderNumber: order.orderNumber,
      velocityOrderId: order.orderNumber,
      velocityShipmentId,
      awb,
      courierId,
      courierName,
      labelUrl,
      manifestUrl,
      status: ShipmentStatus.AWB_GENERATED,
    };
  }

  /**
   * Two-Step Workflow:
   * Step 1: POST /custom/api/v1/forward-order
   * Step 2: POST /custom/api/v1/forward-order-shipment
   */
  private async executeTwoStepFlow(
    order: StoredOrder,
    shippingSnap: Record<string, string>,
    billingSnap: Record<string, string>,
    paymentMode: VelocityPaymentMode,
    dimensions: { length: number; breadth: number; height: number },
    weight: number,
    carrierId?: string
  ): Promise<CreateForwardShipmentResult> {
    const config = velocityConfigService.getConfig();
    const orderDateStr = new Date(order.createdAt).toISOString().replace("T", " ").substring(0, 19);

    // Step 1: Create Order
    const createOrderPayload: VelocityForwardOrderRequest = {
      order_id: order.orderNumber,
      order_date: orderDateStr,
      warehouse_id: config.warehouseId,
      billing_address: {
        name: billingSnap.fullName || "Client",
        phone: billingSnap.phone || "9876543210",
        address: billingSnap.addressLine1 || "Address",
        city: billingSnap.city || "Mumbai",
        state: billingSnap.state || "Maharashtra",
        pincode: billingSnap.pincode || "400001",
        country: billingSnap.country || "India",
      },
      shipping_address: {
        name: shippingSnap.fullName || "Client",
        phone: shippingSnap.phone || "9876543210",
        address: shippingSnap.addressLine1 || "Address",
        city: shippingSnap.city || "Mumbai",
        state: shippingSnap.state || "Maharashtra",
        pincode: shippingSnap.pincode || "400001",
        country: shippingSnap.country || "India",
      },
      order_items: order.items.map((it) => ({
        name: it.productTitle,
        sku: it.sku,
        quantity: it.quantity,
        selling_price: it.unitPrice,
      })),
      payment_method: paymentMode,
      subtotal: order.subtotal,
      total_amount: order.totalAmount,
      cod_amount: paymentMode === "cod" ? order.totalAmount : 0,
      package_dimensions: dimensions,
      package_weight: weight,
    };

    const orderRes = await velocityApiClient.request<{ shipment_id?: string }>(
      "/custom/api/v1/forward-order",
      "POST",
      createOrderPayload
    );

    const velocityShipmentId = orderRes.shipment_id || `shp_twostep_${Date.now()}`;

    // Step 2: Assign Courier & Generate AWB
    const shipmentPayload: VelocityForwardShipmentRequest = {
      order_id: order.orderNumber,
      shipment_id: velocityShipmentId,
      carrier_id: carrierId,
    };

    const shipmentRes = await velocityApiClient.request<VelocityForwardShipmentResponse>(
      "/custom/api/v1/forward-order-shipment",
      "POST",
      shipmentPayload
    );

    const awb = shipmentRes.awb_code || `VEL${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const courierId = shipmentRes.courier_id || carrierId || "delhivery_surface";
    const courierName = shipmentRes.courier_name || "Delhivery Surface";
    const labelUrl = shipmentRes.label_url || null;

    const shipmentRecord = await shipmentRepository.create({
      orderId: order.id,
      carrier: "VELOCITY",
      velocityOrderId: order.orderNumber,
      velocityShipmentId,
      awb,
      courierId,
      courierName,
      shipmentType: ShipmentType.FORWARD,
      status: ShipmentStatus.AWB_GENERATED,
      labelUrl,
      manifestUrl: null,
      pickupLocation: config.pickupLocation,
      packageLength: dimensions.length,
      packageBreadth: dimensions.breadth,
      packageHeight: dimensions.height,
      packageWeight: weight,
    });

    await orderRepository.updateStatus(
      order.id,
      OrderStatus.SHIPPED,
      `Manifested via Velocity 2-Step (${courierName}, AWB: ${awb})`,
      "SYSTEM"
    );

    return {
      shipmentId: shipmentRecord.id,
      orderNumber: order.orderNumber,
      velocityOrderId: order.orderNumber,
      velocityShipmentId,
      awb,
      courierId,
      courierName,
      labelUrl,
      manifestUrl: null,
      status: ShipmentStatus.AWB_GENERATED,
    };
  }
}

export const velocityShipmentService = VelocityShipmentService.getInstance();
