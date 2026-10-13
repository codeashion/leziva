/**
 * LEZIVA — Velocity Shipping Authentication & Token Service
 * 
 * Manages 24-hour Bearer token lifecycle, caching in Redis/memory,
 * preemptive refresh before expiry, and concurrency control.
 */

import { velocityConfigService } from "./velocity.config";
import { VelocityAuthRequest, VelocityAuthResponse, CachedTokenData } from "./velocity.types";
import { redisService } from "@/server/redis/client";
import { logger } from "@/utils/logger";

const TOKEN_CACHE_KEY = "velocity:auth:token_v1";
const TOKEN_EXPIRY_SAFETY_WINDOW_MS = 15 * 60 * 1000; // 15 minutes preemptive refresh

export class VelocityAuthService {
  private static instance: VelocityAuthService;
  private memoryToken: CachedTokenData | null = null;
  private activeRefreshPromise: Promise<string> | null = null;

  private constructor() {}

  public static getInstance(): VelocityAuthService {
    if (!VelocityAuthService.instance) {
      VelocityAuthService.instance = new VelocityAuthService();
    }
    return VelocityAuthService.instance;
  }

  /**
   * Checks whether the in-memory token is absent or within expiry safety window.
   */
  public isTokenExpired(): boolean {
    if (!this.memoryToken) return true;
    return this.memoryToken.expiresAt - Date.now() <= TOKEN_EXPIRY_SAFETY_WINDOW_MS;
  }

  /**
   * Retrieves a valid Bearer token, automatically refreshing if expired or near expiry.
   */
  public async getAuthToken(): Promise<string> {
    const now = Date.now();

    // 1. Check in-memory cache
    if (this.memoryToken && this.memoryToken.expiresAt - now > TOKEN_EXPIRY_SAFETY_WINDOW_MS) {
      return this.memoryToken.token;
    }

    // 2. Check Redis cache
    try {
      const cached = await redisService.get(TOKEN_CACHE_KEY);
      if (cached) {
        const parsed: CachedTokenData = JSON.parse(cached);
        if (parsed.expiresAt - now > TOKEN_EXPIRY_SAFETY_WINDOW_MS) {
          this.memoryToken = parsed;
          return parsed.token;
        }
      }
    } catch {
      // Redis error fallback to in-memory check
    }

    // 3. Concurrency Lock: If a refresh is already underway, wait for it
    if (this.activeRefreshPromise) {
      return this.activeRefreshPromise;
    }

    // 4. Trigger controlled token acquisition
    this.activeRefreshPromise = this.refreshToken();
    try {
      const token = await this.activeRefreshPromise;
      return token;
    } finally {
      this.activeRefreshPromise = null;
    }
  }

  /**
   * Performs real / mock login to Velocity API: POST /custom/api/v1/auth-token
   */
  public async refreshToken(): Promise<string> {
    const config = velocityConfigService.getConfig();

    // In mock/test environments or placeholder credentials, generate a deterministic token
    if (config.isMock) {
      const mockToken = `vel_mock_token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      this.storeToken({ token: mockToken, expiresAt });
      logger.info("[VelocityAuth] Generated sandbox auth token (valid for 24h)");
      return mockToken;
    }

    logger.info("[VelocityAuth] Requesting fresh auth token from Velocity endpoint...");

    const url = `${config.baseUrl}/custom/api/v1/auth-token`;
    const payload: VelocityAuthRequest = {
      username: config.username,
      password: config.password,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown response body");
        logger.error(`[VelocityAuth] Auth failure HTTP ${response.status}: ${errorText.substring(0, 150)}`);
        throw new Error(`Velocity authentication failed with status ${response.status}`);
      }

      const data: VelocityAuthResponse = await response.json();
      const token = data.token || data.data?.token;

      if (!token) {
        logger.error("[VelocityAuth] Missing token in successful response payload");
        throw new Error("Velocity response was missing expected authentication token");
      }

      // Default validity is 24 hours (86,400s)
      const expiresInSec = data.expires_in || data.data?.expires_in || 86400;
      const expiresAt = Date.now() + expiresInSec * 1000;

      await this.storeToken({ token, expiresAt });
      logger.info("[VelocityAuth] Acquired and cached fresh auth token successfully");
      return token;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const msg = err instanceof Error ? err.message : "Unknown auth error";
      logger.error(`[VelocityAuth] Token acquisition error: ${msg}`);
      throw err;
    }
  }

  /**
   * Invalidates cached token (e.g. upon receiving an unexpected HTTP 401 from an upstream endpoint)
   */
  public async invalidateToken(): Promise<void> {
    this.memoryToken = null;
    try {
      await redisService.del(TOKEN_CACHE_KEY);
    } catch {
      // Ignore cache deletion errors
    }
    logger.warn("[VelocityAuth] Invalidated cached token");
  }

  private async storeToken(data: CachedTokenData): Promise<void> {
    this.memoryToken = data;
    const ttlSeconds = Math.max(Math.floor((data.expiresAt - Date.now()) / 1000), 60);
    try {
      await redisService.set(TOKEN_CACHE_KEY, JSON.stringify(data), ttlSeconds);
    } catch {
      // Fallback is in memory
    }
  }
}

export const velocityAuthService = VelocityAuthService.getInstance();
