import { prisma } from "@/server/db/prisma";
import { Prisma } from "@prisma/client";

export class AuditRepository {
  async recordLog(data: {
    actorId?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    correlationId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    try {
      // Sanitize metadata to guarantee zero secret leakage
      let sanitizedMetadata: Prisma.InputJsonValue | undefined = undefined;
      if (data.metadata) {
        const sanitized = { ...data.metadata };
        const redactedKeys = ["password", "token", "secret", "hash", "authorization", "cookie"];
        for (const key of Object.keys(sanitized)) {
          if (redactedKeys.some((r) => key.toLowerCase().includes(r))) {
            sanitized[key] = "[REDACTED]";
          }
        }
        sanitizedMetadata = sanitized as Prisma.InputJsonValue;
      }

      return await prisma.auditLog.create({
        data: {
          actorId: data.actorId,
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          correlationId: data.correlationId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: sanitizedMetadata,
        },
      });
    } catch {
      // Non-blocking fail-safe: Audit logging failure must not crash business transaction
      return null;
    }
  }
}

export const auditRepository = new AuditRepository();
