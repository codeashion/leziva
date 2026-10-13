import { describe, it } from "node:test";
import assert from "node:assert";
import { productRepository } from "@/server/repositories/product.repository";
import { catalogService } from "@/server/services/catalog.service";
import { inventoryService } from "@/server/services/inventory.service";
import { cartService } from "@/server/services/cart.service";
import { wishlistService } from "@/server/services/wishlist.service";
import { PRODUCTS } from "@/server/data/catalog.data";

describe("Phase 3 — Product Catalog & Publication Status Isolation", () => {
  it("public product listing strictly excludes DRAFT and ARCHIVED products", async () => {
    const result = await productRepository.findProducts({ limit: 50 });

    const draftFound = result.products.find((p) => p.status === "DRAFT");
    const archivedFound = result.products.find((p) => p.status === "ARCHIVED");
    const inactiveFound = result.products.find((p) => !p.isActive);

    assert.strictEqual(draftFound, undefined, "Draft products must NEVER appear in public listing");
    assert.strictEqual(archivedFound, undefined, "Archived products must NEVER appear in public listing");
    assert.strictEqual(inactiveFound, undefined, "Inactive products must NEVER appear in public listing");

    // All returned products must have ACTIVE status
    assert.ok(result.products.every((p) => p.status === "ACTIVE" && p.isActive));
  });

  it("public findBySlug returns null for draft or archived items", async () => {
    const draftLookup = await productRepository.findBySlug("draft-upcoming-velvet-anarkali-preview");
    const archivedLookup = await productRepository.findBySlug("archived-vintage-heritage-brocade-2024");

    assert.strictEqual(draftLookup, null, "Public lookup for draft slug must return null (404)");
    assert.strictEqual(archivedLookup, null, "Public lookup for archived slug must return null (404)");

    const activeLookup = await productRepository.findBySlug("royal-emerald-kanjivaram-silk-saree");
    assert.ok(activeLookup !== null, "Active product must be found");
    assert.strictEqual(activeLookup?.status, "ACTIVE");
  });

  it("enforces unique slugs across all products", () => {
    const slugs = PRODUCTS.map((p) => p.slug);
    const uniqueSlugs = new Set(slugs);
    assert.strictEqual(slugs.length, uniqueSlugs.size, "All product slugs in catalog must be unique");
  });

  it("enforces unique SKUs across all variants", () => {
    const skus = PRODUCTS.flatMap((p) => p.variants.map((v) => v.sku));
    const uniqueSkus = new Set(skus);
    assert.strictEqual(skus.length, uniqueSkus.size, "All variant SKUs must be unique across the catalog");
  });

  it("verifies category and collection associations", async () => {
    const categories = await catalogService.getCategories();
    assert.ok(categories.length >= 5);

    const collections = await catalogService.getCollections();
    assert.ok(collections.length >= 4);

    const bestSellersCol = await catalogService.getCollectionBySlug("best-sellers");
    assert.ok(bestSellersCol !== null, "best-sellers collection must exist");
  });
});

describe("Phase 3 — Authoritative Pricing & Discount Mathematics", () => {
  it("computes discount percentage strictly from authoritative database prices", () => {
    const discount = catalogService.calculateDiscount(24500, 28900);
    assert.strictEqual(discount.hasDiscount, true);
    assert.strictEqual(discount.savingsAmount, 4400);
    assert.strictEqual(discount.discountPercent, 15);
  });

  it("returns no discount when compareAtPrice is absent or less than selling price", () => {
    const noDiscount1 = catalogService.calculateDiscount(15000, null);
    assert.strictEqual(noDiscount1.hasDiscount, false);
    assert.strictEqual(noDiscount1.discountPercent, 0);

    const noDiscount2 = catalogService.calculateDiscount(15000, 15000);
    assert.strictEqual(noDiscount2.hasDiscount, false);

    const invalidDiscount = catalogService.calculateDiscount(15000, 12000);
    assert.strictEqual(invalidDiscount.hasDiscount, false);
  });
});

describe("Phase 3 — Search, Filtering, Sorting & Pagination", () => {
  it("searches across product title, description, and tags with case-insensitivity", async () => {
    const titleSearch = await productRepository.findProducts({ search: "Emerald" });
    assert.ok(titleSearch.products.some((p) => p.slug === "royal-emerald-kanjivaram-silk-saree"));

    const tagSearch = await productRepository.findProducts({ search: "zari" });
    assert.ok(tagSearch.products.length > 0);
  });

  it("filters products by category slug", async () => {
    const sareeResult = await productRepository.findProducts({ category: "sarees" });
    assert.ok(sareeResult.products.length > 0);
    assert.ok(sareeResult.products.every((p) => p.category?.slug === "sarees"));
  });

  it("filters products by collection association", async () => {
    const newArrivals = await productRepository.findProducts({ collection: "new-arrivals" });
    assert.ok(newArrivals.products.length > 0);
    assert.ok(
      newArrivals.products.every((p) =>
        p.collections?.some((c) => c.slug === "new-arrivals")
      )
    );
  });

  it("filters products by price range", async () => {
    const minPrice = 20000;
    const maxPrice = 30000;
    const result = await productRepository.findProducts({ minPrice, maxPrice });

    assert.ok(result.products.length > 0);
    assert.ok(
      result.products.every((p) =>
        p.variants.some((v) => v.price >= minPrice && v.price <= maxPrice)
      )
    );
  });

  it("filters products by size and availability", async () => {
    const sResult = await productRepository.findProducts({ size: "S" });
    assert.ok(sResult.products.length > 0);
    assert.ok(sResult.products.every((p) => p.variants.some((v) => v.size === "S")));

    const inStockResult = await productRepository.findProducts({ inStock: true });
    assert.ok(inStockResult.products.every((p) => p.variants.some((v) => v.inventoryQuantity > 0)));
  });

  it("sorts products deterministically", async () => {
    const asc = await productRepository.findProducts({ sort: "price_asc" });
    for (let i = 0; i < asc.products.length - 1; i++) {
      assert.ok(
        (asc.products[i].variants[0]?.price || 0) <= (asc.products[i + 1].variants[0]?.price || 0)
      );
    }

    const desc = await productRepository.findProducts({ sort: "price_desc" });
    for (let i = 0; i < desc.products.length - 1; i++) {
      assert.ok(
        (desc.products[i].variants[0]?.price || 0) >= (desc.products[i + 1].variants[0]?.price || 0)
      );
    }
  });

  it("enforces bounded pagination with limit caps", async () => {
    const paginated = await productRepository.findProducts({ page: 1, limit: 2 });
    assert.strictEqual(paginated.products.length, 2);
    assert.strictEqual(paginated.page, 1);
    assert.strictEqual(paginated.limit, 2);
    assert.ok(paginated.totalPages >= 1);
  });
});

describe("Phase 3 — Inventory Management & SKU-Level Tracking", () => {
  it("checks stock level and returns accurate inventory status", async () => {
    const status = await inventoryService.getVariantStock("var_saree_emerald");
    assert.strictEqual(status.variantId, "var_saree_emerald");
    assert.strictEqual(status.sku, "LZV-SAR-EMR-01");
    assert.ok(status.availableQuantity > 0);
    assert.ok(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"].includes(status.status));
    assert.strictEqual(status.isPurchasable, true);
  });

  it("validates requested quantity against inventory", async () => {
    const validCheck = await inventoryService.validateAvailability("var_saree_emerald", 1);
    assert.strictEqual(validCheck.available, true);

    const invalidCheck = await inventoryService.validateAvailability("var_saree_emerald", 99999);
    assert.strictEqual(invalidCheck.available, false);
    assert.ok(invalidCheck.message?.includes("Only"));
  });

  it("adjusts stock quantity atomically and creates movement log", async () => {
    const initial = await inventoryService.getVariantStock("var_saree_emerald");
    const delta = 2;

    const adjustment = await inventoryService.adjustStock({
      variantId: "var_saree_emerald",
      quantityDelta: delta,
      reason: "TEST_RESTOCK",
      notes: "Phase 3 automated verification restock",
    });

    assert.strictEqual(adjustment.previousQuantity, initial.availableQuantity);
    assert.strictEqual(adjustment.newQuantity, initial.availableQuantity + delta);
    assert.ok(adjustment.movementId.length > 0);

    // Verify updated stock
    const updated = await inventoryService.getVariantStock("var_saree_emerald");
    assert.strictEqual(updated.availableQuantity, initial.availableQuantity + delta);

    // Revert delta
    await inventoryService.adjustStock({
      variantId: "var_saree_emerald",
      quantityDelta: -delta,
      reason: "TEST_REVERT",
    });
  });

  it("prevents negative inventory without explicit business authorization", async () => {
    await assert.rejects(
      async () => {
        await inventoryService.adjustStock({
          variantId: "var_saree_emerald",
          quantityDelta: -999999,
          reason: "UNAUTHORIZED_OVERDRAFT",
          allowNegative: false,
        });
      },
      {
        name: "BadRequestError",
      }
    );
  });
});

describe("Phase 3 — Persistent Shopping Cart & Business Logic", () => {
  const testUserId = `test_usr_${Date.now()}`;
  const testGuestId = `test_gst_${Date.now()}`;

  it("adds item to user cart using server-authoritative price", async () => {
    const cart = await cartService.addItem(
      { userId: testUserId },
      "var_saree_emerald",
      2
    );

    assert.ok(cart.items.length >= 1);
    const item = cart.items.find((i) => i.variantId === "var_saree_emerald");
    assert.ok(item !== undefined);
    assert.strictEqual(item?.quantity, 2);
    assert.strictEqual(item?.unitPrice, 24500); // Authoritative server price
    assert.strictEqual(item?.totalPrice, 49000);
    assert.ok(cart.subtotal >= 49000);
    assert.strictEqual(cart.shippingEstimate, 0); // >= 2999 qualifies for free shipping
  });

  it("increments quantity when duplicate variant is added", async () => {
    const cart = await cartService.addItem(
      { userId: testUserId },
      "var_saree_emerald",
      1
    );

    const item = cart.items.find((i) => i.variantId === "var_saree_emerald");
    assert.strictEqual(item?.quantity, 3); // 2 + 1 = 3
  });

  it("rejects adding more units than available inventory", async () => {
    await assert.rejects(
      async () => {
        await cartService.addItem(
          { userId: testUserId },
          "var_saree_emerald",
          9999
        );
      },
      {
        name: "BadRequestError",
      }
    );
  });

  it("updates line item quantity and recalculates totals", async () => {
    const currentCart = await cartService.getCart({ userId: testUserId });
    const lineItem = currentCart.items[0];
    assert.ok(lineItem !== undefined);

    const updated = await cartService.updateQuantity(
      { userId: testUserId },
      lineItem.id,
      1
    );

    const updatedItem = updated.items.find((i) => i.variantId === lineItem.variantId);
    assert.strictEqual(updatedItem?.quantity, 1);
  });

  it("removes line item and clears cart", async () => {
    const currentCart = await cartService.getCart({ userId: testUserId });
    const lineItem = currentCart.items[0];
    assert.ok(lineItem !== undefined);

    const afterRemove = await cartService.removeItem(
      { userId: testUserId },
      lineItem.id
    );
    assert.strictEqual(afterRemove.items.length, 0);

    const afterClear = await cartService.clearCart({ userId: testUserId });
    assert.strictEqual(afterClear.items.length, 0);
    assert.strictEqual(afterClear.subtotal, 0);
  });

  it("manages guest cart and merges into customer account upon login", async () => {
    // 1. Add item to guest cart
    const guestCart = await cartService.addItem(
      { guestCartId: testGuestId },
      "var_dress_s",
      1
    );
    assert.strictEqual(guestCart.items.length, 1);

    // 2. Perform merge into user account
    const mergedCart = await cartService.mergeGuestCart(testUserId, testGuestId);
    assert.ok(mergedCart.items.some((i) => i.variantId === "var_dress_s"));

    // 3. Guest cart should now be empty/cleared
    const postMergeGuest = await cartService.getCart({ guestCartId: testGuestId });
    assert.strictEqual(postMergeGuest.items.length, 0);

    // Cleanup
    await cartService.clearCart({ userId: testUserId });
  });
});

describe("Phase 3 — Wishlist Persistence & Uniqueness", () => {
  const testUserId = `test_wsh_user_${Date.now()}`;
  const testGuestId = `test_wsh_guest_${Date.now()}`;

  it("adds product to customer wishlist and prevents duplicate entries", async () => {
    const list1 = await wishlistService.addToWishlist(
      "prod_banarasi_saree",
      { userId: testUserId }
    );
    assert.ok(list1.some((p) => p.id === "prod_banarasi_saree"));

    // Add same product again - should not duplicate
    const list2 = await wishlistService.addToWishlist(
      "prod_banarasi_saree",
      { userId: testUserId }
    );
    const count = list2.filter((p) => p.id === "prod_banarasi_saree").length;
    assert.strictEqual(count, 1, "Wishlist must have at most 1 entry per product");
  });

  it("verifies product membership and removes from wishlist", async () => {
    const isMember = await wishlistService.isInWishlist(
      "prod_banarasi_saree",
      { userId: testUserId }
    );
    assert.strictEqual(isMember, true);

    const listAfterRemove = await wishlistService.removeFromWishlist(
      "prod_banarasi_saree",
      { userId: testUserId }
    );
    assert.ok(!listAfterRemove.some((p) => p.id === "prod_banarasi_saree"));

    const isMemberAfter = await wishlistService.isInWishlist(
      "prod_banarasi_saree",
      { userId: testUserId }
    );
    assert.strictEqual(isMemberAfter, false);
  });

  it("merges guest wishlist into customer account upon login", async () => {
    await wishlistService.addToWishlist("prod_navy_lehenga", {
      guestWishlistId: testGuestId,
    });

    const merged = await wishlistService.mergeGuestWishlist(
      testUserId,
      testGuestId
    );
    assert.ok(merged.some((p) => p.id === "prod_navy_lehenga"));

    // Clean up
    await wishlistService.removeFromWishlist("prod_navy_lehenga", {
      userId: testUserId,
    });
  });
});
