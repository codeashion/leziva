import { apiSuccess } from "@/utils/api-response";

export async function GET() {
  const healthData = {
    status: "healthy",
    service: "LEZIVA Fashion E-Commerce Platform",
    phase: "Phase 0 — Project Foundation & Architecture",
    version: "0.1.0",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    integrations: {
      database: "PostgreSQL (Prisma configured)",
      cache: "Redis ready",
      paymentGateway: "Razorpay ready",
      logistics: "Velocity Shipping ready",
    },
  };

  return apiSuccess(healthData, {
    cached: false,
    region: process.env.VERCEL_REGION || "local",
  });
}
