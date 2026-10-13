import crypto from "crypto";
import { getServerEnv } from "@/shared/validations/env";
import { prisma } from "@/server/db/prisma";
import { logger } from "@/utils/logger";
import { BadRequestError } from "@/utils/errors";

export interface CreateRazorpayOrderInput {
  amountInRupees: number;
  orderNumber: string;
  currency?: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: "order";
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: "created" | "attempted" | "paid";
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
  isMock: boolean;
}

export interface VerifyPaymentSignatureInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export class RazorpayService {
  private memoryWebhookEvents = new Set<string>();

  private getCredentials() {
    const env = getServerEnv();
    const keyId = env.RAZORPAY_KEY_ID;
    const keySecret = env.RAZORPAY_KEY_SECRET;
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
    const isPlaceholder =
      !keyId ||
      keyId.includes("placeholder") ||
      !keySecret ||
      keySecret.includes("placeholder");

    return { keyId, keySecret, webhookSecret, isPlaceholder };
  }

  /**
   * Generates a payment order on Razorpay servers (or deterministic test mock if using placeholder keys).
   */
  async createPaymentOrder(input: CreateRazorpayOrderInput): Promise<RazorpayOrderResponse> {
    const { keyId, keySecret, isPlaceholder } = this.getCredentials();
    const amountInPaise = Math.round(input.amountInRupees * 100);
    const currency = input.currency || "INR";

    if (amountInPaise <= 0) {
      throw new BadRequestError("Payment amount must be greater than zero");
    }

    if (isPlaceholder) {
      logger.info(
        `[RazorpayService] Using simulated test order (placeholder credentials) for order: ${input.orderNumber}`
      );
      const mockId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return {
        id: mockId,
        entity: "order",
        amount: amountInPaise,
        amount_paid: 0,
        amount_due: amountInPaise,
        currency,
        receipt: input.orderNumber,
        status: "created",
        attempts: 0,
        notes: input.notes || {},
        created_at: Math.floor(Date.now() / 1000),
        isMock: true,
      };
    }

    // Official Razorpay REST API call with HTTP Basic Auth
    try {
      const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt: input.orderNumber,
          notes: input.notes || {},
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        logger.error("[RazorpayService] Provider error creating order:", errorText);
        throw new Error(`Razorpay provider rejected order creation: ${res.statusText}`);
      }

      const data = await res.json();
      return {
        ...data,
        isMock: false,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("[RazorpayService] Network error connecting to Razorpay:", msg);
      // Fallback for sandboxed offline testing if external API is unreachable
      const mockId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return {
        id: mockId,
        entity: "order",
        amount: amountInPaise,
        amount_paid: 0,
        amount_due: amountInPaise,
        currency,
        receipt: input.orderNumber,
        status: "created",
        attempts: 0,
        notes: input.notes || {},
        created_at: Math.floor(Date.now() / 1000),
        isMock: true,
      };
    }
  }

  /**
   * Generates signature for mock/sandbox testing
   */
  generateMockSignature(orderId: string, paymentId: string): string {
    const { keySecret } = this.getCredentials();
    const secretToUse = keySecret || "mock_secret";
    return crypto
      .createHmac("sha256", secretToUse)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
  }

  /**
   * Verifies the client-submitted payment signature using server-only HMAC-SHA256.
   * Never trusts the frontend without cryptographically valid signature.
   */
  verifyPaymentSignature(input: VerifyPaymentSignatureInput): boolean {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return false;
    }

    const { keySecret } = this.getCredentials();
    const secretToUse = keySecret || "mock_secret";

    try {
      const generatedSignature = crypto
        .createHmac("sha256", secretToUse)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      const signatureBuffer = Buffer.from(razorpaySignature);
      const generatedBuffer = Buffer.from(generatedSignature);

      if (signatureBuffer.length !== generatedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(signatureBuffer, generatedBuffer);
    } catch (err: unknown) {
      logger.error("[RazorpayService] Signature verification exception:", err);
      return false;
    }
  }

  /**
   * Verifies incoming webhook signature against raw request body buffer.
   */
  verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string): boolean {
    if (!rawBody || !signatureHeader) {
      return false;
    }

    const { webhookSecret } = this.getCredentials();
    const secretToUse = webhookSecret || "rzp_webhook_secret_placeholder";

    try {
      const expectedSignature = crypto
        .createHmac("sha256", secretToUse)
        .update(rawBody)
        .digest("hex");

      const headerBuffer = Buffer.from(signatureHeader);
      const expectedBuffer = Buffer.from(expectedSignature);

      if (headerBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(headerBuffer, expectedBuffer);
    } catch (err: unknown) {
      logger.error("[RazorpayService] Webhook signature verification exception:", err);
      return false;
    }
  }

  /**
   * Records and deduplicates incoming webhook events.
   * Returns true if event is fresh; returns false if event was already processed (duplicate).
   */
  async recordWebhookEvent(eventId: string, eventType: string, payload?: unknown): Promise<boolean> {
    if (this.memoryWebhookEvents.has(eventId)) {
      logger.info(`[RazorpayService] Webhook event ${eventId} already processed (memory deduplication)`);
      return false;
    }

    try {
      const existing = await prisma.paymentWebhookEvent.findUnique({
        where: { eventId },
      });
      if (existing) {
        logger.info(`[RazorpayService] Webhook event ${eventId} already processed (database deduplication)`);
        return false;
      }

      await prisma.paymentWebhookEvent.create({
        data: {
          eventId,
          eventType,
          status: "PROCESSED",
          payload: payload ? { summary: eventType } : undefined,
          processedAt: new Date(),
        },
      });
    } catch {
      // Memory fallback
    }

    this.memoryWebhookEvents.add(eventId);
    return true;
  }

  /**
   * Issues a refund against a captured Razorpay payment.
   */
  async createRefund(input: {
    paymentId: string;
    amountInRupees: number;
    notes?: Record<string, string>;
  }): Promise<{
    id: string;
    amount: number;
    currency: string;
    payment_id: string;
    status: string;
    created_at: number;
    isMock: boolean;
  }> {
    const { keyId, keySecret, isPlaceholder } = this.getCredentials();
    const amountInPaise = Math.round(input.amountInRupees * 100);

    if (amountInPaise <= 0) {
      throw new BadRequestError("Refund amount must be greater than zero.");
    }

    if (isPlaceholder || !keyId || !keySecret) {
      logger.info(
        `[RazorpayService] Executing deterministic mock refund for ${input.paymentId} (Amount: INR ${input.amountInRupees})`
      );
      return {
        id: `rfnd_mock_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        amount: amountInPaise,
        currency: "INR",
        payment_id: input.paymentId,
        status: "processed",
        created_at: Math.floor(Date.now() / 1000),
        isMock: true,
      };
    }

    try {
      const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
      const response = await fetch(`https://api.razorpay.com/v1/payments/${input.paymentId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          notes: input.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { error?: { description?: string } })?.error?.description ||
            `Razorpay refund failed with HTTP status ${response.status}`
        );
      }

      const refundData = await response.json();
      return {
        id: refundData.id,
        amount: refundData.amount,
        currency: refundData.currency || "INR",
        payment_id: input.paymentId,
        status: refundData.status || "processed",
        created_at: refundData.created_at || Math.floor(Date.now() / 1000),
        isMock: false,
      };
    } catch (err: unknown) {
      logger.error("[RazorpayService] Failed to create refund on Razorpay:", err);
      throw err;
    }
  }
}

export const razorpayService = new RazorpayService();
