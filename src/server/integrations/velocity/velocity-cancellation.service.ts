/**
 * LEZIVA — Velocity Shipping API Cancellation Service
 * 
 * Endpoint: POST /custom/api/v1/cancel-order
 * 
 * Enforces business rules:
 * - Max 50 AWBs per request batch
 * - Validates shipment status eligibility before requesting carrier cancellation
 * - Updates shipment status to CANCELLATION_PENDING / CANCELLED safely
 * - Coordinates with order status without double inventory restoration or premature refunds
 */

import { velocityApiClient } from "./velocity.client";
import { shipmentRepository } from "@/server/repositories/shipment.repository";
import { orderRepository } from "@/server/repositories/order.repository";
import { logger } from "@/utils/logger";
import {
  VelocityCancelOrderRequest,
  VelocityCancelOrderResponse,
  ShipmentStatus,
  OrderStatus,
} from "./velocity.types";

export interface CancelShipmentResult {
  shipmentId: string;
  awb: string;
  status: ShipmentStatus;
  message: string;
  carrierAcknowledged: boolean;
}

export class VelocityCancellationService {
  private static instance: VelocityCancellationService;

  private constructor() {}

  public static getInstance(): VelocityCancellationService {
    if (!VelocityCancellationService.instance) {
      VelocityCancellationService.instance = new VelocityCancellationService();
    }
    return VelocityCancellationService.instance;
  }

  /**
   * Checks whether a shipment is in a state eligible for cancellation.
   */
  public isEligibleForCancellation(status: ShipmentStatus): { eligible: boolean; reason?: string } {
    const uncancelableStatuses: ShipmentStatus[] = [
      ShipmentStatus.PICKED_UP,
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.OUT_FOR_DELIVERY,
      ShipmentStatus.DELIVERED,
      ShipmentStatus.CANCELLED,
      ShipmentStatus.RETURN_IN_PROGRESS,
      ShipmentStatus.RETURNED,
    ];

    if (uncancelableStatuses.includes(status)) {
      return {
        eligible: false,
        reason: `Shipment cannot be cancelled once it reaches '${status}' status with the carrier`,
      };
    }

    return { eligible: true };
  }

  /**
   * Cancels a single shipment by its internal ID.
   */
  public async cancelShipment(
    shipmentId: string,
    reason?: string,
    staffUserId?: string
  ): Promise<CancelShipmentResult> {
    const shipment = await shipmentRepository.findById(shipmentId);
    if (!shipment) {
      throw new Error(`Shipment with ID '${shipmentId}' not found`);
    }

    const eligibility = this.isEligibleForCancellation(shipment.status);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason);
    }

    if (!shipment.awb) {
      // If AWB hasn't been generated yet, we can simply cancel locally
      logger.info(`[VelocityCancellation] Shipment ${shipmentId} has no AWB generated yet. Cancelling locally.`);
      const updated = await shipmentRepository.updateStatus(
        shipmentId,
        ShipmentStatus.CANCELLED,
        `Shipment cancelled locally before AWB generation: ${reason || "User/Admin requested"}`
      );

      // Check if order needs update
      await this.syncOrderStatusAfterCancellation(shipment.orderId);

      return {
        shipmentId,
        awb: "",
        status: updated?.status || ShipmentStatus.CANCELLED,
        message: "Shipment cancelled locally prior to carrier booking",
        carrierAcknowledged: false,
      };
    }

    // Call Velocity carrier cancellation API
    logger.info(`[VelocityCancellation] Requesting carrier cancellation for AWB: ${shipment.awb}`, {
      shipmentId,
      staffUserId,
      reason,
    });

    // Mark as CANCELLATION_PENDING first to ensure safe concurrent state
    await shipmentRepository.updateStatus(shipmentId, ShipmentStatus.CANCELLATION_PENDING);

    const payload: VelocityCancelOrderRequest = {
      awb: [shipment.awb],
    };

    try {
      const response = await velocityApiClient.request<VelocityCancelOrderResponse>(
        "/custom/api/v1/cancel-order",
        "POST",
        payload
      );

      const cancelItem = response.data?.find((d) => d.awb === shipment.awb);
      const isSuccess = cancelItem
        ? cancelItem.cancellation_status === "SUCCESS" || cancelItem.status === true
        : response.status === true;

      const newStatus = isSuccess ? ShipmentStatus.CANCELLED : ShipmentStatus.CANCELLATION_PENDING;
      const cancellationMsg = cancelItem?.message || response.message || "Carrier cancellation request submitted";

      const updated = await shipmentRepository.updateStatus(
        shipmentId,
        newStatus,
        isSuccess ? undefined : `Cancellation pending confirmation: ${cancellationMsg}`
      );

      // If successfully cancelled, synchronize order status safely
      if (isSuccess) {
        await this.syncOrderStatusAfterCancellation(shipment.orderId);
      }

      return {
        shipmentId,
        awb: shipment.awb,
        status: updated?.status || newStatus,
        message: cancellationMsg,
        carrierAcknowledged: isSuccess,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error(`[VelocityCancellation] Carrier cancellation failed for AWB ${shipment.awb}: ${errorMsg}`);
      
      // Keep as CANCELLATION_PENDING with recorded provider error for admin triage
      await shipmentRepository.update(shipmentId, {
        status: ShipmentStatus.CANCELLATION_PENDING,
        lastProviderError: errorMsg,
      });

      throw new Error(`Carrier cancellation request failed: ${errorMsg}`);
    }
  }

  /**
   * Cancels a batch of shipments by AWBs (up to 50 per batch as per Velocity specifications).
   */
  public async cancelBatch(awbList: string[]): Promise<VelocityCancelOrderResponse> {
    if (!awbList || awbList.length === 0) {
      throw new Error("AWB list cannot be empty for batch cancellation");
    }

    if (awbList.length > 50) {
      throw new Error(`Velocity allows a maximum of 50 AWBs per batch cancellation. Received: ${awbList.length}`);
    }

    const payload: VelocityCancelOrderRequest = {
      awb: awbList,
    };

    const response = await velocityApiClient.request<VelocityCancelOrderResponse>(
      "/custom/api/v1/cancel-order",
      "POST",
      payload
    );

    // Process each result item
    if (response.data && Array.isArray(response.data)) {
      for (const item of response.data) {
        const shipment = await shipmentRepository.findByAwb(item.awb);
        if (shipment) {
          const isSuccess = item.cancellation_status === "SUCCESS" || item.status === true;
          if (isSuccess) {
            await shipmentRepository.updateStatus(shipment.id, ShipmentStatus.CANCELLED);
            await this.syncOrderStatusAfterCancellation(shipment.orderId);
          } else {
            await shipmentRepository.update(shipment.id, {
              status: ShipmentStatus.CANCELLATION_PENDING,
              lastProviderError: item.message,
            });
          }
        }
      }
    }

    return response;
  }

  /**
   * Safely synchronizes order status when a shipment is cancelled,
   * without triggering duplicate inventory returns or refunds.
   */
  private async syncOrderStatusAfterCancellation(orderId: string): Promise<void> {
    try {
      const shipments = await shipmentRepository.findByOrderId(orderId);
      const allCancelled = shipments.length > 0 && shipments.every((s) => s.status === ShipmentStatus.CANCELLED);

      if (allCancelled) {
        const order = await orderRepository.findById(orderId);
        if (order && order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.DELIVERED) {
          logger.info(`[VelocityCancellation] All shipments cancelled for order ${orderId}. Updating order to CANCELLED.`);
          await orderRepository.updateStatus(
            orderId,
            OrderStatus.CANCELLED,
            "All shipments cancelled with carrier",
            "SYSTEM"
          );
        }
      }
    } catch (err: unknown) {
      logger.warn(`[VelocityCancellation] Failed to sync order status for ${orderId}`, { error: String(err) });
    }
  }
}

export const velocityCancellationService = VelocityCancellationService.getInstance();
