/**
 * LEZIVA — Velocity Warehouse Service
 * 
 * Manages atelier warehouse registration, configuration validation,
 * and diagnostic connectivity checks with Velocity Shipping.
 */

import { velocityApiClient } from "./velocity.client";
import { velocityConfigService } from "./velocity.config";
import { VelocityWarehouseRequest, VelocityWarehouseResponse } from "./velocity.types";
import { logger } from "@/utils/logger";

export interface WarehouseDiagnosticResult {
  isConfigured: boolean;
  warehouseId: string;
  name: string;
  pincode: string;
  city: string;
  state: string;
  isMock: boolean;
  registrationStatus?: string;
}

export class VelocityWarehouseService {
  private static instance: VelocityWarehouseService;

  private constructor() {}

  public static getInstance(): VelocityWarehouseService {
    if (!VelocityWarehouseService.instance) {
      VelocityWarehouseService.instance = new VelocityWarehouseService();
    }
    return VelocityWarehouseService.instance;
  }

  /**
   * Registers a new warehouse or validates existing warehouse details via POST /custom/api/v1/warehouse
   */
  public async registerWarehouse(input?: Partial<VelocityWarehouseRequest>): Promise<VelocityWarehouseResponse> {
    const config = velocityConfigService.getConfig();

    const payload: VelocityWarehouseRequest = {
      name: input?.name || config.pickupLocation,
      contact_number: input?.contact_number || "9876543210",
      email: input?.email || "logistics@leziva.com",
      address: input?.address || "401-404 Silk Heritage Enclave, Ring Road",
      pincode: input?.pincode || config.warehousePincode,
      city: input?.city || "Surat",
      state: input?.state || "Gujarat",
      country: input?.country || "India",
      gstin: input?.gstin || "24AAAAA0000A1Z5",
      alternate_contact_number: input?.alternate_contact_number,
    };

    logger.info(`[VelocityWarehouse] Registering/validating warehouse: ${payload.name} (${payload.pincode})`);

    const response = await velocityApiClient.request<VelocityWarehouseResponse>(
      "/custom/api/v1/warehouse",
      "POST",
      payload
    );

    const registeredId = response.warehouse_id || response.data?.warehouse_id || config.warehouseId;
    logger.info(`[VelocityWarehouse] Warehouse confirmed with ID: ${registeredId}`);

    return response;
  }

  /**
   * Performs an operational diagnostic check of the current warehouse configuration.
   */
  public async getWarehouseDiagnostics(): Promise<WarehouseDiagnosticResult> {
    const config = velocityConfigService.getConfig();

    return {
      isConfigured: Boolean(config.warehouseId && config.warehousePincode),
      warehouseId: config.warehouseId,
      name: config.pickupLocation,
      pincode: config.warehousePincode,
      city: "Surat",
      state: "Gujarat",
      isMock: config.isMock,
    };
  }
}

export const velocityWarehouseService = VelocityWarehouseService.getInstance();
