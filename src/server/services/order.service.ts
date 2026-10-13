import crypto from "crypto";
import { orderRepository, StoredOrder } from "@/server/repositories/order.repository";
import { addressService } from "@/server/services/address.service";
import { pricingService, PricingLineItemInput, AuthoritativeQuote } from "@/server/services/pricing.service";
import { couponService } from "@/server/services/coupon.service";
import { inventoryReservationService } from "@/server/services/inventory-reservation.service";
import { razorpayService, RazorpayOrderResponse } from "@/server/services/razorpay.service";
import { emailService } from "@/server/services/email.service";
import { cartService } from "@/server/services/cart.service";
import { AddressInput } from "@/server/validations/address.validation";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

export interface CreateOrderInput {
  userId?: string | null;
  guestCartId?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  guestName?: string | null;
  shippingAddressId?: string | null;
  shippingAddress?: AddressInput | null;
  billingAddressId?: string | null;
  billingAddress?: AddressInput | null;
  billingSameAsShipping?: boolean;
  couponCode?: string | null;
  paymentMethod: PaymentMethod;
  notes?: string | null;
  idempotencyKey?: string | null;
  items?: PricingLineItemInput[];
}

export interface AddressSnapshot {
  fullName: string;
  phone: string;
  alternatePhone?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  addressLabel?: string | null;
}

export interface CreateOrderResult {
  order: StoredOrder;
  razorpayOrder: RazorpayOrderResponse | null;
  quote: AuthoritativeQuote;
}

export interface VerifyPaymentInput {
  orderNumber: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export class OrderService {
  /**
   * Generates unique human-readable order number: LZV-YYYYMMDD-[5 ALPHANUMERIC CHARS]
   */
  generateOrderNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 5);
    return `LZV-${dateStr}-${randomSuffix}`;
  }

  /**
   * Generates a preview quote for checkout.
   */
  async getCheckoutQuote(params: {
    items: PricingLineItemInput[];
    couponCode?: string | null;
    paymentMethod?: PaymentMethod;
    userId?: string | null;
    customerEmail?: string | null;
    shippingPincode?: string | null;
  }): Promise<AuthoritativeQuote> {
    return pricingService.calculateQuote(params);
  }

  /**
   * Transactional Order Placement.
   */
  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    // 1. Idempotency Check
    if (input.idempotencyKey && input.idempotencyKey.trim()) {
      const existing = await orderRepository.findByIdempotencyKey(input.idempotencyKey.trim());
      if (existing) {
        logger.info(`[OrderService] Idempotent request resolved existing order: ${existing.orderNumber}`);
        return {
          order: existing,
          razorpayOrder: null,
          quote: null as unknown as AuthoritativeQuote,
        };
      }
    }

    // 2. Validate Contact Info for Guests
    if (!input.userId) {
      if (!input.guestEmail || !input.guestEmail.includes("@")) {
        throw new BadRequestError("Valid email address is required for guest checkout");
      }
      if (!input.guestPhone || !/^[6-9]\d{9}$/.test(input.guestPhone)) {
        throw new BadRequestError("Valid 10-digit Indian phone number is required");
      }
    }

    // 3. Resolve & Snapshot Shipping Address
    let shippingSnapshot: AddressSnapshot | null = null;
    let shippingAddressId: string | null = null;

    if (input.shippingAddressId) {
      const addr = await addressService.getAddressById(input.shippingAddressId, input.userId || undefined);
      shippingSnapshot = {
        fullName: addr.fullName,
        phone: addr.phone,
        alternatePhone: addr.alternatePhone,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        landmark: addr.landmark,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        country: addr.country,
        addressLabel: addr.addressLabel,
      };
      shippingAddressId = addr.id;
    } else if (input.shippingAddress) {
      const created = await addressService.createAddress(input.userId || null, input.shippingAddress);
      shippingSnapshot = {
        fullName: created.fullName,
        phone: created.phone,
        alternatePhone: created.alternatePhone,
        addressLine1: created.addressLine1,
        addressLine2: created.addressLine2,
        landmark: created.landmark,
        city: created.city,
        state: created.state,
        pincode: created.pincode,
        country: created.country,
        addressLabel: created.addressLabel,
      };
      shippingAddressId = created.id;
    } else {
      throw new BadRequestError("A shipping address is strictly required");
    }

    if (!shippingSnapshot) {
      throw new BadRequestError("A shipping address is strictly required");
    }

    // 4. Resolve & Snapshot Billing Address
    let billingSnapshot: AddressSnapshot | null = null;
    let billingAddressId: string | null = null;

    if (input.billingSameAsShipping !== false) {
      billingSnapshot = shippingSnapshot;
      billingAddressId = shippingAddressId;
    } else if (input.billingAddressId) {
      const bAddr = await addressService.getAddressById(input.billingAddressId, input.userId || undefined);
      billingSnapshot = {
        fullName: bAddr.fullName,
        phone: bAddr.phone,
        addressLine1: bAddr.addressLine1,
        addressLine2: bAddr.addressLine2,
        city: bAddr.city,
        state: bAddr.state,
        pincode: bAddr.pincode,
        country: bAddr.country,
      };
      billingAddressId = bAddr.id;
    } else if (input.billingAddress) {
      const createdB = await addressService.createAddress(input.userId || null, input.billingAddress);
      billingSnapshot = {
        fullName: createdB.fullName,
        phone: createdB.phone,
        addressLine1: createdB.addressLine1,
        addressLine2: createdB.addressLine2,
        city: createdB.city,
        state: createdB.state,
        pincode: createdB.pincode,
        country: createdB.country,
      };
      billingAddressId = createdB.id;
    }

    // 5. Gather Items to Purchase
    let rawItems: PricingLineItemInput[] = input.items || [];
    if (rawItems.length === 0) {
      const cart = await cartService.getCart({
        userId: input.userId,
        guestCartId: input.guestCartId,
      });
      if (cart.items.length === 0) {
        throw new BadRequestError("Your cart is empty. Please add items before placing an order.");
      }
      rawItems = cart.items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
      }));
    }

    // 6. Authoritative Pricing Calculation (Never trusts browser prices)
    const quote = await pricingService.calculateQuote({
      items: rawItems,
      couponCode: input.couponCode,
      paymentMethod: input.paymentMethod,
      userId: input.userId,
      customerEmail: input.guestEmail || undefined,
      shippingPincode: shippingSnapshot.pincode,
    });

    // 7. Validate Cash on Delivery Eligibility
    if (input.paymentMethod === PaymentMethod.COD) {
      if (quote.totalAmount > 50000) {
        throw new BadRequestError(
          "Cash on Delivery is only available for orders up to ₹50,000. Please select Razorpay for high-value couture."
        );
      }
    }

    // 8. Order Number & Stock Reservation
    const orderNumber = this.generateOrderNumber();
    await inventoryReservationService.reserveStockForOrder(
      orderNumber,
      rawItems.map((it) => ({ variantId: it.variantId, quantity: it.quantity })),
      30 // 30 minutes reservation window
    );

    // 9. Payment Gateway Setup
    let razorpayOrder: RazorpayOrderResponse | null = null;
    let initialPaymentStatus: PaymentStatus = PaymentStatus.PENDING;
    let initialOrderStatus: OrderStatus = OrderStatus.PENDING_PAYMENT;

    if (input.paymentMethod === PaymentMethod.RAZORPAY) {
      razorpayOrder = await razorpayService.createPaymentOrder({
        amountInRupees: quote.totalAmount,
        orderNumber,
        currency: quote.currency,
        notes: {
          orderNumber,
          customerEmail: input.guestEmail || "",
          itemCount: String(quote.totalItemCount),
        },
      });
    } else if (input.paymentMethod === PaymentMethod.COD) {
      initialPaymentStatus = PaymentStatus.PENDING;
      initialOrderStatus = OrderStatus.PAYMENT_CONFIRMED;
      // For COD, commit stock reservation immediately as order is confirmed
      await inventoryReservationService.commitReservation(orderNumber);
    }

    // 10. Persist Order in Database
    const createdOrder = await orderRepository.create({
      orderNumber,
      userId: input.userId || null,
      guestEmail: input.guestEmail || null,
      guestPhone: input.guestPhone || shippingSnapshot.phone,
      guestName: input.guestName || shippingSnapshot.fullName,
      status: initialOrderStatus,
      paymentMethod: input.paymentMethod,
      paymentStatus: initialPaymentStatus,
      subtotal: quote.subtotal,
      discountAmount: quote.discountAmount,
      taxAmount: quote.taxAmount,
      shippingFee: quote.shippingFee,
      codFee: quote.codFee,
      totalAmount: quote.totalAmount,
      currency: quote.currency,
      notes: input.notes || null,
      shippingAddressSnapshot: shippingSnapshot as unknown as Record<string, unknown>,
      billingAddressSnapshot: billingSnapshot ? (billingSnapshot as unknown as Record<string, unknown>) : null,
      couponCode: quote.coupon?.code || null,
      couponId: quote.coupon?.id || null,
      idempotencyKey: input.idempotencyKey || null,
      shippingAddressId,
      billingAddressId,
      items: quote.items.map((it) => ({
        variantId: it.variantId,
        productId: it.productId,
        productTitle: it.productTitle,
        variantTitle: it.variantTitle,
        sku: it.sku,
        selectedSize: it.size,
        selectedColor: it.colorName,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        lineSubtotal: it.lineSubtotal,
        discountAmount: it.allocatedDiscount,
        taxAmount: it.allocatedTax,
        totalPrice: it.finalLineTotal,
      })),
      payment: {
        gateway: input.paymentMethod === PaymentMethod.RAZORPAY ? "RAZORPAY" : "COD",
        razorpayOrderId: razorpayOrder ? razorpayOrder.id : null,
        amount: quote.totalAmount,
        currency: quote.currency,
        status: initialPaymentStatus,
      },
    });

    // 11. Record Coupon Redemption
    if (quote.coupon) {
      await couponService.recordRedemption({
        couponId: quote.coupon.id,
        userId: input.userId,
        orderId: createdOrder.id,
        customerEmail: input.guestEmail || undefined,
        discountApplied: quote.discountAmount,
      });
    }

    // 12. Clear Customer Cart
    await cartService.clearCart({
      userId: input.userId,
      guestCartId: input.guestCartId,
    });

    // 13. Dispatch Email
    const emailRecipient = input.guestEmail || "concierge@leziva.com";
    emailService.sendOrderConfirmationEmail({
      toEmail: emailRecipient,
      recipientName: shippingSnapshot.fullName,
      orderNumber,
      totalAmount: quote.totalAmount,
      subtotal: quote.subtotal,
      discountAmount: quote.discountAmount,
      taxAmount: quote.taxAmount,
      shippingFee: quote.shippingFee,
      codFee: quote.codFee,
      currency: quote.currency,
      paymentMethod: input.paymentMethod,
      shippingAddress: shippingSnapshot,
      items: quote.items.map((i) => ({
        productTitle: i.productTitle,
        variantTitle: i.variantTitle,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.finalLineTotal,
      })),
    }).catch((err) => logger.error("[OrderService] Email error:", err));

    return {
      order: createdOrder,
      razorpayOrder,
      quote,
    };
  }

  /**
   * Verifies Razorpay Payment Signature and marks order confirmed.
   */
  async verifyPayment(input: VerifyPaymentInput): Promise<StoredOrder> {
    const { orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

    // 1. Verify Cryptographic Signature
    const isValidSignature = razorpayService.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValidSignature) {
      logger.error(`[OrderService] Invalid Razorpay signature for order ${orderNumber}`);
      throw new BadRequestError("Payment verification failed: Invalid cryptographic signature");
    }

    // 2. Fetch & Validate Order
    const order = await orderRepository.findByOrderNumber(orderNumber);
    if (!order) {
      throw new NotFoundError(`Order ${orderNumber} not found`);
    }

    if (order.paymentStatus === PaymentStatus.CAPTURED) {
      logger.info(`[OrderService] Order ${orderNumber} already marked captured. Idempotent return.`);
      return order;
    }

    // 3. Commit Inventory Permanently
    await inventoryReservationService.commitReservation(orderNumber);

    // 4. Update Database
    const updated = await orderRepository.updatePaymentSuccess(
      order.id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    // 5. Dispatch Payment Receipt Email
    const emailRecipient = order.guestEmail || "client@leziva.com";
    const shippingSnap = order.shippingAddressSnapshot as unknown as AddressSnapshot;
    emailService.sendPaymentVerifiedEmail(
      {
        toEmail: emailRecipient,
        recipientName: shippingSnap.fullName || "Valued Client",
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        taxAmount: order.taxAmount,
        shippingFee: order.shippingFee,
        codFee: order.codFee,
        currency: order.currency,
        paymentMethod: "RAZORPAY",
        shippingAddress: shippingSnap,
        items: order.items.map((i) => ({
          productTitle: i.productTitle,
          variantTitle: i.variantTitle,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
        })),
      },
      {
        razorpayPaymentId,
        amount: order.totalAmount,
      }
    ).catch((err) => logger.error("[OrderService] Email error:", err));

    return updated || order;
  }

  /**
   * Processes Raw Razorpay Webhook Events Idempotently.
   */
  async handleRazorpayWebhook(rawBody: string | Buffer, signature: string): Promise<boolean> {
    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      logger.error("[OrderService] Webhook signature verification failed");
      throw new BadRequestError("Invalid webhook signature");
    }

    const payload = JSON.parse(typeof rawBody === "string" ? rawBody : rawBody.toString("utf8"));
    const eventId = payload.id;
    const eventType = payload.event;

    const isFresh = await razorpayService.recordWebhookEvent(eventId, eventType, payload);
    if (!isFresh) {
      return true; // Already processed
    }

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id;
      const rzpPaymentId = paymentEntity?.id;

      if (rzpOrderId) {
        // Find corresponding internal order
        const orderNumber = paymentEntity?.notes?.orderNumber;
        let order: StoredOrder | null = null;

        if (orderNumber) {
          order = await orderRepository.findByOrderNumber(orderNumber);
        }

        if (order && order.paymentStatus !== PaymentStatus.CAPTURED) {
          await inventoryReservationService.commitReservation(order.orderNumber);
          await orderRepository.updatePaymentSuccess(
            order.id,
            rzpOrderId,
            rzpPaymentId || `pay_wh_${Date.now()}`,
            "webhook_verified"
          );
          logger.info(`[OrderService] Webhook successfully confirmed order ${order.orderNumber}`);
        }
      }
    }

    return true;
  }

  /**
   * Retrieves all orders for an authenticated user with strict authorization.
   */
  async getUserOrders(userId: string): Promise<StoredOrder[]> {
    return orderRepository.findByUserId(userId);
  }

  /**
   * Retrieves single order by order number with ownership verification.
   */
  async getOrderByNumber(orderNumber: string, userId?: string | null, guestEmail?: string | null): Promise<StoredOrder> {
    const order = await orderRepository.findByOrderNumber(orderNumber);
    if (!order) {
      throw new NotFoundError(`Order ${orderNumber} not found`);
    }

    // Ownership Enforcement
    if (order.userId) {
      if (!userId || order.userId !== userId) {
        throw new ForbiddenError("You are not authorized to view this order");
      }
    } else if (order.guestEmail && guestEmail) {
      if (order.guestEmail.toLowerCase() !== guestEmail.toLowerCase()) {
        throw new ForbiddenError("You are not authorized to view this order");
      }
    }

    return order;
  }

  /**
   * Customer cancellation request.
   */
  async requestCancellation(orderNumber: string, userId: string, reason?: string): Promise<StoredOrder> {
    const order = await this.getOrderByNumber(orderNumber, userId);

    // Validate Cancellation Eligibility
    const nonCancellableStates: OrderStatus[] = [
      OrderStatus.SHIPPED,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.RETURNED,
      OrderStatus.REFUNDED,
    ];

    if (nonCancellableStates.includes(order.status)) {
      throw new BadRequestError(
        `Order ${orderNumber} cannot be cancelled because it is in "${order.status}" status.`
      );
    }

    // Release Reserved Inventory
    await inventoryReservationService.releaseReservation(order.orderNumber, reason || "CUSTOMER_CANCELLED");

    // Update Status
    const updated = await orderRepository.updateStatus(
      order.id,
      OrderStatus.CANCELLED,
      reason || "Cancelled by customer request",
      "CUSTOMER",
      userId
    );

    // Dispatch Cancellation Email
    const recipient = order.guestEmail || "client@leziva.com";
    const shippingSnap = order.shippingAddressSnapshot as unknown as AddressSnapshot;
    emailService.sendOrderCancelledEmail({
      toEmail: recipient,
      recipientName: shippingSnap.fullName || "Valued Client",
      orderNumber,
      reason,
    }).catch((err) => logger.error("[OrderService] Cancellation email error:", err));

    return updated || order;
  }
}

export const orderService = new OrderService();
