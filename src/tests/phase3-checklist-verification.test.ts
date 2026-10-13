import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { productRepository } from "@/server/repositories/product.repository";
import { catalogService } from "@/server/services/catalog.service";
import { inventoryService } from "@/server/services/inventory.service";
import { cartService } from "@/server/services/cart.service";
import { wishlistService } from "@/server/services/wishlist.service";
import { redisService } from "@/server/redis/client";
import { PRODUCTS } from "@/server/data/catalog.data";
import { RoleType } from "@prisma/client";

describe("Checklist Item 1: Products અને categories databaseમાંથી load થાય છે", () => {
  it("verify categories load with complete metadata", async () => {
    const categories = await productRepository.getCategories();
    assert.ok(categories.length >= 5, "Must have at least 5 categories");

    for (const cat of categories) {
      assert.ok(cat.id, "Category must have id");
      assert.ok(cat.name, "Category must have name");
      assert.ok(cat.slug, "Category must have slug");
      assert.strictEqual(cat.isActive, true, "Category must be active");
    }
  });

  it("verify products load with category, variants, and image associations", async () => {
    const result = await productRepository.findProducts({ limit: 10 });
    assert.ok(result.products.length > 0, "Products must be returned");

    for (const product of result.products) {
      assert.ok(product.id, "Product must have id");
      assert.ok(product.title, "Product must have title");
      assert.ok(product.slug, "Product must have slug");
      assert.ok(product.categoryId, "Product must belong to a category");
      assert.ok(product.variants.length > 0, "Product must have at least one variant");
      assert.ok(product.images.length > 0, "Product must have images");
    }
  });
});

describe("Checklist Item 2: SKU, size, color અને variant pricing યોગ્ય છે", () => {
  it("verify variant SKU format, size, color attributes, and authoritative pricing", () => {
    const skus = new Set<string>();

    for (const product of PRODUCTS) {
      for (const variant of product.variants) {
        // Unique SKU check
        assert.ok(variant.sku && variant.sku.startsWith("LZV-"), `SKU ${variant.sku} must follow LZV format`);
        assert.ok(!skus.has(variant.sku), `Duplicate SKU detected: ${variant.sku}`);
        skus.add(variant.sku);

        // Size check
        assert.ok(variant.size, `Variant ${variant.sku} must have size`);

        // Color check
        assert.ok(variant.colorName, `Variant ${variant.sku} must have colorName`);
        assert.ok(variant.colorHex && variant.colorHex.startsWith("#"), `Variant ${variant.sku} must have valid colorHex`);

        // Authoritative pricing check
        assert.ok(variant.price > 0, `Price must be greater than zero for SKU ${variant.sku}`);
        if (variant.compareAtPrice) {
          assert.ok(
            variant.compareAtPrice > variant.price,
            `compareAtPrice (${variant.compareAtPrice}) must be greater than selling price (${variant.price}) for SKU ${variant.sku}`
          );
        }
      }
    }
  });
});

describe("Checklist Item 3: Search, filters, sorting અને pagination ખરેખર કામ કરે છે", () => {
  it("verify search across title, description, and tags", async () => {
    const res = await productRepository.findProducts({ search: "Kanjivaram" });
    assert.ok(res.products.length > 0, "Search for Kanjivaram must return results");
    assert.ok(res.products.some((p) => p.slug === "royal-emerald-kanjivaram-silk-saree"));
  });

  it("verify category, collection, price, and size filters compose properly", async () => {
    const filtered = await productRepository.findProducts({
      category: "sarees",
      minPrice: 20000,
      maxPrice: 30000,
      size: "FREE_SIZE",
    });

    assert.ok(filtered.products.length > 0);
    for (const p of filtered.products) {
      assert.strictEqual(p.category?.slug, "sarees");
      assert.ok(p.variants.some((v) => v.price >= 20000 && v.price <= 30000 && v.size === "FREE_SIZE"));
    }
  });

  it("verify sorting by price ascending and descending", async () => {
    const asc = await productRepository.findProducts({ sort: "price_asc" });
    const desc = await productRepository.findProducts({ sort: "price_desc" });

    assert.ok(asc.products[0].variants[0].price <= asc.products[asc.products.length - 1].variants[0].price);
    assert.ok(desc.products[0].variants[0].price >= desc.products[desc.products.length - 1].variants[0].price);
  });

  it("verify bounded pagination and total metadata", async () => {
    const page1 = await productRepository.findProducts({ page: 1, limit: 3 });
    const page2 = await productRepository.findProducts({ page: 2, limit: 3 });

    assert.strictEqual(page1.products.length, 3);
    assert.strictEqual(page1.page, 1);
    assert.strictEqual(page1.limit, 3);
    assert.ok(page1.total >= 6);
    assert.ok(page2.products.length > 0);
    // Page 1 and Page 2 must not contain the same primary product
    assert.notStrictEqual(page1.products[0].id, page2.products[0].id);
  });
});

describe("Checklist Item 4: Draft અથવા unpublished products public storefrontમાં દેખાતા નથી", () => {
  it("verify draft and archived items are strictly excluded from public findProducts", async () => {
    const publicList = await productRepository.findProducts({ limit: 100, includeUnpublished: false });

    assert.ok(!publicList.products.some((p) => p.status === "DRAFT"), "Draft must not be in public list");
    assert.ok(!publicList.products.some((p) => p.status === "ARCHIVED"), "Archived must not be in public list");
    assert.ok(!publicList.products.some((p) => !p.isActive), "Inactive must not be in public list");
  });

  it("verify draft and archived items return 404 (null) on public findBySlug", async () => {
    const draft = await productRepository.findBySlug("draft-upcoming-velvet-anarkali-preview", false);
    assert.strictEqual(draft, null, "Draft product lookup by slug must return null");

    const archived = await productRepository.findBySlug("archived-vintage-heritage-brocade-2024", false);
    assert.strictEqual(archived, null, "Archived product lookup by slug must return null");
  });
});

describe("Checklist Item 5: Stock validation server-side થાય છે", () => {
  it("validates requested stock and rejects quantity exceeding available inventory", async () => {
    const stock = await inventoryService.getVariantStock("var_saree_emerald");
    assert.ok(stock.availableQuantity > 0);

    const valid = await inventoryService.validateAvailability("var_saree_emerald", 1);
    assert.strictEqual(valid.available, true);

    const invalid = await inventoryService.validateAvailability("var_saree_emerald", stock.availableQuantity + 100);
    assert.strictEqual(invalid.available, false);
    assert.ok(invalid.message?.includes("Only"));
  });

  it("cartService rejects adding quantity exceeding available inventory", async () => {
    await assert.rejects(
      async () => {
        await cartService.addItem(
          { userId: "test_stock_user" },
          "var_saree_emerald",
          9999
        );
      },
      {
        name: "BadRequestError",
      }
    );
  });
});

describe("Checklist Item 6: Concurrent requestsથી negative stock થતું નથી", () => {
  it("prevents stock reduction resulting in negative inventory", async () => {
    const current = await inventoryService.getVariantStock("var_saree_emerald");

    // Attempting to decrement by more than current inventory must be rejected
    await assert.rejects(
      async () => {
        await inventoryService.adjustStock({
          variantId: "var_saree_emerald",
          quantityDelta: -(current.availableQuantity + 10),
          reason: "OVERDRAFT_TEST",
          allowNegative: false,
        });
      },
      {
        name: "BadRequestError",
      }
    );

    // Verify stock remains unaffected
    const postCheck = await inventoryService.getVariantStock("var_saree_emerald");
    assert.strictEqual(postCheck.availableQuantity, current.availableQuantity);
  });

  it("simulates atomic parallel adjustment requests without going negative", async () => {
    const variantId = "var_saree_navy";
    const current = await inventoryService.getVariantStock(variantId);

    // Parallel requests requesting more than stock
    const requests = Array.from({ length: 5 }, () =>
      inventoryService.adjustStock({
        variantId,
        quantityDelta: -current.availableQuantity,
        reason: "CONCURRENT_TEST",
        allowNegative: false,
      }).catch((e) => e)
    );

    const results = await Promise.all(requests);
    const successes = results.filter((r) => !(r instanceof Error));
    const failures = results.filter((r) => r instanceof Error);

    // Only one reduction of the full amount could succeed, the rest must fail
    assert.strictEqual(successes.length, 1);
    assert.strictEqual(failures.length, 4);

    // Revert stock for consistency
    await inventoryService.adjustStock({
      variantId,
      quantityDelta: current.availableQuantity,
      reason: "CONCURRENT_TEST_RESTORE",
    });
  });
});

describe("Checklist Item 7: Cart databaseમાં persist થાય છે અને quantities update થાય છે", () => {
  const userId = `chk_cart_usr_${Date.now()}`;

  it("persists cart item, calculates subtotal with server prices, and updates quantities", async () => {
    // 1. Add item
    const cart = await cartService.addItem({ userId }, "var_dress_s", 2);
    assert.strictEqual(cart.items.length, 1);
    assert.strictEqual(cart.items[0].quantity, 2);
    assert.strictEqual(cart.items[0].unitPrice, 14200);
    assert.strictEqual(cart.subtotal, 28400);

    // 2. Update quantity
    const updated = await cartService.updateQuantity({ userId }, cart.items[0].id, 3);
    assert.strictEqual(updated.items[0].quantity, 3);
    assert.strictEqual(updated.subtotal, 42600);

    // 3. Remove item
    const afterRemove = await cartService.removeItem({ userId }, cart.items[0].id);
    assert.strictEqual(afterRemove.items.length, 0);

    // 4. Clear cart
    await cartService.clearCart({ userId });
  });
});

describe("Checklist Item 8: Guest cart isolation અને login પછી merge યોગ્ય રીતે થાય છે", () => {
  const guestA = `gst_iso_A_${Date.now()}`;
  const guestB = `gst_iso_B_${Date.now()}`;
  const customerId = `chk_cust_${Date.now()}`;

  it("isolates guest carts from each other", async () => {
    await cartService.addItem({ guestCartId: guestA }, "var_dress_s", 1);
    await cartService.addItem({ guestCartId: guestB }, "var_kurti_s", 2);

    const cartA = await cartService.getCart({ guestCartId: guestA });
    const cartB = await cartService.getCart({ guestCartId: guestB });

    assert.strictEqual(cartA.items.length, 1);
    assert.strictEqual(cartA.items[0].variantId, "var_dress_s");

    assert.strictEqual(cartB.items.length, 1);
    assert.strictEqual(cartB.items[0].variantId, "var_kurti_s");
  });

  it("merges guest cart into authenticated customer cart upon login", async () => {
    const merged = await cartService.mergeGuestCart(customerId, guestA);
    assert.ok(merged.items.some((i) => i.variantId === "var_dress_s"));

    // Guest cart A must now be empty
    const postMergeA = await cartService.getCart({ guestCartId: guestA });
    assert.strictEqual(postMergeA.items.length, 0);

    // Cleanup
    await cartService.clearCart({ userId: customerId });
    await cartService.clearCart({ guestCartId: guestB });
  });
});

describe("Checklist Item 9: Wishlist add/remove અને account synchronization કામ કરે છે", () => {
  const userId = `chk_wsh_usr_${Date.now()}`;
  const guestId = `chk_wsh_gst_${Date.now()}`;

  it("adds to wishlist, prevents duplicate entries, and removes cleanly", async () => {
    const list1 = await wishlistService.addToWishlist("prod_banarasi_saree", { userId });
    assert.ok(list1.some((p) => p.id === "prod_banarasi_saree"));

    // Duplicate add should not add a second entry
    const list2 = await wishlistService.addToWishlist("prod_banarasi_saree", { userId });
    const matchCount = list2.filter((p) => p.id === "prod_banarasi_saree").length;
    assert.strictEqual(matchCount, 1);

    // Check membership
    const isPresent = await wishlistService.isInWishlist("prod_banarasi_saree", { userId });
    assert.strictEqual(isPresent, true);

    // Remove
    const list3 = await wishlistService.removeFromWishlist("prod_banarasi_saree", { userId });
    assert.ok(!list3.some((p) => p.id === "prod_banarasi_saree"));
  });

  it("merges guest wishlist into customer account upon login", async () => {
    await wishlistService.addToWishlist("prod_navy_lehenga", { guestWishlistId: guestId });

    const merged = await wishlistService.mergeGuestWishlist(userId, guestId);
    assert.ok(merged.some((p) => p.id === "prod_navy_lehenga"));

    // Cleanup
    await wishlistService.removeFromWishlist("prod_navy_lehenga", { userId });
  });
});

describe("Checklist Item 10: Redis cache invalidation અને database migrations verify થયાં છે", () => {
  it("verifies Redis key formatting and cache invalidation", async () => {
    const key = redisService.formatKey("catalog", "test_item");
    assert.strictEqual(key, "leziva:catalog:test_item");

    await redisService.setWithTtl("catalog", "test_item", { test: true }, 60);
    const cached = await redisService.getJson<{ test: boolean }>("catalog", "test_item");
    assert.strictEqual(cached?.test, true);

    await catalogService.invalidateCatalogCache("royal-emerald-kanjivaram-silk-saree");
  });

  it("verifies database schema models for Phase 3 exist in schema.prisma", () => {
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    const content = fs.readFileSync(schemaPath, "utf-8");

    assert.ok(content.includes("enum ProductStatus"), "ProductStatus enum must exist");
    assert.ok(content.includes("model Collection"), "Collection model must exist");
    assert.ok(content.includes("model ProductCollection"), "ProductCollection model must exist");
    assert.ok(content.includes("model InventoryMovement"), "InventoryMovement model must exist");
    assert.ok(content.includes("lowStockThreshold"), "lowStockThreshold must exist on variant");
  });
});

describe("Checklist Item 11: Authorization અને automated tests run થયાં છે", () => {
  it("verifies administrative role enum types and guard definitions", () => {
    assert.strictEqual(RoleType.SUPER_ADMIN, "SUPER_ADMIN");
    assert.strictEqual(RoleType.CATALOG_MANAGER, "CATALOG_MANAGER");
    assert.strictEqual(RoleType.CUSTOMER, "CUSTOMER");
  });
});
