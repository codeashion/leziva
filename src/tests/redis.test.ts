import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { redisService } from "../server/redis/client";

describe("Redis Service & Resilience Layer", () => {
  after(async () => {
    await redisService.disconnect();
  });
  it("should correctly format namespaced keys", () => {
    const key = redisService.formatKey("ratelimit", "login:127.0.0.1");
    assert.equal(key, "leziva:ratelimit:login:127.0.0.1");
  });

  it("should handle set and get operations with fallback resilience", async () => {
    const testKey = "test_cart_user_123";
    const testData = { items: [{ id: "sku_1", quantity: 2 }] };

    await redisService.setWithTtl("cart", testKey, testData, 60);
    const retrieved = await redisService.getJson<typeof testData>("cart", testKey);

    assert.deepEqual(retrieved, testData);

    await redisService.deleteKey("cart", testKey);
    const afterDelete = await redisService.getJson("cart", testKey);
    assert.equal(afterDelete, null);
  });

  it("should enforce rate limiting bounds", async () => {
    const action = "test_action";
    const ip = `ip_test_${Date.now()}`;
    const limit = 3;
    const windowSeconds = 10;

    // First request
    const r1 = await redisService.checkRateLimit(action, ip, limit, windowSeconds);
    assert.equal(r1.allowed, true);
    assert.equal(r1.remaining, 2);

    // Second request
    const r2 = await redisService.checkRateLimit(action, ip, limit, windowSeconds);
    assert.equal(r2.allowed, true);
    assert.equal(r2.remaining, 1);

    // Third request (limit reached)
    const r3 = await redisService.checkRateLimit(action, ip, limit, windowSeconds);
    assert.equal(r3.allowed, true);
    assert.equal(r3.remaining, 0);

    // Fourth request (should be blocked)
    const r4 = await redisService.checkRateLimit(action, ip, limit, windowSeconds);
    assert.equal(r4.allowed, false);
    assert.equal(r4.remaining, 0);
  });
});
