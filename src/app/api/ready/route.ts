import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/server/db/prisma";
import { redisService } from "@/server/redis/client";

export async function GET() {
  const [dbResult, redisResult] = await Promise.all([
    checkDatabaseHealth(),
    redisService.checkHealth(),
  ]);

  const isReady = dbResult.status === "connected" && redisResult.status === "connected";

  const payload = {
    status: isReady ? "ready" : "degraded",
    ready: isReady,
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: dbResult.status,
        latencyMs: dbResult.latencyMs,
      },
      redis: {
        status: redisResult.status,
        latencyMs: redisResult.latencyMs,
      },
    },
  };

  return NextResponse.json(payload, {
    status: isReady ? 200 : 503,
  });
}
