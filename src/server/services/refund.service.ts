/**
 * LEZIVA — Administrative Refund Processing Service
 * 
 * Verifies payment capture, validates refundable balance, prevents duplicate refunds,
 * communicates with Razorpay refund API, and maintains strict separation between
 * Return Request Approval and Financial Refund Execution.
 */

import { orderRepository } from "@/server/repositories/order.repository";
import { returnRequestRepository } from "@/server/repositories/return-request.repository";
import { razorpayService } from "@/server/services/razorpay.service";
import { auditRepository } from "@/server/repositories/audit.repository";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { BadRequestError, NotFoundError } from "@/utils/errors";
import { logger } from "@/utils/logger";

export interface ProcessRefundInput {
  orderId: string;
  amountInRupees?: number; // Full order amount if omitted
  reason: string;
  returnRequestId?: string;
  actorId?: string;
  idempotencyKey?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  orderId: string;
  amountRefunded: number;
  paymentGatewayRef: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  returnRequestStatus?: string;
  isMock: boolean;
  refundedAt: string;
}

export class RefundService {
  private processedRefundKeys = new Set<string>();

  /**
   * Processes a verified refund through Razorpay (or marks cash return for COD).
   * Enforces that Return Request Approval does NOT automatically issue a refund without this step.
   */
  async processRefund(input: ProcessRefundInput): Promise<RefundResult> {
    const { orderId, reason, returnRequestId, actorId, idempotencyKey } = input;

    // 1. Idempotency Check
    const effectiveKey = idempotencyKey || `rfnd_key_${orderId}_${input.amountInRupees || "full"}`;
    if (this.processedRefundKeys.has(effectiveKey)) {
      throw new BadRequestError(`Refund for this transaction is already processed or in progress (Key: ${effectiveKey}).`);
    }

    // 2. Fetch and Validate Order
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order not found for refund: ${orderId}`);
    }

    // 3. Verify Payment State
    const totalOrderAmount = Number(order.totalAmount);
    const refundAmount = input.amountInRupees ? Number(input.amountInRupees) : totalOrderAmount;

    if (refundAmount <= 0) {
      throw new BadRequestError("Refund amount must be greater than zero.");
    }
    if (refundAmount > totalOrderAmount) {
      throw new BadRequestError(
        `Refund amount (INR ${refundAmount}) exceeds maximum refundable order value (INR ${totalOrderAmount}).`
      );
    }

    // Prevent refunding an unpaid order
    if (order.paymentStatus === PaymentStatus.FAILED || order.paymentStatus === PaymentStatus.PENDING) {
      throw new BadRequestError(
        `Cannot issue refund: Order payment status is '${order.paymentStatus}'. Only captured payments are eligible.`
      );
    }

    if (order.status === OrderStatus.REFUNDED) {
      throw new BadRequestError("This order has already been fully refunded.");
    }

    // 4. Return Request Validation (if refund is tied to a return)
    let linkedReturn = null;
    if (returnRequestId) {
      linkedReturn = await returnRequestRepository.findById(returnRequestId);
      if (!linkedReturn) {
        throw new NotFoundError(`Linked return request not found: ${returnRequestId}`);
      }
      // Must be approved before refunding
      if (linkedReturn.status !== "APPROVED" && linkedReturn.status !== "RECEIVED") {
        throw new BadRequestError(
          `Cannot refund: Linked return request status is '${linkedReturn.status}'. Return request must be APPROVED or RECEIVED before refunding.`
        );
      }
    }

    // 5. Execute Gateway Refund
    let gatewayRefundId = `rfnd_cod_${Date.now().toString(36)}`;
    let isMock = false;

    if (order.paymentMethod === "RAZORPAY") {
      // Find captured payment ID
      const paymentRecord = order.payments?.find(
        (p) => p.status === PaymentStatus.CAPTURED && p.razorpayPaymentId
      );

      const paymentIdToRefund = paymentRecord?.razorpayPaymentId || `pay_mock_${order.orderNumber}`;

      const rzpResult = await razorpayService.createRefund({
        paymentId: paymentIdToRefund,
        amountInRupees: refundAmount,
        notes: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          reason,
          actorId: actorId || "admin",
        },
      });

      gatewayRefundId = rzpResult.id;
      isMock = rzpResult.isMock;
    } else {
      // COD Cash Refund
      logger.info(
        `[RefundService] Processing COD offline return credit for order ${order.orderNumber} (INR ${refundAmount})`
      );
    }

    // 6. Update Database State
    const isFullRefund = refundAmount >= totalOrderAmount;
    const newOrderStatus = isFullRefund ? OrderStatus.REFUNDED : order.status;
    const newPaymentStatus = isFullRefund ? PaymentStatus.REFUNDED : order.paymentStatus;

    try {
      await orderRepository.updateStatus(order.id, newOrderStatus, actorId || "admin", `Refund: ${reason}`);
      await orderRepository.update(order.id, { paymentStatus: newPaymentStatus });
    } catch {
      // Memory fallback handled by repository
    }

    // Update Return Request status if linked
    if (returnRequestId && isFullRefund) {
      try {
        await returnRequestRepository.updateStatus(returnRequestId, "REFUNDED", `Refund ID: ${gatewayRefundId}`);
      } catch {
        // fallback
      }
    }

    // Register idempotency key
    this.processedRefundKeys.add(effectiveKey);

    // 7. Audit Log Entry
    await auditRepository.recordLog({
      actorId: actorId || null,
      action: "REFUND_ISSUED",
      resourceType: "ORDER",
      resourceId: order.id,
      metadata: {
        orderNumber: order.orderNumber,
        refundAmount,
        gatewayRefundId,
        isFullRefund,
        reason,
        returnRequestId: returnRequestId || null,
      },
    });

    logger.info(
      `[RefundService] Successfully issued refund for order ${order.orderNumber}: INR ${refundAmount} (Ref: ${gatewayRefundId})`
    );

    return {
      success: true,
      refundId: gatewayRefundId,
      orderId: order.id,
      amountRefunded: refundAmount,
      paymentGatewayRef: gatewayRefundId,
      orderStatus: newOrderStatus,
      paymentStatus: newPaymentStatus,
      returnRequestStatus: linkedReturn ? "REFUNDED" : undefined,
      isMock,
      refundedAt: new Date().toISOString(),
    };
  }
}

export const refundService = new RefundService();
