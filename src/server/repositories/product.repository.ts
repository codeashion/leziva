import { prisma } from "@/server/db/prisma";
import { CATEGORIES, PRODUCTS, COLLECTIONS } from "@/server/data/catalog.data";
import { Product, Category, Collection, ProductVariant } from "@/shared/types";
import { logger } from "@/utils/logger";
import { ProductStatus } from "@prisma/client";

export interface CatalogFilterOptions {
  category?: string;
  collection?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  inStock?: boolean;
  featured?: boolean;
  newArrival?: boolean;
  sort?: "recommended" | "newest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
  includeUnpublished?: boolean;
}

export interface CatalogSearchResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ProductRepository {
  // In-memory catalog state for resilient runtime operations
  private memoryProducts: Product[] = [...PRODUCTS];
  private memoryCategories: Category[] = [...CATEGORIES];
  private memoryCollections: Collection[] = [...COLLECTIONS];

  // =========================================================================
  // Categories
  // =========================================================================

  async getCategories(): Promise<Category[]> {
    try {
      const dbCategories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });

      if (dbCategories.length > 0) {
        return dbCategories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          imageUrl: c.imageUrl,
          parentId: c.parentId,
          isActive: c.isActive,
          sortOrder: c.sortOrder,
        }));
      }
    } catch {
      logger.info("Using resilient catalog categories fallback", undefined, "ProductRepository");
    }

    return this.memoryCategories.filter((c) => c.isActive);
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const dbCat = await prisma.category.findUnique({
        where: { slug },
      });
      if (dbCat && dbCat.isActive) {
        return {
          id: dbCat.id,
          name: dbCat.name,
          slug: dbCat.slug,
          description: dbCat.description,
          imageUrl: dbCat.imageUrl,
          parentId: dbCat.parentId,
          isActive: dbCat.isActive,
          sortOrder: dbCat.sortOrder,
        };
      }
    } catch {
      // Fallback
    }
    const categories = await this.getCategories();
    return categories.find((c) => c.slug.toLowerCase() === slug.toLowerCase()) || null;
  }

  // =========================================================================
  // Collections
  // =========================================================================

  async getCollections(): Promise<Collection[]> {
    try {
      const dbCollections = await prisma.collection.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });

      if (dbCollections.length > 0) {
        return dbCollections.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          imageUrl: c.imageUrl,
          isActive: c.isActive,
          isFeatured: c.isFeatured,
          sortOrder: c.sortOrder,
        }));
      }
    } catch {
      logger.info("Using resilient catalog collections fallback", undefined, "ProductRepository");
    }

    return this.memoryCollections.filter((c) => c.isActive);
  }

  async getCollectionBySlug(slug: string): Promise<Collection | null> {
    try {
      const dbCol = await prisma.collection.findUnique({
        where: { slug },
      });
      if (dbCol && dbCol.isActive) {
        return {
          id: dbCol.id,
          name: dbCol.name,
          slug: dbCol.slug,
          description: dbCol.description,
          imageUrl: dbCol.imageUrl,
          isActive: dbCol.isActive,
          isFeatured: dbCol.isFeatured,
          sortOrder: dbCol.sortOrder,
        };
      }
    } catch {
      // Fallback
    }
    const collections = await this.getCollections();
    return collections.find((c) => c.slug.toLowerCase() === slug.toLowerCase()) || null;
  }

  // =========================================================================
  // Product Search, Listing & Filtering
  // =========================================================================

  async findProducts(options: CatalogFilterOptions = {}): Promise<CatalogSearchResult> {
    const {
      category,
      collection,
      search,
      minPrice,
      maxPrice,
      size,
      color,
      inStock,
      featured,
      newArrival,
      sort = "recommended",
      page = 1,
      limit = 12,
      includeUnpublished = false,
    } = options;

    // Enforce bounded pagination
    const boundedPage = Math.max(1, page);
    const boundedLimit = Math.min(50, Math.max(1, limit));

    try {
      // Build dynamic Prisma where query
      const where: Record<string, unknown> = {};

      if (!includeUnpublished) {
        where.status = ProductStatus.ACTIVE;
        where.isActive = true;
      }

      if (featured !== undefined) {
        where.isFeatured = featured;
      }

      if (newArrival !== undefined) {
        where.isNewArrival = newArrival;
      }

      if (category) {
        where.category = { slug: category };
      }

      if (collection) {
        where.collections = {
          some: {
            collection: { slug: collection, isActive: true },
          },
        };
      }

      if (search) {
        const sanitized = search.trim();
        if (sanitized.length > 0) {
          where.OR = [
            { title: { contains: sanitized, mode: "insensitive" } },
            { description: { contains: sanitized, mode: "insensitive" } },
            { tags: { has: sanitized.toLowerCase() } },
            {
              variants: {
                some: {
                  OR: [
                    { sku: { contains: sanitized, mode: "insensitive" } },
                    { colorName: { contains: sanitized, mode: "insensitive" } },
                  ],
                },
              },
            },
          ];
        }
      }

      const variantFilters: Record<string, unknown> = { isActive: true };
      if (size) {
        variantFilters.size = size;
      }
      if (color) {
        variantFilters.colorName = { contains: color, mode: "insensitive" };
      }
      if (inStock) {
        variantFilters.inventoryQuantity = { gt: 0 };
      }

      const priceFilter: Record<string, number> = {};
      if (minPrice !== undefined) priceFilter.gte = minPrice;
      if (maxPrice !== undefined) priceFilter.lte = maxPrice;

      if (Object.keys(variantFilters).length > 1 || Object.keys(priceFilter).length > 0) {
        where.variants = {
          some: {
            ...variantFilters,
            ...(Object.keys(priceFilter).length > 0 ? { price: priceFilter } : {}),
          },
        };
      }

      const orderBy: Record<string, "asc" | "desc"> = {};
      if (sort === "newest") {
        orderBy.createdAt = "desc";
      } else if (sort === "recommended") {
        orderBy.isFeatured = "desc";
      }

      const [dbProducts, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
            images: { orderBy: { sortOrder: "asc" } },
            variants: { where: { isActive: true } },
            collections: { include: { collection: true } },
          },
          orderBy: [
            Object.keys(orderBy).length > 0 ? orderBy : { createdAt: "desc" },
            { id: "asc" }, // Deterministic tie-breaker
          ],
          skip: (boundedPage - 1) * boundedLimit,
          take: boundedLimit,
        }),
        prisma.product.count({ where }),
      ]);

      if (dbProducts.length > 0) {
        const mappedProducts: Product[] = dbProducts.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          shortDescription: p.shortDescription || undefined,
          description: p.description,
          fabricDetails: p.fabricDetails || undefined,
          careInstructions: p.careInstructions || undefined,
          categoryId: p.categoryId,
          category: p.category
            ? {
                id: p.category.id,
                name: p.category.name,
                slug: p.category.slug,
                description: p.category.description,
                imageUrl: p.category.imageUrl,
                isActive: p.category.isActive,
                sortOrder: p.category.sortOrder,
              }
            : undefined,
          status: p.status as Product["status"],
          isFeatured: p.isFeatured,
          isNewArrival: p.isNewArrival,
          isActive: p.isActive,
          seoTitle: p.seoTitle || undefined,
          seoDescription: p.seoDescription || undefined,
          tags: p.tags,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          collections: p.collections.map((pc) => ({
            id: pc.collection.id,
            name: pc.collection.name,
            slug: pc.collection.slug,
            description: pc.collection.description,
            imageUrl: pc.collection.imageUrl,
            isActive: pc.collection.isActive,
            isFeatured: pc.collection.isFeatured,
            sortOrder: pc.collection.sortOrder,
          })),
          images: p.images.map((img) => ({
            id: img.id,
            productId: img.productId,
            url: img.url,
            altText: img.altText,
            mediaType: img.mediaType,
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
            variantId: img.variantId || undefined,
          })),
          variants: p.variants.map((v) => ({
            id: v.id,
            productId: v.productId,
            sku: v.sku,
            title: v.title,
            size: v.size as Product["variants"][0]["size"],
            colorName: v.colorName,
            colorHex: v.colorHex,
            price: Number(v.price),
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
            inventoryQuantity: v.inventoryQuantity,
            lowStockThreshold: v.lowStockThreshold,
            weightGrams: v.weightGrams,
            imageUrl: v.imageUrl || undefined,
            isActive: v.isActive,
          })),
        }));

        // Handle price sorting in memory if needed
        if (sort === "price_asc") {
          mappedProducts.sort(
            (a, b) => (a.variants[0]?.price || 0) - (b.variants[0]?.price || 0)
          );
        } else if (sort === "price_desc") {
          mappedProducts.sort(
            (a, b) => (b.variants[0]?.price || 0) - (a.variants[0]?.price || 0)
          );
        }

        return {
          products: mappedProducts,
          total,
          page: boundedPage,
          limit: boundedLimit,
          totalPages: Math.ceil(total / boundedLimit) || 1,
        };
      }
      return {
        products: [],
        total: 0,
        page: boundedPage,
        limit: boundedLimit,
        totalPages: 1,
      };
    } catch {
      logger.info("Using resilient in-memory catalog fallback", undefined, "ProductRepository");
    }

    // In-memory filter logic for resilient storefront
    let filtered = [...this.memoryProducts];

    // Status filter: Public queries must only see ACTIVE & isActive=true products
    if (!includeUnpublished) {
      filtered = filtered.filter((p) => p.status === "ACTIVE" && p.isActive);
    }

    if (category) {
      filtered = filtered.filter(
        (p) => p.category?.slug.toLowerCase() === category.toLowerCase()
      );
    }

    if (collection) {
      filtered = filtered.filter((p) =>
        p.collections?.some((c) => c.slug.toLowerCase() === collection.toLowerCase())
      );
    }

    if (search) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.shortDescription && p.shortDescription.toLowerCase().includes(q)) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.variants.some((v) => v.sku.toLowerCase().includes(q) || v.colorName.toLowerCase().includes(q))
      );
    }

    if (featured !== undefined) {
      filtered = filtered.filter((p) => p.isFeatured === featured);
    }

    if (newArrival !== undefined) {
      filtered = filtered.filter((p) => p.isNewArrival === newArrival);
    }

    if (size) {
      filtered = filtered.filter((p) =>
        p.variants.some((v) => v.size.toLowerCase() === size.toLowerCase())
      );
    }

    if (color) {
      filtered = filtered.filter((p) =>
        p.variants.some((v) => v.colorName.toLowerCase().includes(color.toLowerCase()))
      );
    }

    if (inStock) {
      filtered = filtered.filter((p) =>
        p.variants.some((v) => v.inventoryQuantity > 0)
      );
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filtered = filtered.filter((p) =>
        p.variants.some(
          (v) =>
            (minPrice === undefined || v.price >= minPrice) &&
            (maxPrice === undefined || v.price <= maxPrice)
        )
      );
    }

    // Deterministic sorting
    if (sort === "price_asc") {
      filtered.sort((a, b) => {
        const diff = (a.variants[0]?.price || 0) - (b.variants[0]?.price || 0);
        return diff !== 0 ? diff : a.id.localeCompare(b.id);
      });
    } else if (sort === "price_desc") {
      filtered.sort((a, b) => {
        const diff = (b.variants[0]?.price || 0) - (a.variants[0]?.price || 0);
        return diff !== 0 ? diff : a.id.localeCompare(b.id);
      });
    } else if (sort === "newest") {
      filtered.sort((a, b) => {
        const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return diff !== 0 ? diff : a.id.localeCompare(b.id);
      });
    } else {
      // Recommended: featured first, then newest, then ID
      filtered.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return diff !== 0 ? diff : a.id.localeCompare(b.id);
      });
    }

    const total = filtered.length;
    const paginated = filtered.slice((boundedPage - 1) * boundedLimit, boundedPage * boundedLimit);

    return {
      products: paginated,
      total,
      page: boundedPage,
      limit: boundedLimit,
      totalPages: Math.ceil(total / boundedLimit) || 1,
    };
  }

  // =========================================================================
  // Product Detail Lookup
  // =========================================================================

  async findBySlug(slug: string, includeUnpublished = false): Promise<Product | null> {
    try {
      const dbProduct = await prisma.product.findUnique({
        where: { slug },
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" } },
          variants: { where: { isActive: true } },
          collections: { include: { collection: true } },
        },
      });

      if (dbProduct) {
        if (!includeUnpublished && (dbProduct.status !== ProductStatus.ACTIVE || !dbProduct.isActive)) {
          return null; // Don't leak drafts or archived items
        }

        return {
          id: dbProduct.id,
          title: dbProduct.title,
          slug: dbProduct.slug,
          shortDescription: dbProduct.shortDescription || undefined,
          description: dbProduct.description,
          fabricDetails: dbProduct.fabricDetails || undefined,
          careInstructions: dbProduct.careInstructions || undefined,
          categoryId: dbProduct.categoryId,
          category: dbProduct.category
            ? {
                id: dbProduct.category.id,
                name: dbProduct.category.name,
                slug: dbProduct.category.slug,
                description: dbProduct.category.description,
                imageUrl: dbProduct.category.imageUrl,
                isActive: dbProduct.category.isActive,
                sortOrder: dbProduct.category.sortOrder,
              }
            : undefined,
          status: dbProduct.status as Product["status"],
          isFeatured: dbProduct.isFeatured,
          isNewArrival: dbProduct.isNewArrival,
          isActive: dbProduct.isActive,
          seoTitle: dbProduct.seoTitle || undefined,
          seoDescription: dbProduct.seoDescription || undefined,
          tags: dbProduct.tags,
          createdAt: dbProduct.createdAt,
          updatedAt: dbProduct.updatedAt,
          collections: dbProduct.collections.map((pc) => ({
            id: pc.collection.id,
            name: pc.collection.name,
            slug: pc.collection.slug,
            description: pc.collection.description,
            imageUrl: pc.collection.imageUrl,
            isActive: pc.collection.isActive,
            isFeatured: pc.collection.isFeatured,
            sortOrder: pc.collection.sortOrder,
          })),
          images: dbProduct.images.map((img) => ({
            id: img.id,
            productId: img.productId,
            url: img.url,
            altText: img.altText,
            mediaType: img.mediaType,
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
            variantId: img.variantId || undefined,
          })),
          variants: dbProduct.variants.map((v) => ({
            id: v.id,
            productId: v.productId,
            sku: v.sku,
            title: v.title,
            size: v.size as Product["variants"][0]["size"],
            colorName: v.colorName,
            colorHex: v.colorHex,
            price: Number(v.price),
            compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
            inventoryQuantity: v.inventoryQuantity,
            lowStockThreshold: v.lowStockThreshold,
            weightGrams: v.weightGrams,
            imageUrl: v.imageUrl || undefined,
            isActive: v.isActive,
          })),
        };
      }
    } catch {
      logger.info("Using fallback product lookup for slug", { slug }, "ProductRepository");
    }

    const memoryItem = this.memoryProducts.find((p) => p.slug === slug);
    if (!memoryItem) return null;

    if (!includeUnpublished && (memoryItem.status !== "ACTIVE" || !memoryItem.isActive)) {
      return null;
    }

    return memoryItem;
  }

  async findById(id: string): Promise<Product | null> {
    try {
      const dbProduct = await prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          images: true,
          variants: true,
          collections: { include: { collection: true } },
        },
      });
      if (dbProduct) {
        return this.findBySlug(dbProduct.slug, true);
      }
    } catch {
      // Fallback
    }

    const memoryItem = this.memoryProducts.find((p) => p.id === id);
    if (memoryItem) return memoryItem;

    return null;
  }

  async findVariantById(variantId: string): Promise<{ variant: ProductVariant; product: Product } | null> {
    try {
      const dbVariant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true },
      });

      if (dbVariant) {
        const product = await this.findBySlug(dbVariant.product.slug, true);
        if (product) {
          const v = product.variants.find((vr) => vr.id === variantId || vr.sku === dbVariant.sku);
          if (v) return { variant: v, product };
        }
      }
    } catch {
      // Fallback
    }

    for (const p of this.memoryProducts) {
      const v = p.variants.find((vr) => vr.id === variantId);
      if (v) {
        return { variant: v, product: p };
      }
    }

    return null;
  }

  async findRelated(productId: string, categoryId: string, limit: number = 3): Promise<Product[]> {
    const all = await this.findProducts({ limit: 12 });
    return all.products
      .filter((p) => p.id !== productId && p.categoryId === categoryId)
      .slice(0, limit);
  }

  // =========================================================================
  // Stock Modification (Used by InventoryService)
  // =========================================================================

  updateMemoryVariantStock(variantId: string, newQuantity: number): boolean {
    for (const p of this.memoryProducts) {
      const v = p.variants.find((vr) => vr.id === variantId);
      if (v) {
        v.inventoryQuantity = newQuantity;
        return true;
      }
    }
    return false;
  }

  addMemoryProduct(product: Product): void {
    const idx = this.memoryProducts.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      this.memoryProducts[idx] = product;
    } else {
      this.memoryProducts.unshift(product);
    }
  }

  getMemoryProducts(): Product[] {
    return this.memoryProducts;
  }

  updateMemoryProduct(product: Product): void {
    const idx = this.memoryProducts.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      this.memoryProducts[idx] = product;
    } else {
      this.memoryProducts.push(product);
    }
  }

  removeMemoryProduct(productId: string): boolean {
    const initialLen = this.memoryProducts.length;
    this.memoryProducts = this.memoryProducts.filter((p) => p.id !== productId);
    return this.memoryProducts.length < initialLen;
  }

  // =========================================================================
  // Category & Collection Memory Helpers (For Admin Operations)
  // =========================================================================

  getAllMemoryCategories(): Category[] {
    return [...this.memoryCategories];
  }

  addMemoryCategory(category: Category): void {
    const idx = this.memoryCategories.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      this.memoryCategories[idx] = category;
    } else {
      this.memoryCategories.push(category);
    }
  }

  updateMemoryCategory(category: Category): void {
    const idx = this.memoryCategories.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      this.memoryCategories[idx] = category;
    }
  }

  removeMemoryCategory(id: string): boolean {
    const initLen = this.memoryCategories.length;
    this.memoryCategories = this.memoryCategories.filter((c) => c.id !== id);
    return this.memoryCategories.length < initLen;
  }

  getAllMemoryCollections(): Collection[] {
    return [...this.memoryCollections];
  }

  addMemoryCollection(collection: Collection): void {
    const idx = this.memoryCollections.findIndex((c) => c.id === collection.id);
    if (idx >= 0) {
      this.memoryCollections[idx] = collection;
    } else {
      this.memoryCollections.push(collection);
    }
  }

  updateMemoryCollection(collection: Collection): void {
    const idx = this.memoryCollections.findIndex((c) => c.id === collection.id);
    if (idx >= 0) {
      this.memoryCollections[idx] = collection;
    }
  }

  removeMemoryCollection(id: string): boolean {
    const initLen = this.memoryCollections.length;
    this.memoryCollections = this.memoryCollections.filter((c) => c.id !== id);
    return this.memoryCollections.length < initLen;
  }
}

export const productRepository = new ProductRepository();
export default productRepository;
