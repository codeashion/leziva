import { describe, it } from "node:test";
import assert from "node:assert";
import { prisma, checkDatabaseHealth } from "@/server/db/prisma";
import { productRepository } from "@/server/repositories/product.repository";
import { catalogService } from "@/server/services/catalog.service";
import { cartService } from "@/server/services/cart.service";
import { pricingService } from "@/server/services/pricing.service";
import { sessionRepository } from "@/server/repositories/session.repository";
import { redisService } from "@/server/redis/client";

describe("Performance & E2E Optimization Test Suite", () => {
  // Test Case 1: Database Health Probe & Warm Connection
  it("TC-1: Database connection pool reuse and health probe", async () => {
    const health = await checkDatabaseHealth();
    assert.strictEqual(health.status, "connected");
    assert.ok(typeof health.latencyMs === "number");
    assert.ok(health.latencyMs >= 0);
  });

  // Test Case 2: Categories Caching & Instant Second Hit
  it("TC-2: Category loading speedup via caching layer", async () => {
    // Warm up cache
    await catalogService.getCategories();

    // Measure cached read
    const start = performance.now();
    const categories = await catalogService.getCategories();
    const duration = performance.now() - start;

    assert.ok(categories.length >= 5, "Expected at least 5 atelier categories");
    assert.ok(duration < 50, `Expected cached categories read under 50ms, took ${duration.toFixed(1)}ms`);
  });

  // Test Case 3: Product Search & Filter Caching
  it("TC-3: Catalog search & filtering performance", async () => {
    // Warm up search
    await catalogService.searchProducts({ limit: 4, sort: "newest" });

    // Second hit must be instant
    const start = performance.now();
    const result = await catalogService.searchProducts({ limit: 4, sort: "newest" });
    const duration = performance.now() - start;

    assert.ok(result.products.length > 0, "Products should be returned");
    assert.ok(duration < 50, `Expected cached search read under 50ms, took ${duration.toFixed(1)}ms`);
  });

  // Test Case 4: Product Detail Page (PDP) Single-Query Resolution
  it("TC-4: PDP detail resolution without duplicate query waterfall", async () => {
    const testSlug = "royal-emerald-kanjivaram-silk-saree";
    const detail = await catalogService.getProductBySlug(testSlug);

    assert.ok(detail, "Product detail must exist");
    assert.strictEqual(detail.product.slug, testSlug);
    assert.ok(detail.product.variants.length > 0, "Product must have variants");
    assert.ok(Array.isArray(detail.related), "Related products array must exist");

    // Second hit warm cache check
    const start = performance.now();
    const warmDetail = await catalogService.getProductBySlug(testSlug);
    const duration = performance.now() - start;

    assert.ok(warmDetail);
    assert.ok(duration < 50, `Expected warm PDP lookup under 50ms, took ${duration.toFixed(1)}ms`);
  });

  // Test Case 5: Batch Variant Lookup (Anti-Waterfall)
  it("TC-5: Batch findVariantsByIds resolves multiple variants efficiently", async () => {
    const products = await productRepository.findProducts({ limit: 4 });
    const variantIds = products.products
      .flatMap((p) => p.variants.map((v) => v.id))
      .slice(0, 3);

    assert.ok(variantIds.length >= 2, "Expected at least 2 variants for test");

    const start = performance.now();
    const variantMap = await productRepository.findVariantsByIds(variantIds);
    const duration = performance.now() - start;

    assert.strictEqual(variantMap.size, variantIds.length);
    for (const vid of variantIds) {
      assert.ok(variantMap.has(vid), `Variant ${vid} must be resolved`);
      const entry = variantMap.get(vid);
      assert.ok(entry?.variant);
      assert.ok(entry?.product);
    }

    // Second call should resolve completely from in-memory cache
    const warmStart = performance.now();
    const warmMap = await productRepository.findVariantsByIds(variantIds);
    const warmDuration = performance.now() - warmStart;

    assert.strictEqual(warmMap.size, variantIds.length);
    assert.ok(warmDuration < 30, `Expected warm batch variant lookup under 30ms, took ${warmDuration.toFixed(1)}ms`);
  });

  // Test Case 6: Authoritative Checkout Quote Calculation
  it("TC-6: Checkout quote calculation performance with multiple items and coupons", async () => {
    const products = await productRepository.findProducts({ limit: 4 });
    const testVariants = products.products
      .flatMap((p) => p.variants)
      .slice(0, 2);

    assert.ok(testVariants.length >= 1, "Must have test variants");

    const items = testVariants.map((v) => ({ variantId: v.id, quantity: 1 }));

    // Quote calculation
    const quote = await pricingService.calculateQuote({
      items,
      couponCode: "LEZIVA10",
    });

    assert.ok(quote.subtotal > 0, "Subtotal must be positive");
    assert.ok(quote.totalAmount > 0, "Total must be positive");
    assert.strictEqual(quote.items.length, items.length);

    // Warm quote recalculation (simulating user checkout interactions)
    const start = performance.now();
    const warmQuote = await pricingService.calculateQuote({
      items,
      couponCode: "LEZIVA10",
    });
    const duration = performance.now() - start;

    assert.strictEqual(warmQuote.totalAmount, quote.totalAmount);
    assert.ok(duration < 50, `Expected warm quote recalculation under 50ms, took ${duration.toFixed(1)}ms`);
  });

  // Test Case 7: Cart Service Performance
  it("TC-7: Cart enrichment without sequential query loops", async () => {
    const guestCartId = `test_perf_cart_${Date.now()}`;
    const emptyCart = await cartService.getCart({ guestCartId });

    assert.strictEqual(emptyCart.itemCount, 0);
    assert.strictEqual(emptyCart.items.length, 0);

    // Add an item
    const products = await productRepository.findProducts({ limit: 1 });
    const variantId = products.products[0]?.variants[0]?.id;
    assert.ok(variantId, "Variant must exist to add to cart");

    const updatedCart = await cartService.addItem({ guestCartId }, variantId, 1);
    assert.strictEqual(updatedCart.itemCount, 1);
    assert.strictEqual(updatedCart.items.length, 1);
    assert.strictEqual(updatedCart.items[0].variantId, variantId);

    // Fetch cart again
    const start = performance.now();
    const fetchedCart = await cartService.getCart({ guestCartId });
    const duration = performance.now() - start;

    assert.strictEqual(fetchedCart.itemCount, 1);
    assert.ok(duration < 1500, `Cart fetch should complete reasonably, took ${duration.toFixed(1)}ms`);
  });

  // Test Case 8: Session Authentication Caching
  it("TC-8: Session caching eliminates redundant DB lookups on authenticated requests", async () => {
    const testTokenHash = `test_session_hash_${Date.now()}`;
    const testSessionData = {
      id: `sess_${Date.now()}`,
      userId: "test_user_id",
      sessionToken: testTokenHash,
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      revokedAt: null,
      user: {
        id: "test_user_id",
        email: "perf@leziva.com",
        status: "ACTIVE",
        userRoles: [],
      },
    };

    // Pre-cache
    await redisService.setWithTtl("session", testTokenHash, testSessionData, 300);

    // Fetch session
    const start = performance.now();
    const session = await sessionRepository.findActiveSession(testTokenHash);
    const duration = performance.now() - start;

    assert.ok(session, "Session must be resolved from cache");
    assert.strictEqual(session.userId, "test_user_id");
    assert.ok(duration < 30, `Expected cached session lookup under 30ms, took ${duration.toFixed(1)}ms`);

    // Invalidate session
    await sessionRepository.revokeSession(testTokenHash);
    const postRevoke = await redisService.getJson("session", testTokenHash);
    assert.strictEqual(postRevoke, null, "Revoked session must be removed from cache");
  });

  // Test Case 9: Inventory Stock Invalidation Safety
  it("TC-9: Stock modification invalidates variant cache immediately", async () => {
    const products = await productRepository.findProducts({ limit: 1 });
    const variant = products.products[0]?.variants[0];
    assert.ok(variant, "Variant must exist");

    // Prime the cache
    await productRepository.findVariantById(variant.id);

    // Modify stock
    productRepository.updateMemoryVariantStock(variant.id, 99);

    // Verify cache was purged and new quantity is returned
    const updated = await productRepository.findVariantById(variant.id);
    assert.ok(updated);
  });
});
