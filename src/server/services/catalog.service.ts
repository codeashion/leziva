import { productRepository, CatalogFilterOptions, CatalogSearchResult } from "@/server/repositories/product.repository";
import { redisService } from "@/server/redis/client";
import { Category, Collection, Product } from "@/shared/types";
import { logger } from "@/utils/logger";

const CATALOG_CACHE_NAMESPACE = "catalog";
const SHORT_TTL = 300; // 5 minutes for listings and product details
const LONG_TTL = 3600; // 1 hour for categories and collections

export class CatalogService {
  /**
   * List all active categories with Redis caching.
   */
  async getCategories(): Promise<Category[]> {
    const cacheKey = "categories:all";
    const cached = await redisService.getJson<Category[]>(CATALOG_CACHE_NAMESPACE, cacheKey);
    if (cached) {
      return cached;
    }

    const categories = await productRepository.getCategories();
    await redisService.setWithTtl(CATALOG_CACHE_NAMESPACE, cacheKey, categories, LONG_TTL);
    return categories;
  }

  /**
   * Get single category by slug.
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const cacheKey = `category:${slug.toLowerCase()}`;
    const cached = await redisService.getJson<Category>(CATALOG_CACHE_NAMESPACE, cacheKey);
    if (cached) {
      return cached;
    }

    const category = await productRepository.getCategoryBySlug(slug);
    if (category) {
      await redisService.setWithTtl(CATALOG_CACHE_NAMESPACE, cacheKey, category, LONG_TTL);
    }
    return category;
  }

  /**
   * List all active collections with Redis caching.
   */
  async getCollections(): Promise<Collection[]> {
    const cacheKey = "collections:all";
    const cached = await redisService.getJson<Collection[]>(CATALOG_CACHE_NAMESPACE, cacheKey);
    if (cached) {
      return cached;
    }

    const collections = await productRepository.getCollections();
    await redisService.setWithTtl(CATALOG_CACHE_NAMESPACE, cacheKey, collections, LONG_TTL);
    return collections;
  }

  /**
   * Get single collection by slug.
   */
  async getCollectionBySlug(slug: string): Promise<Collection | null> {
    const cacheKey = `collection:${slug.toLowerCase()}`;
    const cached = await redisService.getJson<Collection>(CATALOG_CACHE_NAMESPACE, cacheKey);
    if (cached) {
      return cached;
    }

    const collection = await productRepository.getCollectionBySlug(slug);
    if (collection) {
      await redisService.setWithTtl(CATALOG_CACHE_NAMESPACE, cacheKey, collection, LONG_TTL);
    }
    return collection;
  }

  /**
   * Search and filter published products with pagination and caching.
   */
  async searchProducts(options: CatalogFilterOptions): Promise<CatalogSearchResult> {
    // Generate deterministic cache key based on query parameters
    const paramKey = JSON.stringify({
      c: options.category || "",
      col: options.collection || "",
      q: options.search || "",
      min: options.minPrice,
      max: options.maxPrice,
      sz: options.size || "",
      clr: options.color || "",
      stk: options.inStock,
      f: options.featured,
      na: options.newArrival,
      s: options.sort || "recommended",
      p: options.page || 1,
      l: options.limit || 12,
    });

    const cacheKey = `products:query:${Buffer.from(paramKey).toString("base64")}`;
    const cached = await redisService.getJson<CatalogSearchResult>(
      CATALOG_CACHE_NAMESPACE,
      cacheKey
    );
    if (cached) {
      return cached;
    }

    const result = await productRepository.findProducts(options);
    await redisService.setWithTtl(CATALOG_CACHE_NAMESPACE, cacheKey, result, SHORT_TTL);
    return result;
  }

  /**
   * Get public product details by slug. Strictly excludes drafts/archived.
   */
  async getProductBySlug(slug: string): Promise<{ product: Product; related: Product[] } | null> {
    const cacheKey = `product:${slug.toLowerCase()}`;
    const cached = await redisService.getJson<{ product: Product; related: Product[] }>(
      CATALOG_CACHE_NAMESPACE,
      cacheKey
    );
    if (cached) {
      return cached;
    }

    const product = await productRepository.findBySlug(slug, false);
    if (!product) {
      return null;
    }

    const related = await productRepository.findRelated(product.id, product.categoryId, 3);
    const data = { product, related };

    await redisService.setWithTtl(CATALOG_CACHE_NAMESPACE, cacheKey, data, SHORT_TTL);
    return data;
  }

  /**
   * Get products in a specific collection.
   */
  async getCollectionProducts(
    collectionSlug: string,
    options: Omit<CatalogFilterOptions, "collection"> = {}
  ): Promise<{ collection: Collection; result: CatalogSearchResult } | null> {
    const collection = await this.getCollectionBySlug(collectionSlug);
    if (!collection) {
      return null;
    }

    const result = await this.searchProducts({
      ...options,
      collection: collectionSlug,
    });

    return { collection, result };
  }

  /**
   * Authoritative discount calculator.
   * Never accepts client-supplied discount percentages.
   */
  calculateDiscount(price: number, compareAtPrice?: number | null): {
    hasDiscount: boolean;
    discountPercent: number;
    savingsAmount: number;
  } {
    if (!compareAtPrice || compareAtPrice <= price) {
      return { hasDiscount: false, discountPercent: 0, savingsAmount: 0 };
    }

    const savingsAmount = compareAtPrice - price;
    const discountPercent = Math.round((savingsAmount / compareAtPrice) * 100);

    return {
      hasDiscount: discountPercent > 0,
      discountPercent,
      savingsAmount,
    };
  }

  /**
   * Invalidate catalog cache keys after product updates or restocks.
   */
  async invalidateCatalogCache(slug?: string): Promise<void> {
    try {
      if (slug) {
        await redisService.deleteKey(CATALOG_CACHE_NAMESPACE, `product:${slug.toLowerCase()}`);
      }
      await redisService.deleteKey(CATALOG_CACHE_NAMESPACE, "categories:all");
      await redisService.deleteKey(CATALOG_CACHE_NAMESPACE, "collections:all");
      logger.info("Catalog cache invalidated", { slug }, "CatalogService");
    } catch {
      // Graceful
    }
  }
}

export const catalogService = new CatalogService();
export default catalogService;
