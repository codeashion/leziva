import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/server/services/order.service";
import { logger } from "@/utils/logger";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      logger.error("[RazorpayWebhook] Missing x-razorpay-signature header");
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
    }

    await orderService.handleRazorpayWebhook(rawBody, signature);
    return NextResponse.json({ status: "ok" });
  } catch (error: unknown) {
    const err = error as { message?: string };
    logger.error("[RazorpayWebhook] Webhook processing error:", err.message || "Unknown error");
    return NextResponse.json({ error: err.message || "Webhook processing error" }, { status: 400 });
  }
}
