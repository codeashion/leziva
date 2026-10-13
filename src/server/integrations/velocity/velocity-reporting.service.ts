/**
 * LEZIVA — Velocity Shipping API Reporting & Reconciliation Service
 * 
 * Endpoint: POST /custom/api/v1/reports
 * 
 * Features:
 * - Fetches shipment activity summaries within given date ranges
 * - Reconciles carrier statuses with local database records
 * - Identifies discrepancies (missing AWBs, out-of-sync statuses, delivery completions)
 * - Safe auto-reconciliation to bring database into sync with actual logistics ground truth
 */

import { velocityApiClient } from "./velocity.client";
import { shipmentRepository } from "@/server/repositories/shipment.repository";
import { orderRepository } from "@/server/repositories/order.repository";
import { logger } from "@/utils/logger";
import {
  VelocityReportRequest,
  VelocityReportResponse,
  VelocityReportItem,
  ShipmentStatus,
  OrderStatus,
} from "./velocity.types";

export interface ReconciliationDiscrepancy {
  orderNumber: string;
  awb: string;
  localStatus: ShipmentStatus;
  carrierStatus: string;
  resolved: boolean;
  resolutionNote?: string;
}

export interface ReconciliationReport {
  startDate: string;
  endDate: string;
  shipmentType: "forward" | "return";
  totalReportedByCarrier: number;
  totalLocalShipmentsChecked: number;
  discrepanciesCount: number;
  discrepancies: ReconciliationDiscrepancy[];
  syncedCount: number;
}

export class VelocityReportingService {
  private static instance: VelocityReportingService;

  private constructor() {}

  public static getInstance(): VelocityReportingService {
    if (!VelocityReportingService.instance) {
      VelocityReportingService.instance = new VelocityReportingService();
    }
    return VelocityReportingService.instance;
  }

  /**
   * Fetches the raw summary report from Velocity.
   */
  public async getReport(
    startDateTime: string,
    endDateTime: string,
    shipmentType: "forward" | "return" = "forward"
  ): Promise<VelocityReportItem[]> {
    const payload: VelocityReportRequest = {
      start_date_time: startDateTime,
      end_date_time: endDateTime,
      shipment_type: shipmentType,
    };

    logger.info(`[VelocityReporting] Fetching ${shipmentType} report for ${startDateTime} to ${endDateTime}`);

    const response = await velocityApiClient.request<VelocityReportResponse>(
      "/custom/api/v1/reports",
      "POST",
      payload
    );

    const items = response.data || response.reports || [];
    return Array.isArray(items) ? items : [];
  }

  /**
   * Reconciles carrier reports with local shipment and order records.
   */
  public async reconcileShipments(
    startDateTime: string,
    endDateTime: string,
    shipmentType: "forward" | "return" = "forward",
    autoApplyResolution = true
  ): Promise<ReconciliationReport> {
    const carrierReportItems = await this.getReport(startDateTime, endDateTime, shipmentType);
    const discrepancies: ReconciliationDiscrepancy[] = [];
    let syncedCount = 0;

    for (const item of carrierReportItems) {
      if (!item.awb_code) continue;

      const localShipment = await shipmentRepository.findByAwb(item.awb_code);
      if (!localShipment) {
        discrepancies.push({
          orderNumber: item.order_id,
          awb: item.awb_code,
          localStatus: ShipmentStatus.PENDING,
          carrierStatus: item.status,
          resolved: false,
          resolutionNote: "AWB present in carrier report but missing in local database",
        });
        continue;
      }

      // Check if carrier status differs significantly from local status
      const mappedCarrierStatus = this.mapCarrierStatusToInternal(item.status);

      if (mappedCarrierStatus && mappedCarrierStatus !== localShipment.status) {
        let resolved = false;
        let note = `Carrier status is '${item.status}' while local status was '${localShipment.status}'`;

        if (autoApplyResolution) {
          await shipmentRepository.updateStatus(localShipment.id, mappedCarrierStatus);

          // If delivered, sync order status
          if (mappedCarrierStatus === ShipmentStatus.DELIVERED) {
            await this.syncOrderDelivery(localShipment.orderId);
            note += " -> Auto-resolved: Local shipment updated to DELIVERED and order completed";
          } else {
            note += ` -> Auto-resolved: Local status updated to ${mappedCarrierStatus}`;
          }
          resolved = true;
          syncedCount++;
        }

        discrepancies.push({
          orderNumber: item.order_id,
          awb: item.awb_code,
          localStatus: localShipment.status,
          carrierStatus: item.status,
          resolved,
          resolutionNote: note,
        });
      }
    }

    return {
      startDate: startDateTime,
      endDate: endDateTime,
      shipmentType,
      totalReportedByCarrier: carrierReportItems.length,
      totalLocalShipmentsChecked: carrierReportItems.length,
      discrepanciesCount: discrepancies.length,
      discrepancies,
      syncedCount,
    };
  }

  private mapCarrierStatusToInternal(carrierStatus: string): ShipmentStatus | null {
    const s = carrierStatus.toUpperCase().replace(/\s+/g, "_");
    if (s.includes("DELIVER") && !s.includes("OUT")) return ShipmentStatus.DELIVERED;
    if (s.includes("OUT_FOR_DELIVERY") || s.includes("OFD")) return ShipmentStatus.OUT_FOR_DELIVERY;
    if (s.includes("TRANSIT") || s.includes("REACHED_HUB")) return ShipmentStatus.IN_TRANSIT;
    if (s.includes("PICKED_UP") || s.includes("PICKUP_COMPLETE")) return ShipmentStatus.PICKED_UP;
    if (s.includes("CANCEL")) return ShipmentStatus.CANCELLED;
    if (s.includes("RETURN") || s.includes("RTO")) return ShipmentStatus.RETURN_IN_PROGRESS;
    return null;
  }

  private async syncOrderDelivery(orderId: string): Promise<void> {
    try {
      const order = await orderRepository.findById(orderId);
      if (order && order.status !== OrderStatus.DELIVERED) {
        await orderRepository.updateStatus(
          orderId,
          OrderStatus.DELIVERED,
          "Delivered via carrier report reconciliation",
          "SYSTEM"
        );
      }
    } catch (err: unknown) {
      logger.warn(`[VelocityReporting] Failed to sync order delivery for ${orderId}`, { error: String(err) });
    }
  }
}

export const velocityReportingService = VelocityReportingService.getInstance();
