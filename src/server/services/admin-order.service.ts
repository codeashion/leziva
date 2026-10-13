/**
 * LEZIVA — Admin Order Operations & Lifecycle Management Service
 * 
 * Provides searching, filtering, order detail inspection (with verified Razorpay payments
 * and Velocity AWB tracking links), valid status transitions, and operational audit logging.
 */

import { orderRepository, StoredOrder } from "@/server/repositories/order.repository";
import { shipmentRepository, StoredShipment } from "@/server/repositories/shipment.repository";
import { auditRepository } from "@/server/repositories/audit.repository";
import { OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";
import { BadRequestError, NotFoundError } from "@/utils/errors";

export interface OrderFilterParams {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface DetailedOrderView extends StoredOrder {
  shipments: StoredShipment[];
  verifiedPayment: {
    method: PaymentMethod;
    status: PaymentStatus;
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
    isVerified: boolean;
  };
  activeShipment?: {
    awb: string | null;
    courierName: string | null;
    status: string;
    labelUrl: string | null;
    trackingActivities: unknown[];
  } | null;
}

// Strictly enforced status transition graph
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAYMENT_CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
  [OrderStatus.PROCESSING]: [OrderStatus.PACKED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
  [OrderStatus.PACKED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
  [OrderStatus.SHIPPED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.RETURN_REQUESTED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.RETURN_REQUESTED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURN_REQUESTED, OrderStatus.RETURNED, OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RETURN_REQUESTED]: [OrderStatus.RETURNED, OrderStatus.REFUNDED],
  [OrderStatus.RETURNED]: [OrderStatus.REFUNDED],
  [OrderStatus.REFUNDED]: [],
};

export class AdminOrderService {
  /**
   * Retrieves orders matching administrative search and filter criteria.
   */
  async getOrders(params: OrderFilterParams = {}): Promise<{
    orders: StoredOrder[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));

    const startDate = params.startDate ? new Date(params.startDate) : undefined;
    const endDate = params.endDate ? new Date(params.endDate) : undefined;

    const allOrders = await orderRepository.findMany({
      search: params.search,
      status: params.status,
      paymentStatus: params.paymentStatus,
      paymentMethod: params.paymentMethod,
      startDate,
      endDate,
      limit: 1000,
    });

    const total = allOrders.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginatedOrders = allOrders.slice(offset, offset + limit);

    return {
      orders: paginatedOrders,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Retrieves an order with full verified payment and Velocity shipping associations.
   */
  async getOrderDetails(orderId: string): Promise<DetailedOrderView> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order not found: ${orderId}`);
    }

    let shipments: StoredShipment[] = [];
    try {
      shipments = await shipmentRepository.findByOrderId(order.id);
    } catch {
      shipments = [];
    }

    // Determine verified payment details
    const capturedPayment = order.payments?.find(
      (p) => p.status === PaymentStatus.CAPTURED || p.status === PaymentStatus.AUTHORIZED
    );

    const isVerified =
      order.paymentMethod === PaymentMethod.COD
        ? true
        : capturedPayment !== undefined && !!capturedPayment.razorpayPaymentId;

    const activeShipmentItem = shipments.find((s) => s.shipmentType === "FORWARD") || shipments[0];

    return {
      ...order,
      shipments,
      verifiedPayment: {
        method: order.paymentMethod,
        status: order.paymentStatus,
        razorpayOrderId: capturedPayment?.razorpayOrderId || null,
        razorpayPaymentId: capturedPayment?.razorpayPaymentId || null,
        isVerified,
      },
      activeShipment: activeShipmentItem
        ? {
            awb: activeShipmentItem.awb,
            courierName: activeShipmentItem.courierName,
            status: activeShipmentItem.status,
            labelUrl: activeShipmentItem.labelUrl,
            trackingActivities: (activeShipmentItem.trackingActivities as unknown[]) || [],
          }
        : null,
    };
  }

  /**
   * Updates order lifecycle status with transition validation and audit trail.
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    reason: string,
    actorId?: string
  ): Promise<StoredOrder> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order not found: ${orderId}`);
    }

    if (order.status === newStatus) {
      return order; // No-op
    }

    // Check validity of transition
    const allowedTransitions = VALID_TRANSITIONS[order.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestError(
        `Invalid status transition: Cannot change order from '${order.status}' to '${newStatus}'. Allowed: ${allowedTransitions.join(", ") || "None"}.`
      );
    }

    // Safety guard: Cannot mark as PAYMENT_CONFIRMED if payment is failed/unverified
    if (newStatus === OrderStatus.PAYMENT_CONFIRMED && order.paymentStatus === PaymentStatus.FAILED) {
      throw new BadRequestError(
        "Cannot confirm payment: Payment status is recorded as FAILED. Verify payment in Razorpay first."
      );
    }

    const updated = await orderRepository.updateStatus(orderId, newStatus, actorId || "admin", reason);

    await auditRepository.recordLog({
      actorId: actorId || null,
      action: "ORDER_STATUS_UPDATED",
      resourceType: "ORDER",
      resourceId: orderId,
      metadata: {
        orderNumber: order.orderNumber,
        previousStatus: order.status,
        newStatus,
        reason,
      },
    });

    if (!updated) {
      throw new NotFoundError(`Failed to update order: ${orderId}`);
    }

    return updated;
  }

  /**
   * Adds an administrative operational note to the order.
   */
  async addAdminNote(orderId: string, note: string, actorId?: string): Promise<StoredOrder> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order not found: ${orderId}`);
    }

    const timestamp = new Date().toISOString();
    const formattedNote = `[${timestamp} by ${actorId || "Admin"}]: ${note}`;
    const newNotes = order.notes ? `${order.notes}\n${formattedNote}` : formattedNote;

    const updated = await orderRepository.update(orderId, { notes: newNotes });
    if (!updated) {
      throw new NotFoundError(`Failed to update order: ${orderId}`);
    }

    await auditRepository.recordLog({
      actorId: actorId || null,
      action: "ORDER_NOTE_ADDED",
      resourceType: "ORDER",
      resourceId: orderId,
      metadata: { noteSnippet: note.slice(0, 100) },
    });

    return updated;
  }
}

export const adminOrderService = new AdminOrderService();
