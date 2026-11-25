import { NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid Razorpay webhook signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    const event = payload?.event as string | undefined;
    const paymentEntity = payload?.payload?.payment?.entity;
    const orderEntity = payload?.payload?.order?.entity;

    console.info("[Razorpay Webhook]", {
      event,
      paymentId: paymentEntity?.id,
      orderId: paymentEntity?.order_id ?? orderEntity?.id,
      status: paymentEntity?.status ?? orderEntity?.status,
      amount: paymentEntity?.amount ?? orderEntity?.amount,
    });

    return NextResponse.json({
      success: true,
      received: true,
      event,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
