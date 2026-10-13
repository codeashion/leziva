/**
 * LEZIVA — Velocity Order Tracking Service
 * 
 * Fetches real-time milestone events from POST /custom/api/v1/order-tracking,
 * maps provider statuses to internal ShipmentStatus, and updates database records.
 */

import { velocityApiClient } from "./velocity.client";
import {
  VelocityTrackingRequest,
  VelocityTrackingResponse,
  VelocityAwbTrackingItem,
  ShipmentStatus,
} from "./velocity.types";
import { shipmentRepository } from "@/server/repositories/shipment.repository";
import { orderRepository } from "@/server/repositories/order.repository";
import { redisService } from "@/server/redis/client";
import { OrderStatus } from "@prisma/client";
import { logger } from "@/utils/logger";

const TRACKING_CACHE_TTL_SECONDS = 300; // 5 minutes cache

export interface ShipmentTrackingSummary {
  awb: string;
  orderNumber: string;
  courierName: string;
  status: ShipmentStatus;
  statusLabel: string;
  origin: string;
  destination: string;
  pickupDate: string | null;
  expectedDeliveryDate: string | null;
  deliveredDate: string | null;
  activities: Array<{
    date: string;
    status: string;
    activity: string;
    location: string;
  }>;
  lastUpdated: string;
}

export class VelocityTrackingService {
  private static instance: VelocityTrackingService;

  private constructor() {}

  public static getInstance(): VelocityTrackingService {
    if (!VelocityTrackingService.instance) {
      VelocityTrackingService.instance = new VelocityTrackingService();
    }
    return VelocityTrackingService.instance;
  }

  /**
   * Returns tracking object for an AWB code.
   */
  public async getTrackingForAwb(awb: string): Promise<{
    awb: string;
    order_id: string;
    courier_name: string;
    current_status: string;
    origin: string;
    destination: string;
    pickup_date: string | null;
    expected_delivery_date: string | null;
    delivered_date: string | null;
    activities: Array<{
      date_time: string;
      status: string;
      activity: string;
      location: string;
    }>;
  } | null> {
    const summary = await this.trackByAwb(awb);
    if (!summary) return null;
    return {
      awb: summary.awb,
      order_id: summary.orderNumber,
      courier_name: summary.courierName,
      current_status: summary.status,
      origin: summary.origin,
      destination: summary.destination,
      pickup_date: summary.pickupDate,
      expected_delivery_date: summary.expectedDeliveryDate,
      delivered_date: summary.deliveredDate,
      activities: summary.activities.map((a) => ({
        date_time: a.date,
        status: a.status,
        activity: a.activity,
        location: a.location,
      })),
    };
  }

  /**
   * Forces tracking refresh from carrier for a given internal shipment ID.
   */
  public async refreshShipmentTracking(shipmentId: string): Promise<{
    awb: string;
    current_status: string;
    lastUpdated: string;
  }> {
    const shipment = await shipmentRepository.findById(shipmentId);
    if (!shipment || !shipment.awb) {
      throw new Error(`Shipment ${shipmentId} not found or missing AWB`);
    }
    const result = await this.trackByAwb(shipment.awb, true);
    return {
      awb: shipment.awb,
      current_status: result?.status || shipment.status,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Tracks a single AWB code, checking cache first, calling Velocity,
   * and updating the local database record.
   */
  public async trackByAwb(awb: string, forceRefresh = false): Promise<ShipmentTrackingSummary | null> {
    const cleanAwb = awb.trim();
    const cacheKey = `velocity:track:${cleanAwb}`;

    // 1. Check Redis Cache
    if (!forceRefresh) {
      try {
        const cached = await redisService.get(cacheKey);
        if (cached) {
          logger.debug(`[VelocityTracking] Cache hit for AWB: ${cleanAwb}`);
          return JSON.parse(cached);
        }
      } catch {
        // Fallback to upstream
      }
    }

    // 2. Fetch tracking details from Velocity API
    const trackings = await this.trackBatch([cleanAwb]);
    const trackingItem = trackings[cleanAwb];

    // 3. Find local shipment record
    const localShipment = await shipmentRepository.findByAwb(cleanAwb);

    if (!trackingItem && !localShipment) {
      return null;
    }

    const mappedStatus = trackingItem
      ? this.mapProviderStatusToShipmentStatus(trackingItem.current_status)
      : localShipment?.status || ShipmentStatus.PENDING;

    // 4. Update Database if tracking item exists
    if (localShipment && trackingItem) {
      const deliveredDate = trackingItem.delivered_date ? new Date(trackingItem.delivered_date) : null;
      const pickupDate = trackingItem.pickup_date ? new Date(trackingItem.pickup_date) : null;

      await shipmentRepository.updateTracking(localShipment.id, {
        status: mappedStatus,
        activities: trackingItem.activities,
        deliveredDate,
        pickupDate,
      });

      // Synchronize internal order status
      if (mappedStatus === ShipmentStatus.DELIVERED) {
        await orderRepository.updateStatus(localShipment.orderId, OrderStatus.DELIVERED, "Delivered by courier", "SYSTEM");
      } else if (mappedStatus === ShipmentStatus.OUT_FOR_DELIVERY) {
        await orderRepository.updateStatus(localShipment.orderId, OrderStatus.OUT_FOR_DELIVERY, "Out for delivery", "SYSTEM");
      }
    }

    // 5. Build summary representation
    const activities = trackingItem?.activities?.map((a) => ({
      date: a.date_time,
      status: a.status,
      activity: a.activity,
      location: a.location,
    })) || [];

    const summary: ShipmentTrackingSummary = {
      awb: cleanAwb,
      orderNumber: trackingItem?.order_id || localShipment?.velocityOrderId || "N/A",
      courierName: trackingItem?.courier_name || localShipment?.courierName || "Velocity Express",
      status: mappedStatus,
      statusLabel: this.getHumanStatusLabel(mappedStatus),
      origin: trackingItem?.origin || "Surat Atelier",
      destination: trackingItem?.destination || "Destination",
      pickupDate: trackingItem?.pickup_date || (localShipment?.pickupDate ? localShipment.pickupDate.toISOString() : null),
      expectedDeliveryDate: trackingItem?.expected_delivery_date || null,
      deliveredDate: trackingItem?.delivered_date || (localShipment?.deliveredDate ? localShipment.deliveredDate.toISOString() : null),
      activities,
      lastUpdated: new Date().toISOString(),
    };

    // 6. Cache summary
    try {
      await redisService.set(cacheKey, JSON.stringify(summary), TRACKING_CACHE_TTL_SECONDS);
    } catch {
      // Ignore cache write errors
    }

    return summary;
  }

  /**
   * Batch tracking queries via POST /custom/api/v1/order-tracking
   */
  public async trackBatch(awbList: string[]): Promise<Record<string, VelocityAwbTrackingItem>> {
    if (awbList.length === 0) return {};

    const payload: VelocityTrackingRequest = { awb: awbList };

    try {
      const response = await velocityApiClient.request<VelocityTrackingResponse>(
        "/custom/api/v1/order-tracking",
        "POST",
        payload
      );

      const result: Record<string, VelocityAwbTrackingItem> = {};

      const rawItems = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.trackings)
        ? response.trackings
        : response.data
        ? Object.values(response.data)
        : [];

      for (const item of rawItems) {
        if (item.awb) {
          result[item.awb] = item;
        }
      }

      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tracking request failed";
      logger.error(`[VelocityTracking] Batch tracking failed: ${msg}`);
      return {};
    }
  }

  /**
   * Maps Velocity upstream status strings to internal ShipmentStatus enum.
   */
  public mapProviderStatusToShipmentStatus(providerStatus: string): ShipmentStatus {
    const s = providerStatus.toUpperCase().replace(/\s+/g, "_");

    if (s.includes("DELIVERED")) return ShipmentStatus.DELIVERED;
    if (s.includes("OUT_FOR_DELIVERY") || s.includes("OFD")) return ShipmentStatus.OUT_FOR_DELIVERY;
    if (s.includes("IN_TRANSIT") || s.includes("REACHED") || s.includes("DISPATCHED")) return ShipmentStatus.IN_TRANSIT;
    if (s.includes("PICKED_UP") || s.includes("PICKUP_COMPLETE")) return ShipmentStatus.PICKED_UP;
    if (s.includes("PICKUP_PENDING") || s.includes("SCHEDULED")) return ShipmentStatus.PICKUP_PENDING;
    if (s.includes("CANCELLED") || s.includes("CANCELED")) return ShipmentStatus.CANCELLED;
    if (s.includes("RTO") || s.includes("RETURN")) return ShipmentStatus.RETURN_IN_PROGRESS;
    if (s.includes("FAILED") || s.includes("UNDELIVERED")) return ShipmentStatus.FAILED;

    return ShipmentStatus.AWB_GENERATED;
  }

  public getHumanStatusLabel(status: ShipmentStatus): string {
    switch (status) {
      case ShipmentStatus.PENDING:
        return "Pending Manifest";
      case ShipmentStatus.AWB_GENERATED:
        return "AWB Assigned & Ready for Handover";
      case ShipmentStatus.PICKUP_PENDING:
        return "Courier Pickup Scheduled";
      case ShipmentStatus.PICKED_UP:
        return "Package Picked Up from Atelier";
      case ShipmentStatus.IN_TRANSIT:
        return "In Transit to Destination Hub";
      case ShipmentStatus.OUT_FOR_DELIVERY:
        return "Out for Delivery Today";
      case ShipmentStatus.DELIVERED:
        return "Delivered to Customer";
      case ShipmentStatus.CANCELLED:
        return "Shipment Cancelled";
      case ShipmentStatus.RETURN_IN_PROGRESS:
        return "Return in Transit";
      case ShipmentStatus.RETURNED:
        return "Returned to Atelier";
      default:
        return status;
    }
  }
}

export const velocityTrackingService = VelocityTrackingService.getInstance();
