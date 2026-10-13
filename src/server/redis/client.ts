/**
 * LEZIVA Redis Client & Cache Infrastructure Service
 * 
 * Provides managed Redis connectivity with exponential retry, health check probes,
 * structured namespacing, and resilience fallback mechanisms.
 */

import "dotenv/config";
import Redis, { RedisOptions } from "ioredis";
import { logger } from "@/utils/logger";
import { getServerEnv } from "@/shared/validations/env";

export interface RedisHealthResult {
  status: "connected" | "disconnected" | "degraded";
  latencyMs?: number;
  error?: string;
}

class RedisService {
  private client: Redis | null = null;
  private isConnected = false;
  private memoryFallback = new Map<string, { value: string; expiresAt: number }>();
  private readonly keyPrefix = "leziva:";

  private initializeClient(): Redis {
    if (this.client) {
      return this.client;
    }

    let redisUrl = "redis://localhost:6379";
    try {
      redisUrl = getServerEnv().REDIS_URL;
    } catch {
      // Use default if env parsing not complete yet
    }

    const options: RedisOptions = {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 2) {
          // Cease retrying if Redis daemon is offline
          return null;
        }
        return Math.min(times * 100, 500);
      },
      connectTimeout: 5000,
      lazyConnect: true,
      enableOfflineQueue: false,
    };

    const redis = new Redis(redisUrl, options);

    redis.on("connect", () => {
      this.isConnected = true;
      logger.info("Redis connected successfully", undefined, "RedisService");
    });

    redis.on("ready", () => {
      this.isConnected = true;
      logger.info("Redis ready to accept commands", undefined, "RedisService");
    });

    redis.on("error", (err) => {
      this.isConnected = false;
      logger.warn(`Redis connection warning: ${err.message}`, undefined, "RedisService");
    });

    redis.on("close", () => {
      this.isConnected = false;
    });

    this.client = redis;
    return this.client;
  }

  public getRawClient(): Redis {
    return this.initializeClient();
  }

  /**
   * Health check probe testing Redis connectivity and ping latency.
   */
  public async checkHealth(): Promise<RedisHealthResult> {
    const startTime = Date.now();
    try {
      const client = this.initializeClient();
      if (client.status === "wait") {
        await client.connect();
      }
      const response = await Promise.race([
        client.ping(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Redis ping timed out after 2000ms")), 2000)
        ),
      ]);

      if (response === "PONG") {
        return {
          status: "connected",
          latencyMs: Date.now() - startTime,
        };
      }

      return {
        status: "degraded",
        error: `Unexpected ping response: ${response}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        status: "disconnected",
        error: message,
      };
    }
  }

  /**
   * Formats a namespaced key: leziva:<namespace>:<key>
   */
  public formatKey(namespace: string, key: string): string {
    return `${this.keyPrefix}${namespace}:${key}`;
  }

  /**
   * Sets a value with TTL (in seconds).
   */
  public async setWithTtl(
    namespace: string,
    key: string,
    value: unknown,
    ttlSeconds: number
  ): Promise<boolean> {
    const fullKey = this.formatKey(namespace, key);
    const serialized = typeof value === "string" ? value : JSON.stringify(value);

    try {
      const client = this.initializeClient();
      if (client.status === "wait") {
        await client.connect();
      }
      await client.set(fullKey, serialized, "EX", ttlSeconds);
      return true;
    } catch {
      // Memory fallback for development/tests when Redis daemon is not running
      this.memoryFallback.set(fullKey, {
        value: serialized,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
      return true;
    }
  }

  /**
   * Retrieves a parsed JSON value by key.
   */
  public async getJson<T>(namespace: string, key: string): Promise<T | null> {
    const fullKey = this.formatKey(namespace, key);

    try {
      const client = this.initializeClient();
      if (client.status === "wait") {
        await client.connect();
      }
      const data = await client.get(fullKey);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      // Memory fallback lookup
      const entry = this.memoryFallback.get(fullKey);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        this.memoryFallback.delete(fullKey);
        return null;
      }
      return JSON.parse(entry.value) as T;
    }
  }

  /**
   * Deletes a key.
   */
  public async deleteKey(namespace: string, key: string): Promise<boolean> {
    const fullKey = this.formatKey(namespace, key);
    this.memoryFallback.delete(fullKey);

    try {
      const client = this.initializeClient();
      if (client.status === "wait") {
        await client.connect();
      }
      await client.del(fullKey);
      return true;
    } catch {
      return true;
    }
  }

  /**
   * Directly retrieves raw string key value.
   */
  public async get(key: string): Promise<string | null> {
    const fullKey = key.startsWith(this.keyPrefix) ? key : `${this.keyPrefix}${key}`;
    try {
      const client = this.initializeClient();
      if (client.status === "wait") {
        await client.connect();
      }
      return await client.get(fullKey);
    } catch {
      const entry = this.memoryFallback.get(fullKey);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        this.memoryFallback.delete(fullKey);
        return null;
      }
      return entry.value;
    }
  }

  /**
   * Directly sets key value with TTL.
   */
  public async set(key: string, value: string, ttlSeconds = 3600): Promise<boolean> {
    const fullKey = key.startsWith(this.keyPrefix) ? key : `${this.keyPrefix}${key}`;
    try {
      const client = this.initializeClient();
      if (client.status === "wait") {
        await client.connect();
      }
      await client.set(fullKey, value, "EX", ttlSeconds);
      return true;
    } catch {
      this.memoryFallback.set(fullKey, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
      return true;
    }
  }

  /**
   * Directly deletes key.
   */
  public async del(key: string): Promise<boolean> {
    const fullKey = key.startsWith(this.keyPrefix) ? key : `${this.keyPrefix}${key}`;
    this.memoryFallback.delete(fullKey);
    try {
      const client = this.initializeClient();
      if (client.status === "wait") {
        await client.connect();
      }
      await client.del(fullKey);
      return true;
    } catch {
      return true;
    }
  }

  /**
   * Sliding window or fixed-window rate limiter.
   * Returns { allowed: boolean, remaining: number, resetSeconds: number }
   */
  public async checkRateLimit(
    action: string,
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetSeconds: number }> {
    const key = this.formatKey("ratelimit", `${action}:${identifier}`);

    try {
      const client = this.initializeClient();
      if (client.status === "wait") {
        await client.connect();
      }
      const count = await client.incr(key);
      if (count === 1) {
        await client.expire(key, windowSeconds);
      }
      const ttl = await client.ttl(key);

      const allowed = count <= limit;
      const remaining = Math.max(0, limit - count);

      return {
        allowed,
        remaining,
        resetSeconds: ttl > 0 ? ttl : windowSeconds,
      };
    } catch {
      // Memory fallback rate limiter for tests/offline
      const now = Date.now();
      const entry = this.memoryFallback.get(key);
      let count = 1;
      let expiresAt = now + windowSeconds * 1000;

      if (entry && now < entry.expiresAt) {
        count = parseInt(entry.value, 10) + 1;
        expiresAt = entry.expiresAt;
      }

      this.memoryFallback.set(key, {
        value: String(count),
        expiresAt,
      });

      const allowed = count <= limit;
      const remaining = Math.max(0, limit - count);
      const resetSeconds = Math.max(1, Math.ceil((expiresAt - now) / 1000));

      return {
        allowed,
        remaining,
        resetSeconds,
      };
    }
  }

  /**
   * Graceful disconnect on server termination.
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
      this.client = null;
      this.isConnected = false;
    }
  }
}

export const redisService = new RedisService();
export default redisService;
