/**
 * LEZIVA Database Seed Script
 * Pre-populates system roles and essential categories.
 * NOTICE: Never embeds administrator passwords or real credentials.
 */

import { RoleType } from "@prisma/client";
import { prisma } from "../src/server/db/prisma";

async function main() {
  console.log("🌱 Starting LEZIVA database seed...");

  // 1. Seed System Roles (without user accounts)
  const roles = [
    {
      name: RoleType.SUPER_ADMIN,
      description: "Full system administrative access and financial governance",
      permissions: ["*"],
    },
    {
      name: RoleType.CATALOG_MANAGER,
      description: "Manage products, variants, collections, categories, and inventory",
      permissions: ["catalog:read", "catalog:write", "inventory:write"],
    },
    {
      name: RoleType.ORDER_MANAGER,
      description: "Manage customer orders, packing workflows, and shipment manifests",
      permissions: ["orders:read", "orders:write", "shipments:write"],
    },
    {
      name: RoleType.SUPPORT_AGENT,
      description: "Customer service inquiry access, tracking links, and return authorizations",
      permissions: ["orders:read", "support:write", "returns:write"],
    },
    {
      name: RoleType.CUSTOMER,
      description: "Standard registered shopping customer account",
      permissions: ["customer:read", "customer:write"],
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        permissions: role.permissions,
      },
      create: role,
    });
    console.log(`✓ Seeded role: ${role.name}`);
  }

  // 2. Seed Initial Atelier Categories
  const categories = [
    {
      name: "Sarees",
      slug: "sarees",
      description: "Handcrafted Banarasi, Kanjivaram, Chanderi, and Organza pure silk sarees.",
      sortOrder: 1,
    },
    {
      name: "Lehengas",
      slug: "lehengas",
      description: "Bespoke bridal, sangeet, and festive designer lehengas with intricate zardozi embroidery.",
      sortOrder: 2,
    },
    {
      name: "Dresses",
      slug: "dresses",
      description: "Contemporary fusion dresses, evening gowns, and artisanal resort silhouettes.",
      sortOrder: 3,
    },
    {
      name: "Kurtis & Sets",
      slug: "kurtis",
      description: "Everyday luxury kurtas, co-ord sets, and hand-embroidered anarkalis.",
      sortOrder: 4,
    },
    {
      name: "Bridal Couture",
      slug: "bridal-couture",
      description: "Exclusive heirloom bridal masterpieces crafted by master artisans.",
      sortOrder: 5,
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    console.log(`✓ Seeded category: ${cat.name}`);
  }

  console.log("✨ Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
