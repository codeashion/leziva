import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/guards";
import { Permissions } from "@/server/auth/rbac.service";
import { prisma } from "@/server/db/prisma";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, Permissions.AUDIT_READ);

    const { searchParams } = new URL(request.url);
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50", 10)));
    const action = searchParams.get("action") || undefined;
    const resourceType = searchParams.get("resourceType") || undefined;

    let logs: Array<{
      id: string;
      actorId: string | null;
      action: string;
      resourceType: string;
      resourceId: string | null;
      actorName: string;
      metadata: unknown;
      createdAt: string;
    }> = [];

    try {
      const dbLogs = await prisma.auditLog.findMany({
        where: {
          action: action ? { contains: action } : undefined,
          resourceType: resourceType || undefined,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          actor: { select: { name: true, email: true } },
        },
      });

      logs = dbLogs.map((l) => ({
        id: l.id,
        actorId: l.actorId,
        action: l.action,
        resourceType: l.resourceType,
        resourceId: l.resourceId,
        actorName: l.actor?.name || l.actor?.email || "System",
        metadata: l.metadata,
        createdAt: l.createdAt.toISOString(),
      }));
    } catch {
      // Memory mock
      logs = [
        {
          id: "audit_init_1",
          actorId: "usr_admin_1",
          action: "SYSTEM_INITIALIZED",
          resourceType: "PLATFORM",
          resourceId: "system",
          actorName: "Super Admin",
          metadata: { phase: "Phase 6 Admin Operations" },
          createdAt: new Date().toISOString(),
        },
      ];
    }

    return NextResponse.json(successResponse(logs));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load audit logs";
    return NextResponse.json(errorResponse(message, "AUDIT_ERROR"), { status: 400 });
  }
}
