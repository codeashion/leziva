# LEZIVA — Architecture Document 09: Payment Integration Plan

## 1. Razorpay Gateway Architecture
LEZIVA integrates **Razorpay** as its primary payment processor for Indian and international transactions, supporting UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit cards, Net Banking, EMI, and Cash on Delivery (COD) verification.

---

## 2. Order Creation & Amount Currency Rules
- **Currency**: `INR` (Indian Rupee).
- **Sub-unit Rule**: Razorpay expects amounts in **paise** (1 INR = 100 paise). All arithmetic conversions are handled centrally via `Math.round(totalAmountInInr * 100)` to eliminate decimal float inaccuracies.
- **Order Association**: Every Razorpay order is tagged with `receipt: order.orderNumber` and custom metadata notes (`userId`, `orderId`).

---

## 3. Cryptographic Signature Verification (HMAC SHA-256)

When the frontend completes payment via the Razorpay modal, it receives:
1. `razorpay_order_id`
2. `razorpay_payment_id`
3. `razorpay_signature`

The backend verification service validates the authenticity before confirming the order:

```typescript
import crypto from "crypto";

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  const payload = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "utf-8"),
    Buffer.from(signature, "utf-8")
  );
}
```

*Note: `crypto.timingSafeEqual` is mandatory to prevent timing attack vulnerabilities.*

---

## 4. Webhook Ingestion & Asynchronous Reconciliation

Because shoppers may close their browser or lose connection after their bank authorizes the transaction, the primary source of truth for payment status is the **Razorpay Webhook**:

- **Endpoint**: `/api/webhooks/razorpay`
- **Supported Events**:
  - `payment.captured`: Confirms payment and triggers order fulfillment.
  - `payment.failed`: Marks order as failed, alerts customer with a retry link.
  - `refund.processed`: Updates database refund record.
- **Webhook Security**:
  - Validates `x-razorpay-signature` header against `RAZORPAY_WEBHOOK_SECRET` using raw request payload bytes.
  - Idempotent processing: if the webhook has already been processed for a given `payment_id`, it returns HTTP `200 OK` immediately without repeating state changes.

---

## 5. Cash on Delivery (COD) Protocol
- Restricted to serviceable pincodes verified by Velocity Shipping.
- Hard maximum ceiling of ₹15,000 to prevent fraud.
- Mandatory OTP verification on customer mobile before final order creation.
