/**
 * LEZIVA — Role-Based Access Control (RBAC) & Granular Permissions System
 * 
 * Enforces server-side authorization for all administrative endpoints and mutations.
 */

import { RoleType } from "@prisma/client";

export const Permissions = {
  // Overview Dashboard
  DASHBOARD_READ: "dashboard:read",

  // Product Catalog
  PRODUCTS_READ: "products:read",
  PRODUCTS_WRITE: "products:write",
  PRODUCTS_ARCHIVE: "products:archive",
  PRODUCTS_DELETE: "products:delete",

  // Inventory & Variants
  INVENTORY_READ: "inventory:read",
  INVENTORY_ADJUST: "inventory:adjust",

  // Categories & Collections
  CATEGORIES_READ: "categories:read",
  CATEGORIES_WRITE: "categories:write",

  // Orders
  ORDERS_READ: "orders:read",
  ORDERS_UPDATE: "orders:update",
  ORDERS_CANCEL: "orders:cancel",

  // Payments & Refunds
  REFUNDS_PROCESS: "refunds:process",

  // Velocity Shipping Logistics
  SHIPPING_READ: "shipping:read",
  SHIPPING_DISPATCH: "shipping:dispatch",
  SHIPPING_CANCEL: "shipping:cancel",
  SHIPPING_RECONCILE: "shipping:reconcile",

  // Customers & Privacy
  CUSTOMERS_READ: "customers:read",
  CUSTOMERS_UPDATE: "customers:update",
  CUSTOMERS_GDPR_DELETE: "customers:gdpr_delete",

  // Coupons & Promotions
  COUPONS_READ: "coupons:read",
  COUPONS_WRITE: "coupons:write",

  // CMS & Banners
  CMS_READ: "cms:read",
  CMS_WRITE: "cms:write",
  CMS_PUBLISH: "cms:publish",

  // Reviews Moderation
  REVIEWS_MODERATE: "reviews:moderate",

  // Customer Support Ticketing
  SUPPORT_READ: "support:read",
  SUPPORT_RESPOND: "support:respond",
  SUPPORT_ASSIGN: "support:assign",

  // Event Notifications & Templates
  NOTIFICATIONS_READ: "notifications:read",
  NOTIFICATIONS_MANAGE: "notifications:manage",

  // Business Reports & CSV Exports
  REPORTS_READ: "reports:read",
  REPORTS_EXPORT: "reports:export",

  // Audit Logs & Security Settings
  AUDIT_READ: "audit:read",
  SETTINGS_SECURITY: "settings:security",
} as const;

export type PermissionKey = (typeof Permissions)[keyof typeof Permissions];

/**
 * Granular mapping from RoleType to granted permissions.
 */
export const ROLE_PERMISSIONS: Record<RoleType, PermissionKey[] | string[]> = {
  [RoleType.SUPER_ADMIN]: ["*"],

  [RoleType.OPERATIONS_MANAGER]: [
    Permissions.DASHBOARD_READ,
    Permissions.ORDERS_READ,
    Permissions.ORDERS_UPDATE,
    Permissions.ORDERS_CANCEL,
    Permissions.REFUNDS_PROCESS,
    Permissions.SHIPPING_READ,
    Permissions.SHIPPING_DISPATCH,
    Permissions.SHIPPING_CANCEL,
    Permissions.SHIPPING_RECONCILE,
    Permissions.INVENTORY_READ,
    Permissions.INVENTORY_ADJUST,
    Permissions.CUSTOMERS_READ,
    Permissions.SUPPORT_READ,
    Permissions.SUPPORT_RESPOND,
    Permissions.REPORTS_READ,
    Permissions.REPORTS_EXPORT,
    Permissions.AUDIT_READ,
  ],

  [RoleType.PRODUCT_MANAGER]: [
    Permissions.DASHBOARD_READ,
    Permissions.PRODUCTS_READ,
    Permissions.PRODUCTS_WRITE,
    Permissions.PRODUCTS_ARCHIVE,
    Permissions.INVENTORY_READ,
    Permissions.INVENTORY_ADJUST,
    Permissions.CATEGORIES_READ,
    Permissions.CATEGORIES_WRITE,
    Permissions.REVIEWS_MODERATE,
    Permissions.REPORTS_READ,
  ],

  [RoleType.CATALOG_MANAGER]: [
    Permissions.DASHBOARD_READ,
    Permissions.PRODUCTS_READ,
    Permissions.PRODUCTS_WRITE,
    Permissions.PRODUCTS_ARCHIVE,
    Permissions.INVENTORY_READ,
    Permissions.INVENTORY_ADJUST,
    Permissions.CATEGORIES_READ,
    Permissions.CATEGORIES_WRITE,
    Permissions.REVIEWS_MODERATE,
  ],

  [RoleType.ORDER_SHIPPING_MANAGER]: [
    Permissions.DASHBOARD_READ,
    Permissions.ORDERS_READ,
    Permissions.ORDERS_UPDATE,
    Permissions.ORDERS_CANCEL,
    Permissions.SHIPPING_READ,
    Permissions.SHIPPING_DISPATCH,
    Permissions.SHIPPING_CANCEL,
    Permissions.SHIPPING_RECONCILE,
    Permissions.INVENTORY_READ,
    Permissions.CUSTOMERS_READ,
    Permissions.REPORTS_READ,
  ],

  [RoleType.ORDER_MANAGER]: [
    Permissions.DASHBOARD_READ,
    Permissions.ORDERS_READ,
    Permissions.ORDERS_UPDATE,
    Permissions.ORDERS_CANCEL,
    Permissions.SHIPPING_READ,
    Permissions.SHIPPING_DISPATCH,
    Permissions.SHIPPING_CANCEL,
    Permissions.SHIPPING_RECONCILE,
    Permissions.INVENTORY_READ,
    Permissions.CUSTOMERS_READ,
  ],

  [RoleType.CUSTOMER_SUPPORT]: [
    Permissions.ORDERS_READ,
    Permissions.SHIPPING_READ,
    Permissions.CUSTOMERS_READ,
    Permissions.SUPPORT_READ,
    Permissions.SUPPORT_RESPOND,
    Permissions.REVIEWS_MODERATE,
  ],

  [RoleType.SUPPORT_AGENT]: [
    Permissions.ORDERS_READ,
    Permissions.SHIPPING_READ,
    Permissions.CUSTOMERS_READ,
    Permissions.SUPPORT_READ,
    Permissions.SUPPORT_RESPOND,
    Permissions.REVIEWS_MODERATE,
  ],

  [RoleType.MARKETING_MANAGER]: [
    Permissions.DASHBOARD_READ,
    Permissions.COUPONS_READ,
    Permissions.COUPONS_WRITE,
    Permissions.CMS_READ,
    Permissions.CMS_WRITE,
    Permissions.CMS_PUBLISH,
    Permissions.REVIEWS_MODERATE,
    Permissions.REPORTS_READ,
  ],

  [RoleType.ANALYST]: [
    Permissions.DASHBOARD_READ,
    Permissions.REPORTS_READ,
    Permissions.REPORTS_EXPORT,
    Permissions.ORDERS_READ,
    Permissions.PRODUCTS_READ,
    Permissions.INVENTORY_READ,
    Permissions.CUSTOMERS_READ,
  ],

  [RoleType.CUSTOMER]: [
    "orders:read_self",
    "customer:self",
  ],
};

export class RbacService {
  /**
   * Retrieves all permissions associated with a role.
   */
  getPermissionsForRole(role: RoleType): string[] {
    return (ROLE_PERMISSIONS[role] || []) as string[];
  }

  /**
   * Checks if an array of assigned roles contains a required permission.
   */
  hasPermission(userRoles: RoleType[], permission: string): boolean {
    if (!userRoles || userRoles.length === 0) return false;

    // Super Admin holds universal wildcard permission
    if (userRoles.includes(RoleType.SUPER_ADMIN)) {
      return true;
    }

    return userRoles.some((role) => {
      const perms = this.getPermissionsForRole(role);
      if (perms.includes("*")) return true;
      return perms.includes(permission);
    });
  }

  /**
   * Checks if an array of assigned roles contains any of the specified permissions.
   */
  hasAnyPermission(userRoles: RoleType[], permissions: string[]): boolean {
    if (!userRoles || userRoles.length === 0) return false;
    if (userRoles.includes(RoleType.SUPER_ADMIN)) return true;

    return permissions.some((perm) => this.hasPermission(userRoles, perm));
  }

  /**
   * Checks if an array of assigned roles contains all of the specified permissions.
   */
  hasAllPermissions(userRoles: RoleType[], permissions: string[]): boolean {
    if (!userRoles || userRoles.length === 0) return false;
    if (userRoles.includes(RoleType.SUPER_ADMIN)) return true;

    return permissions.every((perm) => this.hasPermission(userRoles, perm));
  }

  /**
   * Returns a deduplicated list of all effective permissions for a set of roles.
   */
  getEffectivePermissions(userRoles: RoleType[]): string[] {
    if (userRoles.includes(RoleType.SUPER_ADMIN)) {
      return ["*"];
    }

    const set = new Set<string>();
    for (const role of userRoles) {
      const perms = this.getPermissionsForRole(role);
      for (const p of perms) {
        set.add(p);
      }
    }
    return Array.from(set);
  }
}

export const rbacService = new RbacService();
