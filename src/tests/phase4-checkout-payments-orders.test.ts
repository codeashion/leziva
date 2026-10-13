import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { pricingService, STANDARD_SHIPPING_FEE, COD_CONVENIENCE_FEE } from "../server/services/pricing.service";
import { couponService } from "../server/services/coupon.service";
import { orderService } from "../server/services/order.service";
import { orderRepository } from "../server/repositories/order.repository";
import { inventoryService } from "../server/services/inventory.service";
import { razorpayService } from "../server/services/razorpay.service";
import { addressService } from "../server/services/address.service";
import { addressSchema } from "../server/validations/address.validation";
import { PaymentMethod, PaymentStatus, OrderStatus } from "@prisma/client";

describe("Phase 4: Pricing Engine & Tax Calculation", () => {
  test("calculates accurate subtotal, 5% apparel GST, and free shipping for orders >= ₹2,999", async () => {
    // 1 item of prod_banarasi_saree (var_saree_emerald, ₹24,500)
    const quote = await pricingService.calculateQuote({
      items: [{ variantId: "var_saree_emerald", quantity: 1 }],
      paymentMethod: PaymentMethod.RAZORPAY,
    });

    assert.equal(quote.subtotal, 24500);
    assert.equal(quote.isFreeShipping, true);
    assert.equal(quote.shippingFee, 0);
    assert.equal(quote.codFee, 0);

    // 5% GST on ₹24,500 = ₹1,225.00
    assert.equal(quote.taxAmount, 1225);
    assert.equal(quote.totalAmount, 24500 + 1225); // ₹25,725
  });

  test("applies standard shipping fee of ₹250 when subtotal is below ₹2,999 threshold", async () => {
    // 1 item of prod_atelier_swatch (var_silk_swatch, ₹1,500)
    const quote = await pricingService.calculateQuote({
      items: [{ variantId: "var_silk_swatch", quantity: 1 }],
      paymentMethod: PaymentMethod.RAZORPAY,
    });

    assert.equal(quote.subtotal, 1500);
    assert.equal(quote.isFreeShipping, false);
    assert.equal(quote.shippingFee, STANDARD_SHIPPING_FEE);

    // 5% GST on ₹1,500 = ₹75.00
    assert.equal(quote.taxAmount, 75);
    // Total = 1500 + 75 + 250 = 1825
    assert.equal(quote.totalAmount, 1825);
  });

  test("applies ₹99 COD convenience fee when payment method is Cash on Delivery", async () => {
    const quote = await pricingService.calculateQuote({
      items: [{ variantId: "var_saree_emerald", quantity: 1 }],
      paymentMethod: PaymentMethod.COD,
    });

    assert.equal(quote.codFee, COD_CONVENIENCE_FEE);
    assert.equal(quote.totalAmount, 24500 + 1225 + COD_CONVENIENCE_FEE); // ₹25,824
  });
});

describe("Phase 4: Coupon Validation & Allocation Rules", () => {
  test("validates percentage coupon LEZIVA10 and caps at maxDiscount", async () => {
    // LEZIVA10: 10% off, min ₹5000, max discount ₹2500
    const result = await couponService.validateAndCalculate("LEZIVA10", {
      subtotal: 30000, // 10% of 30,000 is 3,000, should be capped at 2,500
    });

    assert.equal(result.coupon.code, "LEZIVA10");
    assert.equal(result.discountAmount, 2500);
  });

  test("validates flat discount coupon ROYAL500 for eligible order value", async () => {
    // ROYAL500: Flat ₹500 off for orders above ₹8,000
    const result = await couponService.validateAndCalculate("ROYAL500", {
      subtotal: 12000,
    });

    assert.equal(result.discountAmount, 500);
  });

  test("rejects coupon when subtotal does not satisfy minimum order threshold", async () => {
    await assert.rejects(
      async () => {
        await couponService.validateAndCalculate("LEZIVA10", {
          subtotal: 3000, // Below ₹5,000 threshold
        });
      },
      {
        message: /requires a minimum order value/,
      }
    );
  });

  test("rejects expired or non-existent coupon codes", async () => {
    await assert.rejects(
      async () => {
        await couponService.validateAndCalculate("INVALID_PROMO", {
          subtotal: 10000,
        });
      },
      {
        message: /does not exist/,
      }
    );
  });

  test("allocates discounts proportionally across line items in pricing quote", async () => {
    const quote = await pricingService.calculateQuote({
      items: [
        { variantId: "var_saree_emerald", quantity: 1 }, // ₹24,500
        { variantId: "var_silk_swatch", quantity: 1 }, // ₹1,500
      ],
      couponCode: "ROYAL500", // ₹500 flat discount on total ₹26,000
    });

    assert.equal(quote.subtotal, 26000);
    assert.equal(quote.discountAmount, 500);
    const sumAllocatedDiscount = quote.items.reduce((sum, it) => sum + it.allocatedDiscount, 0);
    assert.equal(Math.round(sumAllocatedDiscount), 500);
    assert.ok(quote.taxAmount > 0);
  });
});

describe("Phase 4: Customer Address Management & Validation", () => {
  test("creates address with validation and normalizes phone and PIN code", async () => {
    const addr = await addressService.createAddress("test_user_p4_1", {
      fullName: "Ananya Singhania",
      phone: "9876543210",
      addressLine1: "42 Heritage Silk Enclave",
      city: "Surat",
      state: "Gujarat",
      pincode: "395007",
      country: "India",
      addressLabel: "Home",
      isDefaultShipping: true,
      isDefaultBilling: true,
    });

    assert.ok(addr.id);
    assert.equal(addr.fullName, "Ananya Singhania");
    assert.equal(addr.pincode, "395007");
    assert.equal(addr.isDefaultShipping, true);
  });

  test("enforces customer address isolation preventing unauthorized access", async () => {
    const addr = await addressService.createAddress("user_owner_1", {
      fullName: "Owner User",
      phone: "9876543210",
      addressLine1: "10 Privet Court",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      country: "India",
      addressLabel: "Home",
      isDefaultShipping: false,
      isDefaultBilling: false,
    });

    // Another user tries to fetch it
    await assert.rejects(
      async () => {
        await addressService.getAddressById(addr.id, "different_user_99");
      },
      {
        message: /not authorized/,
      }
    );
  });
});

describe("Phase 4: Transactional Order Placement & Idempotency", () => {
  test("creates order with address snapshot and authoritative calculation", async () => {
    const result = await orderService.createOrder({
      userId: "cust_p4_order_1",
      shippingAddress: {
        fullName: "Meera Kapoor",
        phone: "9823456789",
        addressLine1: "Villa 14, Royal Palm Groves",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        country: "India",
        addressLabel: "Home",
        isDefaultShipping: true,
        isDefaultBilling: true,
      },
      paymentMethod: PaymentMethod.RAZORPAY,
      items: [{ variantId: "var_saree_emerald", quantity: 1 }],
      idempotencyKey: "idem_key_order_unique_1",
    });

    assert.ok(result.order.orderNumber.startsWith("LZV-"));
    assert.equal(result.order.status, OrderStatus.PENDING_PAYMENT);
    assert.equal(result.order.paymentMethod, PaymentMethod.RAZORPAY);
    assert.equal(result.order.totalAmount, 25725); // ₹24,500 + 5% GST
    assert.equal(result.order.shippingAddressSnapshot.fullName, "Meera Kapoor");
    assert.equal(result.order.shippingAddressSnapshot.pincode, "560001");
    assert.ok(result.razorpayOrder);
    assert.equal(result.razorpayOrder.amount, 2572500); // Amount in paise
  });

  test("idempotent submission returns original order without duplicates", async () => {
    const idempotencyKey = "idem_key_duplicate_prevent_123";

    const first = await orderService.createOrder({
      userId: "cust_p4_order_idem",
      shippingAddress: {
        fullName: "Kavita Rao",
        phone: "9823456780",
        addressLine1: "Flat 202, Silk Towers",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500001",
        country: "India",
        addressLabel: "Home",
        isDefaultShipping: true,
        isDefaultBilling: true,
      },
      paymentMethod: PaymentMethod.RAZORPAY,
      items: [{ variantId: "var_silk_swatch", quantity: 1 }],
      idempotencyKey,
    });

    const second = await orderService.createOrder({
      userId: "cust_p4_order_idem",
      shippingAddress: {
        fullName: "Kavita Rao",
        phone: "9823456780",
        addressLine1: "Flat 202, Silk Towers",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500001",
        country: "India",
        addressLabel: "Home",
        isDefaultShipping: true,
        isDefaultBilling: true,
      },
      paymentMethod: PaymentMethod.RAZORPAY,
      items: [{ variantId: "var_silk_swatch", quantity: 1 }],
      idempotencyKey,
    });

    assert.equal(first.order.orderNumber, second.order.orderNumber);
    assert.equal(first.order.id, second.order.id);
  });
});

describe("Phase 4: Inventory Reservation & Rollback Lifecycle", () => {
  test("reserves stock and prevents overselling when available inventory is exceeded", async () => {
    const stockStatus = await inventoryService.getVariantStock("var_lehenga_m");
    const excessiveQuantity = stockStatus.availableQuantity + 10;

    await assert.rejects(
      async () => {
        await orderService.createOrder({
          userId: "cust_excess_stock",
          shippingAddress: {
            fullName: "Test Patron",
            phone: "9823456780",
            addressLine1: "Palace Road",
            city: "Jaipur",
            state: "Rajasthan",
            pincode: "302001",
            country: "India",
            addressLabel: "Home",
            isDefaultShipping: true,
            isDefaultBilling: true,
          },
          paymentMethod: PaymentMethod.RAZORPAY,
          items: [{ variantId: "var_lehenga_m", quantity: excessiveQuantity }],
        });
      },
      {
        message: /available|inventory|stock/i,
      }
    );
  });

  test("releases reserved inventory back to available stock upon order cancellation", async () => {
    const initialStock = await inventoryService.getVariantStock("var_dress_s");

    const orderRes = await orderService.createOrder({
      userId: "cust_cancel_test_1",
      shippingAddress: {
        fullName: "Pooja Hegde",
        phone: "9812345678",
        addressLine1: "Alaknanda Enclave",
        city: "Delhi",
        state: "Delhi",
        pincode: "110019",
        country: "India",
        addressLabel: "Home",
        isDefaultShipping: true,
        isDefaultBilling: true,
      },
      paymentMethod: PaymentMethod.RAZORPAY,
      items: [{ variantId: "var_dress_s", quantity: 1 }],
    });

    const stockAfterReservation = await inventoryService.getVariantStock("var_dress_s");
    assert.equal(stockAfterReservation.availableQuantity, initialStock.availableQuantity - 1);

    // Cancel order
    const cancelled = await orderService.requestCancellation(
      orderRes.order.orderNumber,
      "cust_cancel_test_1",
      "Customer changed occasion date"
    );

    assert.equal(cancelled.status, OrderStatus.CANCELLED);

    // Stock should be restored
    const stockAfterCancel = await inventoryService.getVariantStock("var_dress_s");
    assert.equal(stockAfterCancel.availableQuantity, initialStock.availableQuantity);
  });
});

describe("Phase 4: Razorpay Cryptographic Verification & Webhooks", () => {
  test("verifies valid HMAC-SHA256 signature and rejects forged signatures", () => {
    const orderId = "order_rzp_test_123";
    const paymentId = "pay_rzp_test_456";

    // Generate valid signature using helper
    const validSignature = razorpayService.generateMockSignature(orderId, paymentId);

    const isValid = razorpayService.verifyPaymentSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: validSignature,
    });
    assert.equal(isValid, true);

    // Tampered / forged signature
    const isInvalid = razorpayService.verifyPaymentSignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: "forged_invalid_signature_hex_1234567890abcdef",
    });
    assert.equal(isInvalid, false);
  });

  test("processes raw webhook events idempotently and rejects duplicates", async () => {
    const eventId = `evt_test_${Date.now()}`;
    const payload = {
      id: eventId,
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_test_999",
            order_id: "order_test_999",
          },
        },
      },
    };

    const firstProcessing = await razorpayService.recordWebhookEvent(eventId, "payment.captured", payload);
    assert.equal(firstProcessing, true);

    // Second processing of identical event should be recognized as duplicate
    const secondProcessing = await razorpayService.recordWebhookEvent(eventId, "payment.captured", payload);
    assert.equal(secondProcessing, false);
  });
});

describe("Phase 4: Cash on Delivery (COD) Flow", () => {
  test("creates authorized COD order without online transaction and reserves stock immediately", async () => {
    const result = await orderService.createOrder({
      userId: "cust_cod_test_1",
      shippingAddress: {
        fullName: "Tarun Tahiliani",
        phone: "9823456789",
        addressLine1: "74 Fashion Boulevard",
        city: "Ahmedabad",
        state: "Gujarat",
        pincode: "380015",
        country: "India",
        addressLabel: "Home",
        isDefaultShipping: true,
        isDefaultBilling: true,
      },
      paymentMethod: PaymentMethod.COD,
      items: [{ variantId: "var_silk_swatch", quantity: 1 }],
    });

    assert.equal(result.order.paymentMethod, PaymentMethod.COD);
    assert.equal(result.order.status, OrderStatus.PAYMENT_CONFIRMED);
    assert.equal(result.order.paymentStatus, PaymentStatus.PENDING);
    assert.equal(result.razorpayOrder, null);
    assert.ok(result.order.codFee > 0);
  });

  test("rejects Cash on Delivery when order amount exceeds luxury fraud limit (> ₹50,000)", async () => {
    // 1 Imperial Velvet Lehenga = ₹68,000 (> ₹50k limit)
    await assert.rejects(
      async () => {
        await orderService.createOrder({
          userId: "cust_cod_high_val",
          shippingAddress: {
            fullName: "High Value Buyer",
            phone: "9823456789",
            addressLine1: "Gold Street",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
            country: "India",
            addressLabel: "Home",
            isDefaultShipping: true,
            isDefaultBilling: true,
          },
          paymentMethod: PaymentMethod.COD,
          items: [{ variantId: "var_lehenga_m", quantity: 1 }],
        });
      },
      {
        message: /Cash on Delivery is only available for orders up to ₹50,000/i,
      }
    );
  });
});

describe("Phase 4: Customer Order History & Ownership Enforcement", () => {
  test("allows customer to view only their own orders and forbids strangers", async () => {
    const orderRes = await orderService.createOrder({
      userId: "customer_alpha_1",
      shippingAddress: {
        fullName: "Alpha Customer",
        phone: "9823456789",
        addressLine1: "Alpha Heights",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411001",
        country: "India",
        addressLabel: "Home",
        isDefaultShipping: true,
        isDefaultBilling: true,
      },
      paymentMethod: PaymentMethod.RAZORPAY,
      items: [{ variantId: "var_saree_emerald", quantity: 1 }],
    });

    // Customer Alpha can access
    const fetchedByAlpha = await orderService.getOrderByNumber(
      orderRes.order.orderNumber,
      "customer_alpha_1"
    );
    assert.equal(fetchedByAlpha.orderNumber, orderRes.order.orderNumber);

    // Customer Beta cannot access
    await assert.rejects(
      async () => {
        await orderService.getOrderByNumber(
          orderRes.order.orderNumber,
          "customer_beta_stranger"
        );
      },
      {
        message: /not authorized/i,
      }
    );
  });

  test("forbids cancellation when order has already been shipped or delivered", async () => {
    const orderRes = await orderService.createOrder({
      userId: "customer_shipped_test",
      shippingAddress: {
        fullName: "Shipped Customer",
        phone: "9823456789",
        addressLine1: "Dispatch Way",
        city: "Kolkata",
        state: "West Bengal",
        pincode: "700001",
        country: "India",
        addressLabel: "Home",
        isDefaultShipping: true,
        isDefaultBilling: true,
      },
      paymentMethod: PaymentMethod.COD,
      items: [{ variantId: "var_silk_swatch", quantity: 1 }],
    });

    // Transition status to SHIPPED
    await orderRepository.updateStatus(orderRes.order.id, OrderStatus.SHIPPED, "Dispatched via carrier");

    // Attempt cancellation
    await assert.rejects(
      async () => {
        await orderService.requestCancellation(
          orderRes.order.orderNumber,
          "customer_shipped_test"
        );
      },
      {
        message: /cannot be cancelled because it is in "SHIPPED" status/i,
      }
    );
  });
});

describe("Phase 4: Address Validation Rules", () => {
  test("rejects addresses with invalid phone number or invalid PIN code", () => {
    // Invalid phone: 9 digits
    const res1 = addressSchema.safeParse({
      fullName: "Priya Sharma",
      phone: "987654321", // 9 digits
      addressLine1: "123 Ring Road",
      city: "Surat",
      state: "Gujarat",
      pincode: "395007",
    });
    assert.equal(res1.success, false);

    // Invalid PIN code: 5 digits
    const res2 = addressSchema.safeParse({
      fullName: "Priya Sharma",
      phone: "9876543210",
      addressLine1: "123 Ring Road",
      city: "Surat",
      state: "Gujarat",
      pincode: "39500", // 5 digits
    });
    assert.equal(res2.success, false);

    // Invalid PIN code: starts with 0
    const res3 = addressSchema.safeParse({
      fullName: "Priya Sharma",
      phone: "9876543210",
      addressLine1: "123 Ring Road",
      city: "Surat",
      state: "Gujarat",
      pincode: "095001",
    });
    assert.equal(res3.success, false);
  });
});

describe("Phase 4: Duplicate Callback, Webhook & Idempotency Protection", () => {
  test("duplicate verifyPayment call returns captured order idempotently without deducting inventory twice", async () => {
    const initialStock = await inventoryService.getVariantStock("var_silk_swatch");

    const orderRes = await orderService.createOrder({
      userId: "cust_dup_callback",
      shippingAddress: {
        fullName: "Sita Raman",
        phone: "9876543210",
        addressLine1: "45 Jasmine Lane",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600001",
        country: "India",
        addressLabel: "Home",
        isDefaultShipping: true,
        isDefaultBilling: true,
      },
      paymentMethod: PaymentMethod.RAZORPAY,
      items: [{ variantId: "var_silk_swatch", quantity: 1 }],
    });

    const stockAfterReserve = await inventoryService.getVariantStock("var_silk_swatch");
    assert.equal(stockAfterReserve.availableQuantity, initialStock.availableQuantity - 1);

    const rzpOrderId = orderRes.razorpayOrder!.id;
    const rzpPaymentId = `pay_dup_test_${Date.now()}`;
    const signature = razorpayService.generateMockSignature(rzpOrderId, rzpPaymentId);

    // First verification
    const verified1 = await orderService.verifyPayment({
      orderNumber: orderRes.order.orderNumber,
      razorpayOrderId: rzpOrderId,
      razorpayPaymentId: rzpPaymentId,
      razorpaySignature: signature,
    });
    assert.equal(verified1.paymentStatus, PaymentStatus.CAPTURED);

    const stockAfterCommit = await inventoryService.getVariantStock("var_silk_swatch");
    assert.equal(stockAfterCommit.availableQuantity, initialStock.availableQuantity - 1);

    // Duplicate callback with identical transaction details
    const verified2 = await orderService.verifyPayment({
      orderNumber: orderRes.order.orderNumber,
      razorpayOrderId: rzpOrderId,
      razorpayPaymentId: rzpPaymentId,
      razorpaySignature: signature,
    });
    assert.equal(verified2.paymentStatus, PaymentStatus.CAPTURED);
    assert.equal(verified2.orderNumber, orderRes.order.orderNumber);

    // Inventory must NOT be deducted again
    const stockAfterDup = await inventoryService.getVariantStock("var_silk_swatch");
    assert.equal(stockAfterDup.availableQuantity, stockAfterCommit.availableQuantity);
  });
});

describe("Phase 4: Payment Failure & Interrupted Session Recovery Flow", () => {
  test("pending payment order remains recoverable and allows subsequent verification", async () => {
    // 1. Customer initiates checkout but does not pay immediately
    const orderRes = await orderService.createOrder({
      userId: "cust_recover_flow",
      shippingAddress: {
        fullName: "Rahul Varma",
        phone: "9876543210",
        addressLine1: "78 Lotus Court",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
        country: "India",
        addressLabel: "Home",
        isDefaultShipping: true,
        isDefaultBilling: true,
      },
      paymentMethod: PaymentMethod.RAZORPAY,
      items: [{ variantId: "var_silk_swatch", quantity: 1 }],
    });

    assert.equal(orderRes.order.status, OrderStatus.PENDING_PAYMENT);
    assert.equal(orderRes.order.paymentStatus, PaymentStatus.PENDING);

    // 2. Order can be retrieved by customer to inspect status
    const retrieved = await orderService.getOrderByNumber(orderRes.order.orderNumber, "cust_recover_flow");
    assert.equal(retrieved.status, OrderStatus.PENDING_PAYMENT);

    // 3. Customer retries payment successfully later within the reservation window
    const rzpOrderId = orderRes.razorpayOrder!.id;
    const rzpPaymentId = `pay_recovered_${Date.now()}`;
    const signature = razorpayService.generateMockSignature(rzpOrderId, rzpPaymentId);

    const completed = await orderService.verifyPayment({
      orderNumber: orderRes.order.orderNumber,
      razorpayOrderId: rzpOrderId,
      razorpayPaymentId: rzpPaymentId,
      razorpaySignature: signature,
    });

    assert.equal(completed.status, OrderStatus.PAYMENT_CONFIRMED);
    assert.equal(completed.paymentStatus, PaymentStatus.CAPTURED);
  });
});

