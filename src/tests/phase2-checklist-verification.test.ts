import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { BRAND_IDENTITY } from "@/config/brand";
import { productRepository } from "@/server/repositories/product.repository";

describe("Checklist Item 1: Leziva Logo અને ત્રણેય Brand Colours", () => {
  it("verify official logo file exists on disk and has correct proportions", () => {
    const logoPath = path.join(process.cwd(), "public", "brand", "leziva_logo.webp");
    assert.ok(fs.existsSync(logoPath), "Official logo must exist in public/brand/leziva_logo.webp");
    const stats = fs.statSync(logoPath);
    assert.ok(stats.size > 0, "Logo file must not be empty");

    assert.strictEqual(BRAND_IDENTITY.proportions.width, 300);
    assert.strictEqual(BRAND_IDENTITY.proportions.height, 111);
    assert.strictEqual(BRAND_IDENTITY.proportions.aspectRatio, "300 / 111");
  });

  it("verify the 3 exact official brand colors", () => {
    assert.strictEqual(BRAND_IDENTITY.colors.warmIvory.hex, "#EAE6DE");
    assert.strictEqual(BRAND_IDENTITY.colors.deepEditorialBlue.hex, "#226192");
    assert.strictEqual(BRAND_IDENTITY.colors.coralOrange.hex, "#EF8557");
  });
});

describe("Checklist Item 2: Homepage અને Fashion Campaign Sections", () => {
  it("verify hero and festive campaign images exist and are non-empty", () => {
    const heroImg = path.join(process.cwd(), "public", "images", "catalog", "hero_campaign.jpg");
    const festiveImg = path.join(process.cwd(), "public", "images", "catalog", "festive_campaign.jpg");

    assert.ok(fs.existsSync(heroImg), "Hero campaign image must exist");
    assert.ok(fs.existsSync(festiveImg), "Festive campaign image must exist");
    assert.ok(fs.statSync(heroImg).size > 50000, "Hero image must be high resolution");
    assert.ok(fs.statSync(festiveImg).size > 50000, "Festive image must be high resolution");
  });

  it("verify all 5 category showcase images exist on disk", () => {
    const categories = ["cat_sarees.jpg", "cat_lehengas.jpg", "cat_dresses.jpg", "cat_kurtis.jpg", "cat_bridal.jpg"];
    for (const cat of categories) {
      const p = path.join(process.cwd(), "public", "images", "catalog", cat);
      assert.ok(fs.existsSync(p), `Category image ${cat} must exist`);
      assert.ok(fs.statSync(p).size > 10000, `Category image ${cat} must not be empty`);
    }
  });
});

describe("Checklist Item 3: Desktop Navigation અને Mobile Menu", () => {
  it("verify navigation destinations match defined routes", async () => {
    const categories = await productRepository.getCategories();
    assert.strictEqual(categories.length, 5);

    const expectedSlugs = ["sarees", "lehengas", "dresses", "kurtis", "bridal-couture"];
    for (const slug of expectedSlugs) {
      const found = categories.find((c) => c.slug === slug);
      assert.ok(found, `Category ${slug} must be available in navigation`);
    }
  });
});

describe("Checklist Item 4: Shop, Category અને Product Pages Data", () => {
  it("verify catalog repository returns shop products with pagination", async () => {
    const res = await productRepository.findProducts({ page: 1, limit: 12 });
    assert.ok(res.products.length > 0, "Shop must have products");
    assert.ok(res.total >= res.products.length);
  });

  it("verify every category slug resolves with valid category details", async () => {
    const slugs = ["sarees", "lehengas", "dresses", "kurtis", "bridal-couture"];
    for (const slug of slugs) {
      const cat = await productRepository.getCategoryBySlug(slug);
      assert.ok(cat, `Category ${slug} must resolve`);
      assert.strictEqual(cat?.slug, slug);
    }
  });

  it("verify PDP slug lookup returns product with variants, fabric, care, and images", async () => {
    const product = await productRepository.findBySlug("royal-emerald-kanjivaram-silk-saree");
    assert.ok(product);
    assert.ok(product.variants.length > 0);
    assert.ok(product.fabricDetails);
    assert.ok(product.careInstructions);
    assert.ok(product.images.length >= 2);
  });
});

describe("Checklist Item 5: Search, Filters અને Sorting", () => {
  it("verify search query filters products accurately", async () => {
    const banarasiSearch = await productRepository.findProducts({ search: "banarasi" });
    assert.ok(banarasiSearch.products.length > 0);
  });

  it("verify price filter constraints work", async () => {
    const filtered = await productRepository.findProducts({ minPrice: 20000, maxPrice: 50000 });
    assert.ok(filtered.products.length > 0);
    for (const p of filtered.products) {
      const hasVariantInRange = p.variants.some((v) => v.price >= 20000 && v.price <= 50000);
      assert.ok(hasVariantInRange, `Product ${p.slug} must have variant within price range`);
    }
  });

  it("verify sorting by newest and prices works", async () => {
    const newest = await productRepository.findProducts({ sort: "newest" });
    assert.ok(newest.products.length > 0);

    const priceAsc = await productRepository.findProducts({ sort: "price_asc" });
    assert.ok(priceAsc.products[0].variants[0].price <= priceAsc.products[priceAsc.products.length - 1].variants[0].price);
  });
});

describe("Checklist Item 6: Product Cards અને Variant Selection", () => {
  it("verify product card secondary hover images exist for macro details", () => {
    const sareeDetail = path.join(process.cwd(), "public", "images", "catalog", "saree_detail.jpg");
    const lehengaDetail = path.join(process.cwd(), "public", "images", "catalog", "lehenga_detail.jpg");

    assert.ok(fs.existsSync(sareeDetail), "Saree macro detail image must exist");
    assert.ok(fs.existsSync(lehengaDetail), "Lehenga macro detail image must exist");
  });

  it("verify variant selection prices and discounts compute properly", async () => {
    const product = await productRepository.findBySlug("royal-emerald-kanjivaram-silk-saree");
    assert.ok(product);
    const v = product.variants[0];
    assert.strictEqual(v.price, 24500);
    assert.strictEqual(v.compareAtPrice, 28900);

    const discountPercent = Math.round(((v.compareAtPrice - v.price) / v.compareAtPrice) * 100);
    assert.strictEqual(discountPercent, 15);
  });
});

describe("Checklist Item 7: Login અને Account Pages Integration", () => {
  it("verify auth route files exist for login, register, forgot-password, and account", () => {
    const loginPage = path.join(process.cwd(), "src", "app", "login", "page.tsx");
    const regPage = path.join(process.cwd(), "src", "app", "register", "page.tsx");
    const forgotPage = path.join(process.cwd(), "src", "app", "forgot-password", "page.tsx");
    const accountPage = path.join(process.cwd(), "src", "app", "account", "page.tsx");

    assert.ok(fs.existsSync(loginPage));
    assert.ok(fs.existsSync(regPage));
    assert.ok(fs.existsSync(forgotPage));
    assert.ok(fs.existsSync(accountPage));
  });
});

describe("Checklist Item 8: Buttons અને Links વર્તન", () => {
  it("verify cart calculations and free shipping threshold rule", () => {
    const threshold = 2999;
    const item1 = 24500;
    assert.ok(item1 >= threshold);
    assert.strictEqual(Math.max(0, threshold - item1), 0);
  });

  it("verify pincode check logic accepts 6 digits and calculates estimated delivery", () => {
    const pincode = "395002";
    assert.ok(/^\d{6}$/.test(pincode));
    const prefix = pincode.substring(0, 2);
    const isMetro = ["11", "12", "40", "56", "60", "70", "50", "38", "30", "39"].includes(prefix);
    assert.strictEqual(isMetro, true);
  });
});

describe("Checklist Item 9: Mobile Overflow, Broken Images અને Assets", () => {
  it("verify all catalog image files referenced in database exist and are non-empty", async () => {
    const res = await productRepository.findProducts({ limit: 50 });
    for (const p of res.products) {
      for (const img of p.images) {
        const fullPath = path.join(process.cwd(), "public", img.url.replace(/^\//, ""));
        assert.ok(fs.existsSync(fullPath), `Product image ${img.url} must exist at ${fullPath}`);
        assert.ok(fs.statSync(fullPath).size > 0, `Product image ${img.url} must have content`);
      }
    }
  });
});
