/**
 * LEZIVA In-Memory & Redis-Compatible Cache & Resilience Service
 * 
 * In Supabase-only architecture, operates as a high-performance in-memory cache
 * and rate limiter with TTL auto-expiration and zero external network dependencies.
 * If REDIS_URL is provided and active, can optionally sync with Redis.
 */

import "dotenv/config";
import Redis, { RedisOptions } from "ioredis";
import { logger } from "@/utils/logger";

export interface RedisHealthResult {
  status: "connected" | "disconnected" | "degraded";
  latencyMs?: number;
  error?: string;
  mode?: "redis" | "in-memory";
}

interface CacheEntry {
  value: string;
  expiresAt: number;
}

class RedisService {
  private client: Redis | null = null;
  private isConnected = false;
  private memoryFallback = new Map<string, CacheEntry>();
  private readonly keyPrefix = "leziva:";
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Periodic garbage collection for expired in-memory cache entries every 60 seconds
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [k, v] of this.memoryFallback.entries()) {
          if (now > v.expiresAt) {
            this.memoryFallback.delete(k);
          }
        }
      }, 60000);

      if (this.cleanupInterval && typeof this.cleanupInterval.unref === "function") {
        this.cleanupInterval.unref();
      }
    }
  }

  private getRedisUrl(): string | null {
    const url = process.env.REDIS_URL?.trim();
    if (!url || url === "memory" || url === "disabled") {
      return null;
    }
    return url;
  }

  private initializeClient(): Redis | null {
    if (this.client) {
      return this.client;
    }

    const redisUrl = this.getRedisUrl();
    if (!redisUrl) {
      return null;
    }

    try {
      const options: RedisOptions = {
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
          if (times > 2) return null;
          return Math.min(times * 100, 500);
        },
        connectTimeout: 3000,
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
    } catch {
      return null;
    }
  }

  public getRawClient(): Redis | null {
    return this.initializeClient();
  }

  /**
   * Health check probe testing cache connectivity and latency.
   * In Supabase-only In-Memory mode, instantly reports "connected" with 0ms latency.
   */
  public async checkHealth(): Promise<RedisHealthResult> {
    const redisUrl = this.getRedisUrl();
    if (!redisUrl) {
      return {
        status: "connected",
        latencyMs: 0,
        mode: "in-memory",
      };
    }

    const startTime = Date.now();
    try {
      const client = this.initializeClient();
      if (!client) {
        return {
          status: "connected",
          latencyMs: 0,
          mode: "in-memory",
        };
      }

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
          mode: "redis",
        };
      }

      return {
        status: "connected",
        latencyMs: 0,
        mode: "in-memory",
      };
    } catch {
      return {
        status: "connected",
        latencyMs: 0,
        mode: "in-memory",
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

    this.memoryFallback.set(fullKey, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    const client = this.initializeClient();
    if (client) {
      try {
        if (client.status === "wait") await client.connect();
        await client.set(fullKey, serialized, "EX", ttlSeconds);
      } catch {
        // In-memory fallback handles cache transparently
      }
    }

    return true;
  }

  /**
   * Retrieves a parsed JSON value by key.
   */
  public async getJson<T>(namespace: string, key: string): Promise<T | null> {
    const fullKey = this.formatKey(namespace, key);

    const client = this.initializeClient();
    if (client) {
      try {
        if (client.status === "wait") await client.connect();
        const data = await client.get(fullKey);
        if (data) return JSON.parse(data) as T;
      } catch {
        // Fall back to memory
      }
    }

    const entry = this.memoryFallback.get(fullKey);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memoryFallback.delete(fullKey);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  /**
   * Deletes a key.
   */
  public async deleteKey(namespace: string, key: string): Promise<boolean> {
    const fullKey = this.formatKey(namespace, key);
    this.memoryFallback.delete(fullKey);

    const client = this.initializeClient();
    if (client) {
      try {
        if (client.status === "wait") await client.connect();
        await client.del(fullKey);
      } catch {
        // Silently handled
      }
    }
    return true;
  }

  /**
   * Directly retrieves raw string key value.
   */
  public async get(key: string): Promise<string | null> {
    const fullKey = key.startsWith(this.keyPrefix) ? key : `${this.keyPrefix}${key}`;

    const client = this.initializeClient();
    if (client) {
      try {
        if (client.status === "wait") await client.connect();
        const data = await client.get(fullKey);
        if (data !== null) return data;
      } catch {
        // Fall back to memory
      }
    }

    const entry = this.memoryFallback.get(fullKey);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memoryFallback.delete(fullKey);
      return null;
    }
    return entry.value;
  }

  /**
   * Directly sets key value with TTL.
   */
  public async set(key: string, value: string, ttlSeconds = 3600): Promise<boolean> {
    const fullKey = key.startsWith(this.keyPrefix) ? key : `${this.keyPrefix}${key}`;

    this.memoryFallback.set(fullKey, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    const client = this.initializeClient();
    if (client) {
      try {
        if (client.status === "wait") await client.connect();
        await client.set(fullKey, value, "EX", ttlSeconds);
      } catch {
        // Silently handled
      }
    }

    return true;
  }

  /**
   * Directly deletes key.
   */
  public async del(key: string): Promise<boolean> {
    const fullKey = key.startsWith(this.keyPrefix) ? key : `${this.keyPrefix}${key}`;
    this.memoryFallback.delete(fullKey);

    const client = this.initializeClient();
    if (client) {
      try {
        if (client.status === "wait") await client.connect();
        await client.del(fullKey);
      } catch {
        // Silently handled
      }
    }

    return true;
  }

  /**
   * Sliding window or fixed-window rate limiter.
   * Works in-memory or with optional Redis sync.
   */
  public async checkRateLimit(
    action: string,
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetSeconds: number }> {
    const key = this.formatKey("ratelimit", `${action}:${identifier}`);

    const client = this.initializeClient();
    if (client) {
      try {
        if (client.status === "wait") await client.connect();
        const count = await client.incr(key);
        if (count === 1) await client.expire(key, windowSeconds);
        const ttl = await client.ttl(key);

        const allowed = count <= limit;
        const remaining = Math.max(0, limit - count);
        return {
          allowed,
          remaining,
          resetSeconds: ttl > 0 ? ttl : windowSeconds,
        };
      } catch {
        // Fall back to memory
      }
    }

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

  /**
   * Graceful disconnect on server termination.
   */
  public async disconnect(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
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
