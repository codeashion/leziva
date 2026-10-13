/**
 * LEZIVA — Administrative Category, Collection & Attribute Management Service
 * 
 * Manages haute-couture catalog taxonomy:
 * - Categories & Subcategories with hierarchy validation (preventing circular ancestry)
 * - Safe deletion/archival checks (preventing orphan active products)
 * - Brand Collections with sort order and featured toggles
 * - Standardized luxury fashion attributes (Sizes, Color swatches, Fabric types)
 */

import { prisma } from "@/server/db/prisma";
import { productRepository } from "@/server/repositories/product.repository";
import { auditRepository } from "@/server/repositories/audit.repository";
import { Category, Collection } from "@/shared/types";
import { BadRequestError, NotFoundError } from "@/utils/errors";

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export interface CreateCollectionInput {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  isFeatured?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateCollectionInput = Partial<CreateCollectionInput>;

export interface CategoryWithProductCount extends Category {
  productCount: number;
  children?: CategoryWithProductCount[];
}

export interface CollectionWithProductCount extends Collection {
  productCount: number;
}

export class AdminCategoryService {
  /**
   * Generates a clean URL slug from name.
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // =========================================================================
  // Categories Management
  // =========================================================================

  async listCategories(): Promise<CategoryWithProductCount[]> {
    let categories: Category[] = [];
    try {
      const dbCategories = await prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { products: true } },
        },
      });

      if (dbCategories.length > 0) {
        return dbCategories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || undefined,
          imageUrl: c.imageUrl || undefined,
          parentId: c.parentId || undefined,
          isActive: c.isActive,
          sortOrder: c.sortOrder,
          productCount: c._count.products,
        }));
      }
    } catch {
      // Memory fallback
    }

    // Fallback to memory
    categories = productRepository.getAllMemoryCategories();
    const allProducts = await productRepository.findProducts({ limit: 1000, includeUnpublished: true });

    return categories.map((cat) => {
      const count = allProducts.products.filter((p) => p.categoryId === cat.id).length;
      return {
        ...cat,
        productCount: count,
      };
    });
  }

  async getCategoryById(id: string): Promise<CategoryWithProductCount> {
    const list = await this.listCategories();
    const item = list.find((c) => c.id === id);
    if (!item) {
      throw new NotFoundError(`Category not found: ${id}`);
    }
    return item;
  }

  async createCategory(input: CreateCategoryInput, actorId?: string): Promise<Category> {
    const name = input.name.trim();
    if (!name) throw new BadRequestError("Category name is required.");

    const slug = (input.slug?.trim() || this.generateSlug(name)).toLowerCase();

    // Check slug uniqueness
    const existing = await this.listCategories();
    if (existing.some((c) => c.slug === slug)) {
      throw new BadRequestError(`Category with slug '${slug}' already exists.`);
    }

    // Validate parent if provided
    if (input.parentId) {
      const parent = existing.find((c) => c.id === input.parentId);
      if (!parent) {
        throw new BadRequestError(`Parent category '${input.parentId}' does not exist.`);
      }
    }

    const categoryId = `cat_${slug.replace(/-/g, "_")}_${Math.random().toString(36).substring(2, 6)}`;
    const newCategory: Category = {
      id: categoryId,
      name,
      slug,
      description: input.description?.trim(),
      imageUrl: input.imageUrl?.trim(),
      parentId: input.parentId || undefined,
      sortOrder: input.sortOrder ?? existing.length,
      isActive: input.isActive ?? true,
    };

    try {
      await prisma.category.create({
        data: {
          id: newCategory.id,
          name: newCategory.name,
          slug: newCategory.slug,
          description: newCategory.description || null,
          imageUrl: newCategory.imageUrl || null,
          parentId: newCategory.parentId || null,
          sortOrder: newCategory.sortOrder,
          isActive: newCategory.isActive,
        },
      });
    } catch {
      // Memory fallback handled below
    }

    productRepository.addMemoryCategory(newCategory);

    await auditRepository.recordLog({
      actorId: actorId || null,
      action: "CATEGORY_CREATED",
      resourceType: "CATEGORY",
      resourceId: newCategory.id,
      metadata: { name: newCategory.name, slug: newCategory.slug },
    });

    return newCategory;
  }

  async updateCategory(id: string, input: UpdateCategoryInput, actorId?: string): Promise<Category> {
    const current = await this.getCategoryById(id);
    const existing = await this.listCategories();

    // Prevent circular hierarchy
    if (input.parentId !== undefined) {
      if (input.parentId === id) {
        throw new BadRequestError("A category cannot be its own parent.");
      }
      if (input.parentId) {
        // Prevent setting a child as its parent
        const isDescendant = (parentId: string, targetChildId: string): boolean => {
          const directChildren = existing.filter((c) => c.parentId === parentId);
          if (directChildren.some((c) => c.id === targetChildId)) return true;
          return directChildren.some((c) => isDescendant(c.id, targetChildId));
        };

        if (isDescendant(id, input.parentId)) {
          throw new BadRequestError("Circular hierarchy detected: Cannot set a descendant as the parent category.");
        }
      }
    }

    const updatedSlug = input.slug ? input.slug.trim().toLowerCase() : current.slug;
    if (updatedSlug !== current.slug && existing.some((c) => c.id !== id && c.slug === updatedSlug)) {
      throw new BadRequestError(`Category slug '${updatedSlug}' is already taken.`);
    }

    const updated: Category = {
      ...current,
      name: input.name?.trim() || current.name,
      slug: updatedSlug,
      description: input.description !== undefined ? input.description?.trim() : current.description,
      imageUrl: input.imageUrl !== undefined ? input.imageUrl?.trim() : current.imageUrl,
      parentId: input.parentId !== undefined ? (input.parentId || undefined) : current.parentId,
      sortOrder: input.sortOrder !== undefined ? input.sortOrder : current.sortOrder,
      isActive: input.isActive !== undefined ? input.isActive : current.isActive,
    };

    try {
      await prisma.category.update({
        where: { id },
        data: {
          name: updated.name,
          slug: updated.slug,
          description: updated.description || null,
          imageUrl: updated.imageUrl || null,
          parentId: updated.parentId || null,
          sortOrder: updated.sortOrder,
          isActive: updated.isActive,
        },
      });
    } catch {
      // Memory fallback
    }

    productRepository.updateMemoryCategory(updated);

    await auditRepository.recordLog({
      actorId: actorId || null,
      action: "CATEGORY_UPDATED",
      resourceType: "CATEGORY",
      resourceId: id,
      metadata: { name: updated.name, slug: updated.slug },
    });

    return updated;
  }

  async deleteCategory(id: string, actorId?: string): Promise<{ success: boolean; message: string }> {
    const category = await this.getCategoryById(id);

    // Safeguard: Check if active products reference this category
    const allProducts = await productRepository.findProducts({ limit: 1000, includeUnpublished: true });
    const referencingProducts = allProducts.products.filter((p) => p.categoryId === id);

    if (referencingProducts.length > 0) {
      throw new BadRequestError(
        `Cannot delete category '${category.name}' because ${referencingProducts.length} active products reference it. Reassign these products before deletion.`
      );
    }

    // Check if subcategories exist
    const categories = await this.listCategories();
    const children = categories.filter((c) => c.parentId === id);
    if (children.length > 0) {
      throw new BadRequestError(
        `Cannot delete category '${category.name}' because it has ${children.length} subcategories. Reassign or delete subcategories first.`
      );
    }

    try {
      await prisma.category.delete({ where: { id } });
    } catch {
      // Memory fallback
    }

    productRepository.removeMemoryCategory(id);

    await auditRepository.recordLog({
      actorId: actorId || null,
      action: "CATEGORY_DELETED",
      resourceType: "CATEGORY",
      resourceId: id,
      metadata: { name: category.name, slug: category.slug },
    });

    return { success: true, message: `Category '${category.name}' deleted successfully.` };
  }

  // =========================================================================
  // Collections Management
  // =========================================================================

  async listCollections(): Promise<CollectionWithProductCount[]> {
    try {
      const dbCollections = await prisma.collection.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { products: true } },
        },
      });

      if (dbCollections.length > 0) {
        return dbCollections.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || undefined,
          imageUrl: c.imageUrl || undefined,
          isActive: c.isActive,
          isFeatured: c.isFeatured,
          sortOrder: c.sortOrder,
          productCount: c._count.products,
        }));
      }
    } catch {
      // Memory fallback
    }

    const collections = productRepository.getAllMemoryCollections();
    const allProducts = await productRepository.findProducts({ limit: 1000, includeUnpublished: true });

    return collections.map((col) => {
      const count = allProducts.products.filter((p) =>
        p.collections?.some((c) => c.id === col.id || c.slug === col.slug)
      ).length;
      return {
        ...col,
        productCount: count,
      };
    });
  }

  async createCollection(input: CreateCollectionInput, actorId?: string): Promise<Collection> {
    const name = input.name.trim();
    if (!name) throw new BadRequestError("Collection name is required.");

    const slug = (input.slug?.trim() || this.generateSlug(name)).toLowerCase();

    const existing = await this.listCollections();
    if (existing.some((c) => c.slug === slug)) {
      throw new BadRequestError(`Collection with slug '${slug}' already exists.`);
    }

    const collectionId = `col_${slug.replace(/-/g, "_")}_${Math.random().toString(36).substring(2, 6)}`;
    const newCollection: Collection = {
      id: collectionId,
      name,
      slug,
      description: input.description?.trim(),
      imageUrl: input.imageUrl?.trim(),
      isActive: input.isActive ?? true,
      isFeatured: input.isFeatured ?? false,
      sortOrder: input.sortOrder ?? existing.length,
    };

    try {
      await prisma.collection.create({
        data: {
          id: newCollection.id,
          name: newCollection.name,
          slug: newCollection.slug,
          description: newCollection.description || null,
          imageUrl: newCollection.imageUrl || null,
          isActive: newCollection.isActive,
          isFeatured: newCollection.isFeatured,
          sortOrder: newCollection.sortOrder,
        },
      });
    } catch {
      // Memory fallback
    }

    productRepository.addMemoryCollection(newCollection);

    await auditRepository.recordLog({
      actorId: actorId || null,
      action: "COLLECTION_CREATED",
      resourceType: "COLLECTION",
      resourceId: newCollection.id,
      metadata: { name: newCollection.name, slug: newCollection.slug },
    });

    return newCollection;
  }

  async updateCollection(id: string, input: UpdateCollectionInput, actorId?: string): Promise<Collection> {
    const list = await this.listCollections();
    const current = list.find((c) => c.id === id);
    if (!current) throw new NotFoundError(`Collection not found: ${id}`);

    const updatedSlug = input.slug ? input.slug.trim().toLowerCase() : current.slug;
    if (updatedSlug !== current.slug && list.some((c) => c.id !== id && c.slug === updatedSlug)) {
      throw new BadRequestError(`Collection slug '${updatedSlug}' is already taken.`);
    }

    const updated: Collection = {
      ...current,
      name: input.name?.trim() || current.name,
      slug: updatedSlug,
      description: input.description !== undefined ? input.description?.trim() : current.description,
      imageUrl: input.imageUrl !== undefined ? input.imageUrl?.trim() : current.imageUrl,
      isActive: input.isActive !== undefined ? input.isActive : current.isActive,
      isFeatured: input.isFeatured !== undefined ? input.isFeatured : current.isFeatured,
      sortOrder: input.sortOrder !== undefined ? input.sortOrder : current.sortOrder,
    };

    try {
      await prisma.collection.update({
        where: { id },
        data: {
          name: updated.name,
          slug: updated.slug,
          description: updated.description || null,
          imageUrl: updated.imageUrl || null,
          isActive: updated.isActive,
          isFeatured: updated.isFeatured,
          sortOrder: updated.sortOrder,
        },
      });
    } catch {
      // Memory fallback
    }

    productRepository.updateMemoryCollection(updated);

    await auditRepository.recordLog({
      actorId: actorId || null,
      action: "COLLECTION_UPDATED",
      resourceType: "COLLECTION",
      resourceId: id,
      metadata: { name: updated.name, slug: updated.slug },
    });

    return updated;
  }

  async deleteCollection(id: string, actorId?: string): Promise<{ success: boolean; message: string }> {
    const list = await this.listCollections();
    const current = list.find((c) => c.id === id);
    if (!current) throw new NotFoundError(`Collection not found: ${id}`);

    try {
      await prisma.collection.delete({ where: { id } });
    } catch {
      // Memory fallback
    }

    productRepository.removeMemoryCollection(id);

    await auditRepository.recordLog({
      actorId: actorId || null,
      action: "COLLECTION_DELETED",
      resourceType: "COLLECTION",
      resourceId: id,
      metadata: { name: current.name, slug: current.slug },
    });

    return { success: true, message: `Collection '${current.name}' deleted successfully.` };
  }

  // =========================================================================
  // Standardized Luxury Attributes Matrix
  // =========================================================================

  getAttributeMatrix() {
    return {
      sizes: [
        { code: "XS", label: "Extra Small (Bust 32\")" },
        { code: "S", label: "Small (Bust 34\")" },
        { code: "M", label: "Medium (Bust 36\")" },
        { code: "L", label: "Large (Bust 38\")" },
        { code: "XL", label: "Extra Large (Bust 40\")" },
        { code: "XXL", label: "Double Extra Large (Bust 42\")" },
        { code: "FREE_SIZE", label: "Free Size (Unstitched / Universal)" },
        { code: "CUSTOM", label: "Bespoke Couture Custom Sizing" },
      ],
      colors: [
        { name: "Crimson Red", hex: "#990000" },
        { name: "Emerald Green", hex: "#004D40" },
        { name: "Royal Navy", hex: "#0B192C" },
        { name: "Ivory Gold", hex: "#D4AF37" },
        { name: "Sunset Coral", hex: "#EF8557" },
        { name: "Midnight Black", hex: "#111111" },
        { name: "Blush Rose", hex: "#E8B4B8" },
        { name: "Peacock Teal", hex: "#005F73" },
      ],
      fabrics: [
        "Pure Kanjeevaram Silk",
        "Banarasi Brocade",
        "Tissue Organza",
        "Micro Velvet",
        "Georgette Chiffon",
        "Raw Matka Silk",
        "Chanderi Cotton-Silk",
      ],
    };
  }
}

export const adminCategoryService = new AdminCategoryService();
export default adminCategoryService;
