/**
 * LEZIVA — Velocity Serviceability Service
 * 
 * Validates delivery serviceability, courier availability, estimated transit times,
 * and COD restrictions using POST /custom/api/v1/serviceability with Redis caching.
 */

import { velocityApiClient } from "./velocity.client";
import { velocityConfigService } from "./velocity.config";
import {
  VelocityPaymentMode,
  VelocityShipmentType,
  VelocityServiceabilityRequest,
  VelocityServiceabilityResponse,
  VelocityCourierOption,
} from "./velocity.types";
import { redisService } from "@/server/redis/client";
import { logger } from "@/utils/logger";

const SERVICEABILITY_CACHE_TTL_SECONDS = 1800; // 30 minutes caching

export interface ServiceabilityCheckInput {
  destinationPincode?: string;
  to?: string;
  from?: string;
  paymentMode?: VelocityPaymentMode;
  payment_mode?: VelocityPaymentMode;
  shipmentType?: VelocityShipmentType;
  shipment_type?: VelocityShipmentType;
}

export interface ServiceabilityCheckResult {
  isServiceable: boolean;
  is_serviceable?: boolean;
  destinationPincode: string;
  originPincode: string;
  paymentMode: VelocityPaymentMode;
  shipmentType: VelocityShipmentType;
  couriers?: VelocityCourierOption[];
  availableCouriers: VelocityCourierOption[];
  recommendedCourier: VelocityCourierOption | null;
  estimatedDeliveryDays: number | null;
  estimatedDeliveryDate: string | null;
  isCodAvailable: boolean;
  message: string;
}

export class VelocityServiceabilityService {
  private static instance: VelocityServiceabilityService;

  private constructor() {}

  public static getInstance(): VelocityServiceabilityService {
    if (!VelocityServiceabilityService.instance) {
      VelocityServiceabilityService.instance = new VelocityServiceabilityService();
    }
    return VelocityServiceabilityService.instance;
  }

  /**
   * Checks PIN code delivery serviceability.
   */
  public async checkServiceability(input: ServiceabilityCheckInput): Promise<ServiceabilityCheckResult> {
    const rawPincode = input.destinationPincode || input.to || "";
    const pincode = rawPincode.trim();
    const paymentMode = input.paymentMode || input.payment_mode || "prepaid";
    const shipmentType = input.shipmentType || input.shipment_type || "forward";

    // 1. Validate PIN code format (Standard Indian 6-digit PIN code)
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      throw new Error(`Please enter a valid 6-digit Indian PIN code. Received: "${pincode}"`);
    }

    const config = velocityConfigService.getConfig();
    const originPincode = config.warehousePincode;

    const cacheKey = `velocity:serviceability:${originPincode}:${pincode}:${paymentMode}:${shipmentType}`;

    // 2. Check Redis cache
    try {
      const cached = await redisService.get(cacheKey);
      if (cached) {
        logger.debug(`[VelocityServiceability] Cache hit for pincode ${pincode}`);
        return JSON.parse(cached);
      }
    } catch {
      // Ignore cache errors and proceed with upstream call
    }

    // 3. Dispatch Upstream Serviceability Check
    const payload: VelocityServiceabilityRequest = {
      from: originPincode,
      to: pincode,
      payment_mode: paymentMode,
      shipment_type: shipmentType,
    };

    try {
      const response = await velocityApiClient.request<VelocityServiceabilityResponse>(
        "/custom/api/v1/serviceability",
        "POST",
        payload
      );

      const couriers = response.couriers || response.data?.available_couriers || [];
      const isServiceable = Boolean(response.is_serviceable ?? (couriers.length > 0));

      const codAvailable = couriers.some((c) => c.cod_available !== false);
      const recommendedCourier = couriers[0] || null;

      const estimatedDays = recommendedCourier?.estimated_delivery_days || (isServiceable ? 3 : null);
      let estimatedDate = recommendedCourier?.estimated_delivery_date || null;
      if (!estimatedDate && estimatedDays) {
        const d = new Date();
        d.setDate(d.getDate() + estimatedDays);
        estimatedDate = d.toLocaleDateString("en-IN", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      }

      const result: ServiceabilityCheckResult = {
        isServiceable,
        is_serviceable: isServiceable,
        destinationPincode: pincode,
        originPincode,
        paymentMode,
        shipmentType,
        couriers,
        availableCouriers: couriers,
        recommendedCourier,
        estimatedDeliveryDays: estimatedDays,
        estimatedDeliveryDate: estimatedDate,
        isCodAvailable: codAvailable,
        message: isServiceable
          ? `Complimentary delivery available to ${pincode} via ${recommendedCourier?.courier_name || "Velocity Express"}`
          : "Delivery is currently unavailable to this PIN code. Please select an alternate address.",
      };

      // 4. Store in Cache
      try {
        await redisService.set(cacheKey, JSON.stringify(result), SERVICEABILITY_CACHE_TTL_SECONDS);
      } catch {
        // Cache write errors ignored
      }

      return result;
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("6-digit")) {
        throw err;
      }

      const msg = err instanceof Error ? err.message : "Serviceability check failed";
      logger.error(`[VelocityServiceability] Check failed for ${pincode}: ${msg}`);

      return {
        isServiceable: false,
        is_serviceable: false,
        destinationPincode: pincode,
        originPincode,
        paymentMode,
        shipmentType,
        couriers: [],
        availableCouriers: [],
        recommendedCourier: null,
        estimatedDeliveryDays: null,
        estimatedDeliveryDate: null,
        isCodAvailable: false,
        message: "Unable to verify courier serviceability. Please try again shortly.",
      };
    }
  }
}

export const velocityServiceabilityService = VelocityServiceabilityService.getInstance();
