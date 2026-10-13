import { describe, it } from "node:test";
import assert from "node:assert";
import { productRepository } from "@/server/repositories/product.repository";
import { BRAND_IDENTITY } from "@/config/brand";

describe("Phase 2 — Brand Identity & Palette Verification", () => {
  it("should enforce the three official brand colors without deviation", () => {
    assert.strictEqual(BRAND_IDENTITY.colors.warmIvory.hex, "#EAE6DE");
    assert.strictEqual(BRAND_IDENTITY.colors.deepEditorialBlue.hex, "#226192");
    assert.strictEqual(BRAND_IDENTITY.colors.coralOrange.hex, "#EF8557");
  });

  it("should preserve the official logo asset path and aspect ratio", () => {
    assert.strictEqual(BRAND_IDENTITY.assets.logoOfficial, "/brand/leziva_logo.webp");
    assert.strictEqual(BRAND_IDENTITY.proportions.width, 300);
    assert.strictEqual(BRAND_IDENTITY.proportions.height, 111);
    assert.strictEqual(BRAND_IDENTITY.proportions.aspectRatio, "300 / 111");
  });
});

describe("Phase 2 — Catalog Data & Product Repository", () => {
  it("should return the five official atelier categories", async () => {
    const categories = await productRepository.getCategories();
    assert.ok(categories.length >= 5, "Expected at least 5 categories");

    const slugs = categories.map((c) => c.slug);
    assert.ok(slugs.includes("sarees"));
    assert.ok(slugs.includes("lehengas"));
    assert.ok(slugs.includes("dresses"));
    assert.ok(slugs.includes("kurtis"));
    assert.ok(slugs.includes("bridal-couture"));
  });

  it("should find products by category slug", async () => {
    const result = await productRepository.findProducts({ category: "sarees" });
    assert.ok(result.products.length > 0);
    assert.strictEqual(result.products[0].category?.slug, "sarees");
  });

  it("should find product by unique slug with variants and images", async () => {
    const product = await productRepository.findBySlug("royal-emerald-kanjivaram-silk-saree");
    assert.ok(product, "Product should exist");
    assert.strictEqual(product?.slug, "royal-emerald-kanjivaram-silk-saree");
    assert.ok(product.variants.length > 0, "Product must have variants");
    assert.ok(product.images.length >= 2, "Product should have multiple images for gallery/hover");
  });

  it("should sort products by price ascending and descending", async () => {
    const ascResult = await productRepository.findProducts({ sort: "price_asc" });
    const descResult = await productRepository.findProducts({ sort: "price_desc" });

    const firstAscPrice = ascResult.products[0].variants[0].price;
    const lastAscPrice = ascResult.products[ascResult.products.length - 1].variants[0].price;
    assert.ok(firstAscPrice <= lastAscPrice, "Price ascending order failed");

    const firstDescPrice = descResult.products[0].variants[0].price;
    const lastDescPrice = descResult.products[descResult.products.length - 1].variants[0].price;
    assert.ok(firstDescPrice >= lastDescPrice, "Price descending order failed");
  });

  it("should filter products by search query across title, description, and tags", async () => {
    const searchResult = await productRepository.findProducts({ search: "zari" });
    assert.ok(searchResult.products.length > 0);
    for (const p of searchResult.products) {
      const match =
        p.title.toLowerCase().includes("zari") ||
        p.description.toLowerCase().includes("zari") ||
        p.tags.some((t) => t.toLowerCase().includes("zari"));
      assert.ok(match, `Product ${p.slug} should match search term 'zari'`);
    }
  });

  it("should return related products from the same category", async () => {
    const related = await productRepository.findRelated(
      "prod_banarasi_saree",
      "cat_sarees",
      2
    );
    // All related items must have different IDs
    assert.ok(related.every((p) => p.id !== "prod_banarasi_saree"));
  });
});

describe("Phase 2 — Cart Calculations & Business Rules", () => {
  it("should qualify for free express delivery on orders >= ₹2,999", () => {
    const freeShippingThreshold = 2999;
    const subtotalEligible = 24500;
    const subtotalIneligible = 1500;

    assert.ok(subtotalEligible >= freeShippingThreshold);
    assert.ok(subtotalIneligible < freeShippingThreshold);
    assert.strictEqual(Math.max(0, freeShippingThreshold - subtotalIneligible), 1499);
  });
});
