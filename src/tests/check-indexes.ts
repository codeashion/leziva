import { prisma } from "@/server/db/prisma";

async function checkIndexes() {
  const indexes: any = await prisma.$queryRawUnsafe(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `);

  console.log("Found", indexes.length, "indexes across tables.");
  for (const idx of indexes) {
    if (["Product", "ProductVariant", "Cart", "CartItem", "Coupon", "Session", "User"].includes(idx.tablename)) {
      console.log(`[${idx.tablename}] ${idx.indexname}`);
    }
  }
  process.exit(0);
}

checkIndexes().catch(console.error);
