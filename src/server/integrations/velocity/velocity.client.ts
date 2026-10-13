/**
 * LEZIVA — Velocity Shipping API Core HTTP Client
 * 
 * Handles authenticated HTTPS requests, 401 token invalidation,
 * network timeouts, error classification, and deterministic sandbox simulation.
 */

import { velocityConfigService } from "./velocity.config";
import { velocityAuthService } from "./velocity-auth.service";
import { logger } from "@/utils/logger";
import {
  VelocityServiceabilityRequest,
  VelocityServiceabilityResponse,
  VelocityForwardOrderOrchestrationRequest,
  VelocityForwardOrderOrchestrationResponse,
  VelocityTrackingRequest,
  VelocityTrackingResponse,
  VelocityCancelOrderRequest,
  VelocityCancelOrderResponse,
  VelocityReverseOrderOrchestrationRequest,
  VelocityReverseOrderOrchestrationResponse,
  VelocityWarehouseRequest,
  VelocityWarehouseResponse,
  VelocityReportRequest,
  VelocityReportResponse,
  VelocityForwardOrderRequest,
  VelocityForwardShipmentRequest,
  VelocityForwardShipmentResponse,
} from "./velocity.types";

export class VelocityApiClient {
  private static instance: VelocityApiClient;

  private constructor() {}

  public static getInstance(): VelocityApiClient {
    if (!VelocityApiClient.instance) {
      VelocityApiClient.instance = new VelocityApiClient();
    }
    return VelocityApiClient.instance;
  }

  /**
   * Executes an authenticated request against the Velocity Custom API.
   */
  public async request<TResponse>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "POST",
    body?: unknown,
    retryOnAuthFailure = true
  ): Promise<TResponse> {
    const config = velocityConfigService.getConfig();

    // If sandbox / mock mode is active, return deterministic simulated response
    if (config.isMock) {
      return this.handleMockRequest<TResponse>(endpoint, method, body);
    }

    const token = await velocityAuthService.getAuthToken();
    const url = `${config.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

    logger.debug(`[VelocityClient] ${method} ${endpoint}`, {
      url,
      payloadSnippet: body ? JSON.stringify(body).substring(0, 150) : undefined,
    });

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Handle 401 Unauthorized by invalidating token and retrying once
      if (response.status === 401 && retryOnAuthFailure) {
        logger.warn(`[VelocityClient] Received HTTP 401 from ${endpoint}. Refreshing token and retrying...`);
        await velocityAuthService.invalidateToken();
        return this.request<TResponse>(endpoint, method, body, false);
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown response body");
        logger.error(`[VelocityClient] Error ${response.status} on ${endpoint}: ${errorText.substring(0, 200)}`);

        if (response.status === 422) {
          throw new Error(`Velocity Waybill/Validation Error (422): ${errorText}`);
        }
        if (response.status === 400) {
          throw new Error(`Velocity Request Error (400): ${errorText}`);
        }
        throw new Error(`Velocity HTTP Error ${response.status}: ${errorText}`);
      }

      const data: TResponse = await response.json();
      return data;
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === "AbortError") {
        logger.error(`[VelocityClient] Request to ${endpoint} timed out after ${config.requestTimeoutMs}ms`);
        throw new Error(`Velocity request timeout exceeded (${config.requestTimeoutMs}ms)`);
      }
      throw err;
    }
  }

  // ==========================================================================
  // Deterministic Mock Sandbox Engine for Development & Automated Testing
  // ==========================================================================

  private async handleMockRequest<TResponse>(
    endpoint: string,
    _method: string,
    body?: unknown
  ): Promise<TResponse> {
    // Artificial small latency to simulate network
    await new Promise((resolve) => setTimeout(resolve, 20));

    // 1. Warehouse Registration Mock
    if (endpoint.includes("/custom/api/v1/warehouse")) {
      const req = body as VelocityWarehouseRequest;
      const res: VelocityWarehouseResponse = {
        status: true,
        message: "Warehouse registered successfully",
        warehouse_id: req?.name ? `WH_${req.name.toUpperCase().replace(/\s+/g, "_").substring(0, 8)}` : "WH_SURAT_001",
        data: {
          warehouse_id: "WH_SURAT_001",
          name: req?.name || "LEZIVA Surat Atelier Warehouse",
          pincode: req?.pincode || "395007",
          city: req?.city || "Surat",
          state: req?.state || "Gujarat",
        },
      };
      return res as unknown as TResponse;
    }

    // 2. Serviceability Mock
    if (endpoint.includes("/custom/api/v1/serviceability")) {
      const req = body as VelocityServiceabilityRequest;
      const destinationPincode = req?.to || "400001";
      // Deterministic rule: Pin codes starting with 0 or length !== 6 are unserviceable
      const isServiceable = destinationPincode.length === 6 && destinationPincode !== "999999" && !destinationPincode.startsWith("0");

      const couriers = isServiceable
        ? [
            {
              courier_id: "bluedart_air",
              courier_name: "BlueDart Express Air",
              estimated_delivery_days: 2,
              estimated_delivery_date: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
              rate: 220,
              cod_available: true,
              prepaid_available: true,
            },
            {
              courier_id: "delhivery_surface",
              courier_name: "Delhivery Surface Special",
              estimated_delivery_days: 3,
              estimated_delivery_date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
              rate: 180,
              cod_available: req?.payment_mode === "cod",
              prepaid_available: true,
            },
          ]
        : [];

      const res: VelocityServiceabilityResponse = {
        status: true,
        message: isServiceable ? "Destination pincode is serviceable" : "Pincode is currently unserviceable",
        is_serviceable: isServiceable,
        couriers,
        data: {
          is_serviceable: isServiceable,
          available_couriers: couriers,
          from_pincode: req?.from || "395007",
          to_pincode: destinationPincode,
          zone: "West",
        },
      };
      return res as unknown as TResponse;
    }

    // 3. Forward Order Orchestration Mock
    if (endpoint.includes("/custom/api/v1/forward-order-orchestration")) {
      const req = body as VelocityForwardOrderOrchestrationRequest;
      const orderId = req?.order_id || `LZV-${Date.now()}`;
      const awbCode = `VEL${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const shipmentId = `shp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const res: VelocityForwardOrderOrchestrationResponse = {
        status: true,
        message: "Forward order manifested and AWB assigned successfully",
        order_id: orderId,
        shipment_id: shipmentId,
        awb_code: awbCode,
        courier_id: req?.carrier_id || "bluedart_air",
        courier_name: "BlueDart Express Air",
        label_url: `https://shazam.velocity.in/labels/${awbCode}.pdf`,
        manifest_url: `https://shazam.velocity.in/manifests/${shipmentId}.pdf`,
        data: {
          order_id: orderId,
          shipment_id: shipmentId,
          awb_code: awbCode,
          courier_id: "bluedart_air",
          courier_name: "BlueDart Express Air",
          label_url: `https://shazam.velocity.in/labels/${awbCode}.pdf`,
          manifest_url: `https://shazam.velocity.in/manifests/${shipmentId}.pdf`,
          expected_delivery_date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
        },
      };
      return res as unknown as TResponse;
    }

    // 4. Two-Step Forward Order Creation
    if (endpoint.includes("/custom/api/v1/forward-order-shipment")) {
      const req = body as VelocityForwardShipmentRequest;
      const awbCode = `VEL${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const res: VelocityForwardShipmentResponse = {
        status: true,
        message: "Shipment manifested successfully",
        awb_code: awbCode,
        courier_id: req?.carrier_id || "delhivery_surface",
        courier_name: "Delhivery Surface",
        label_url: `https://shazam.velocity.in/labels/${awbCode}.pdf`,
      };
      return res as unknown as TResponse;
    }

    if (endpoint.includes("/custom/api/v1/forward-order")) {
      const req = body as VelocityForwardOrderRequest;
      const orderId = req?.order_id || `LZV-${Date.now()}`;
      return {
        status: true,
        message: "Forward order created",
        order_id: orderId,
        shipment_id: `shp_twostep_${Date.now()}`,
      } as unknown as TResponse;
    }

    // 5. Tracking Mock
    if (endpoint.includes("/custom/api/v1/order-tracking")) {
      const req = body as VelocityTrackingRequest;
      const awbList = req?.awb || ["VEL1234567890"];

      const trackingItems = awbList.map((awb) => ({
        awb,
        order_id: "LZV-20261012-DEMO",
        courier_name: "BlueDart Express Air",
        current_status: "IN_TRANSIT",
        status_code: "IT",
        origin: "Surat",
        destination: "Mumbai",
        pickup_date: new Date(Date.now() - 86400000).toISOString(),
        expected_delivery_date: new Date(Date.now() + 86400000).toISOString(),
        activities: [
          {
            date_time: new Date(Date.now() - 86400000).toISOString(),
            status: "PICKED_UP",
            activity: "Shipment picked up from Surat Atelier Warehouse",
            location: "Surat Hub",
          },
          {
            date_time: new Date(Date.now() - 36000000).toISOString(),
            status: "IN_TRANSIT",
            activity: "Processed through Ahmedabad transit sorting facility",
            location: "Ahmedabad Airport Sorting Centre",
          },
        ],
      }));

      const res: VelocityTrackingResponse = {
        status: true,
        message: "Tracking data retrieved successfully",
        data: trackingItems,
        trackings: trackingItems,
      };
      return res as unknown as TResponse;
    }

    // 6. Cancellation Mock
    if (endpoint.includes("/custom/api/v1/cancel-order")) {
      const req = body as VelocityCancelOrderRequest;
      const awbList = req?.awb || [];
      const res: VelocityCancelOrderResponse = {
        status: true,
        message: "Cancellation request processed",
        data: awbList.map((awb) => ({
          awb,
          status: true,
          cancellation_status: "SUCCESS",
          message: "Shipment cancelled successfully with carrier",
        })),
      };
      return res as unknown as TResponse;
    }

    // 7. Reverse Order Orchestration Mock
    if (endpoint.includes("/custom/api/v1/reverse-order-orchestration")) {
      const req = body as VelocityReverseOrderOrchestrationRequest;
      const returnOrderId = req?.return_order_id || `RET-${Date.now()}`;
      const revAwb = `REV${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const revShipmentId = `rev_shp_${Date.now()}`;

      const res: VelocityReverseOrderOrchestrationResponse = {
        status: true,
        message: "Reverse pickup orchestrated and AWB assigned",
        return_order_id: returnOrderId,
        shipment_id: revShipmentId,
        awb_code: revAwb,
        courier_id: req?.carrier_id || "delhivery_reverse",
        courier_name: "Delhivery Reverse Logistics",
        label_url: `https://shazam.velocity.in/labels/${revAwb}.pdf`,
        pickup_scheduled_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        data: {
          return_order_id: returnOrderId,
          shipment_id: revShipmentId,
          awb_code: revAwb,
          courier_id: "delhivery_reverse",
          courier_name: "Delhivery Reverse Logistics",
          label_url: `https://shazam.velocity.in/labels/${revAwb}.pdf`,
          pickup_scheduled_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        },
      };
      return res as unknown as TResponse;
    }

    // 8. Summary Reports Mock
    if (endpoint.includes("/custom/api/v1/reports")) {
      const req = body as VelocityReportRequest;
      const res: VelocityReportResponse = {
        status: true,
        message: "Shipment summary report generated",
        data: [
          {
            order_id: "LZV-20261012-DEMO1",
            shipment_id: "shp_demo_1",
            awb_code: "VEL9821482194",
            courier_name: "BlueDart Express Air",
            status: "DELIVERED",
            order_date: req?.start_date_time || "2026-10-01 10:00:00",
            manifest_date: "2026-10-01 14:00:00",
            delivered_date: "2026-10-03 16:30:00",
          },
        ],
      };
      return res as unknown as TResponse;
    }

    // Generic fallback mock
    return {
      status: true,
      message: "Simulated endpoint response",
    } as unknown as TResponse;
  }
}

export const velocityApiClient = VelocityApiClient.getInstance();
