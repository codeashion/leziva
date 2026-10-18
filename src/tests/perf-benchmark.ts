import { prisma } from "@/server/db/prisma";
import { productRepository } from "@/server/repositories/product.repository";
import { catalogService } from "@/server/services/catalog.service";
import { cartService } from "@/server/services/cart.service";
import { pricingService } from "@/server/services/pricing.service";

async function timeOperation<T>(label: string, fn: () => Promise<T>): Promise<{ label: string; durationMs: number; result: T }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = Math.round((performance.now() - start) * 10) / 10;
  console.log(`⏱️ [${label}]: ${durationMs}ms`);
  return { label, durationMs, result };
}

async function runBenchmark() {
  console.log("=== STARTING LEZIVA PERFORMANCE BENCHMARK ===");
  console.log("Database target:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));

  // 1. Raw DB Connection
  await timeOperation("Raw DB Ping (SELECT 1)", async () => {
    return prisma.$queryRawUnsafe("SELECT 1 as ping");
  });

  // Second ping (testing warm pool connection)
  await timeOperation("Warm DB Ping 2 (SELECT 1)", async () => {
    return prisma.$queryRawUnsafe("SELECT 1 as ping");
  });

  // 2. Categories
  const catRes = await timeOperation("productRepository.getCategories() [Uncached]", async () => {
    return productRepository.getCategories();
  });
  console.log(`   Found ${catRes.result.length} categories`);

  await timeOperation("catalogService.getCategories() [Cached 1st hit]", async () => {
    return catalogService.getCategories();
  });
  await timeOperation("catalogService.getCategories() [Cached 2nd hit]", async () => {
    return catalogService.getCategories();
  });

  // 3. Catalog Listing / Search
  const prodRes = await timeOperation("productRepository.findProducts(limit: 4) [Uncached]", async () => {
    return productRepository.findProducts({ limit: 4 });
  });
  console.log(`   Found ${prodRes.result.products.length} products (total: ${prodRes.result.total})`);

  await timeOperation("catalogService.searchProducts(limit: 4) [Cached 1st hit]", async () => {
    return catalogService.searchProducts({ limit: 4 });
  });
  await timeOperation("catalogService.searchProducts(limit: 4) [Cached 2nd hit]", async () => {
    return catalogService.searchProducts({ limit: 4 });
  });

  // 4. Product by Slug & Variant by ID
  const testProduct = prodRes.result.products[0];
  if (testProduct) {
    const slug = testProduct.slug;
    console.log(`   Testing PDP with slug: ${slug}`);

    await timeOperation("productRepository.findBySlug() [Uncached]", async () => {
      return productRepository.findBySlug(slug);
    });

    await timeOperation("catalogService.getProductBySlug() [Cached 1st hit]", async () => {
      return catalogService.getProductBySlug(slug);
    });

    await timeOperation("catalogService.getProductBySlug() [Cached 2nd hit]", async () => {
      return catalogService.getProductBySlug(slug);
    });

    const firstVariant = testProduct.variants[0];
    if (firstVariant) {
      console.log(`   Testing Variant lookup with ID: ${firstVariant.id}`);
      await timeOperation("productRepository.findVariantById() [1 item]", async () => {
        return productRepository.findVariantById(firstVariant.id);
      });

      // 5. Pricing Quote with 1 item
      await timeOperation("pricingService.calculateQuote() [1 item, NO coupon]", async () => {
        return pricingService.calculateQuote({
          items: [{ variantId: firstVariant.id, quantity: 1 }],
        });
      });

      // Pricing Quote with coupon
      await timeOperation("pricingService.calculateQuote() [1 item, WITH coupon LEZIVA10]", async () => {
        return pricingService.calculateQuote({
          items: [{ variantId: firstVariant.id, quantity: 1 }],
          couponCode: "LEZIVA10",
        });
      });
    }

    // 6. Test with multiple variants (Cart scenario)
    const variants = testProduct.variants.slice(0, 3);
    if (variants.length > 1) {
      console.log(`   Testing multi-item quote with ${variants.length} items`);
      await timeOperation(`pricingService.calculateQuote() [${variants.length} items - 1st hit]`, async () => {
        return pricingService.calculateQuote({
          items: variants.map(v => ({ variantId: v.id, quantity: 1 })),
          couponCode: "LEZIVA10",
        });
      });

      await timeOperation(`pricingService.calculateQuote() [${variants.length} items - 2nd hit (Warm)]`, async () => {
        return pricingService.calculateQuote({
          items: variants.map(v => ({ variantId: v.id, quantity: 1 })),
          couponCode: "LEZIVA10",
        });
      });
    }
  }

  // 7. Cart Service
  await timeOperation("cartService.getCart() [Guest empty cart]", async () => {
    return cartService.getCart({ guestCartId: "bench_guest_1" });
  });

  console.log("=== BENCHMARK COMPLETE ===");
  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
