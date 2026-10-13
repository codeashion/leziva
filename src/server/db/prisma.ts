import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { logger } from "@/utils/logger";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://leziva_user:leziva_pass@localhost:5432/leziva_db?schema=public";

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export interface DatabaseHealthResult {
  status: "connected" | "disconnected";
  latencyMs?: number;
  error?: string;
}

/**
 * Health check probe testing PostgreSQL connectivity and query execution.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  const start = Date.now();
  try {
    await Promise.race([
      prisma.$queryRawUnsafe("SELECT 1"),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Database query timed out after 3000ms")), 3000)
      ),
    ]);

    return {
      status: "connected",
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`Database health check failed: ${message}`, undefined, "DatabaseHealth");
    return {
      status: "disconnected",
      error: message,
    };
  }
}

/**
 * Graceful disconnect on shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info("Database disconnected successfully", undefined, "Prisma");
  } catch (err) {
    logger.error("Error during database disconnection", err, "Prisma");
  }
}

export default prisma;
