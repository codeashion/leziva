/**
 * LEZIVA — Velocity Shipping Integration Configuration
 * 
 * Provides validated runtime settings, credential sanitization,
 * and environment diagnostic inspection.
 */

import { getServerEnv } from "@/shared/validations/env";

export interface VelocityConfig {
  baseUrl: string;
  username: string;
  password: string;
  warehouseId: string;
  pickupLocation: string;
  warehousePincode: string;
  requestTimeoutMs: number;
  isMock: boolean;
}

export class VelocityConfigService {
  private static instance: VelocityConfigService;
  private config: VelocityConfig | null = null;

  private constructor() {}

  public static getInstance(): VelocityConfigService {
    if (!VelocityConfigService.instance) {
      VelocityConfigService.instance = new VelocityConfigService();
    }
    return VelocityConfigService.instance;
  }

  public getConfig(): VelocityConfig {
    if (this.config) {
      return this.config;
    }

    const env = getServerEnv();

    const baseUrl = (process.env.VELOCITY_BASE_URL || env.VELOCITY_BASE_URL || "https://shazam.velocity.in/").replace(/\/+$/, "");
    const username = process.env.VELOCITY_USERNAME || env.VELOCITY_USERNAME || "leziva_sandbox_user";
    const password = process.env.VELOCITY_PASSWORD || env.VELOCITY_PASSWORD || "leziva_sandbox_password";
    const warehouseId = process.env.VELOCITY_WAREHOUSE_ID || env.VELOCITY_WAREHOUSE_ID || "WH_SURAT_001";
    const pickupLocation = process.env.VELOCITY_PICKUP_LOCATION || env.VELOCITY_PICKUP_LOCATION || "LEZIVA Surat Atelier Warehouse";
    const warehousePincode = process.env.VELOCITY_WAREHOUSE_PINCODE || env.VELOCITY_WAREHOUSE_PINCODE || "395007";
    const requestTimeoutMs = Number(process.env.VELOCITY_REQUEST_TIMEOUT_MS) || env.VELOCITY_REQUEST_TIMEOUT_MS || 15000;

    // Detect mock / sandbox placeholder status
    const isMock =
      process.env.NODE_ENV === "test" ||
      username.includes("placeholder") ||
      username.includes("sandbox") ||
      password.includes("placeholder") ||
      password.includes("sandbox") ||
      !process.env.VELOCITY_USERNAME;

    this.config = {
      baseUrl,
      username,
      password,
      warehouseId,
      pickupLocation,
      warehousePincode,
      requestTimeoutMs,
      isMock,
    };

    return this.config;
  }

  /**
   * Resets memoized configuration (useful during testing or credential rotation)
   */
  public resetConfig(): void {
    this.config = null;
  }

  /**
   * Returns a sanitized diagnostic representation with secrets masked.
   */
  public getSanitizedConfig(): Record<string, unknown> {
    const cfg = this.getConfig();
    return {
      baseUrl: cfg.baseUrl,
      username: cfg.username.substring(0, 3) + "***",
      hasPassword: Boolean(cfg.password),
      warehouseId: cfg.warehouseId,
      pickupLocation: cfg.pickupLocation,
      warehousePincode: cfg.warehousePincode,
      requestTimeoutMs: cfg.requestTimeoutMs,
      isMock: cfg.isMock,
    };
  }
}

export const velocityConfigService = VelocityConfigService.getInstance();
