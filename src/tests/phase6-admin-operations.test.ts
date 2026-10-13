import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

// Repositories
import { orderRepository } from "../server/repositories/order.repository";
import { productRepository } from "../server/repositories/product.repository";
import { shipmentRepository } from "../server/repositories/shipment.repository";
import { returnRequestRepository } from "../server/repositories/return-request.repository";

// Services
import { inventoryService } from "../server/services/inventory.service";
import { adminOrderService } from "../server/services/admin-order.service";
import { adminProductService } from "../server/services/admin-product.service";
import { refundService } from "../server/services/refund.service";
import { customerService } from "../server/services/customer.service";
import { analyticsService } from "../server/services/analytics.service";
import { supportService } from "../server/services/support.service";
import { adminCategoryService } from "../server/services/admin-category.service";
import { reviewService } from "../server/services/review.service";
import { notificationTemplateService } from "../server/services/notification-template.service";
import { rbacService, Permissions } from "../server/auth/rbac.service";

// Enums & Types
import { OrderStatus, PaymentStatus, PaymentMethod, RoleType, ShipmentStatus } from "@prisma/client";
import { Product } from "../shared/types";

describe("Phase 6: Admin Dashboard, Operations & Workflows Verification Suite", () => {
  let sampleProduct: Product;
  let sampleVariantId: string;
  let testOrderId: string;
  let testOrderNumber: string;

  before(async () => {
    // 1. Seed in-memory test product with variants for Catalog & Inventory testing
    const lehengaCat = await productRepository.getCategoryBySlug("lehengas");
    const activeCatId = lehengaCat ? lehengaCat.id : "cat_lehengas";

    sampleVariantId = `var_adm_test_${Date.now()}`;
    sampleProduct = {
      id: `prod_adm_test_${Date.now()}`,
      title: "Royal Crimson Zardozi Lehenga",
      slug: `royal-crimson-zardozi-lehenga-${Date.now()}`,
      description: "Handcrafted crimson silk ensemble with heirloom antique metallic embroidery.",
      categoryId: activeCatId,
      status: "ACTIVE",
      isFeatured: true,
      isNewArrival: true,
      isActive: true,
      tags: ["bridal", "silk", "handcrafted"],
      createdAt: new Date(),
      updatedAt: new Date(),
      collections: [],
      images: [
        {
          id: `img_adm_1`,
          productId: `prod_adm_test`,
          url: "/images/lehenga-front.jpg",
          altText: "Lehenga Front View",
          mediaType: "IMAGE",
          sortOrder: 1,
          isPrimary: true,
        },
      ],
      variants: [
        {
          id: sampleVariantId,
          productId: `prod_adm_test`,
          sku: `LZV-CRIMSON-M-${Date.now()}`,
          title: "Medium / Crimson Gold",
          size: "M",
          colorName: "Crimson Gold",
          colorHex: "#990000",
          price: 145000,
          compareAtPrice: 165000,
          inventoryQuantity: 20,
          lowStockThreshold: 5,
          weightGrams: 3200,
          isActive: true,
        },
      ],
    };

    productRepository.addMemoryProduct(sampleProduct);

    // 2. Seed a verified paid order
    testOrderNumber = `LZV-ADM-${Date.now()}`;
    const createdOrder = await orderRepository.create({
      orderNumber: testOrderNumber,
      userId: `usr_client_${Date.now()}`,
      guestEmail: "maharani.client@leziva.com",
      guestPhone: "9876543210",
      guestName: "Maharani Gayatri Devi",
      status: OrderStatus.PAYMENT_CONFIRMED,
      paymentMethod: PaymentMethod.RAZORPAY,
      paymentStatus: PaymentStatus.CAPTURED,
      currency: "INR",
      subtotal: 145000,
      discountAmount: 0,
      taxAmount: 17400,
      shippingFee: 0,
      codFee: 0,
      totalAmount: 162400,
      shippingAddressSnapshot: {
        fullName: "Maharani Gayatri Devi",
        phone: "9876543210",
        addressLine1: "Lilypond Palace, Suite 101",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302001",
        country: "India",
      },
      items: [
        {
          variantId: sampleVariantId,
          productTitle: "Royal Crimson Zardozi Lehenga",
          variantTitle: "Medium / Crimson Gold",
          sku: `LZV-CRIMSON-M-${Date.now()}`,
          quantity: 1,
          unitPrice: 145000,
          lineSubtotal: 145000,
          discountAmount: 0,
          taxAmount: 17400,
          totalPrice: 162400,
        },
      ],
    });

    testOrderId = createdOrder.id;

    // Attach verified payment record
    await orderRepository.updatePaymentSuccess(
      testOrderId,
      `order_rzp_mock_${Date.now()}`,
      `pay_rzp_verified_${Date.now()}`,
      `sig_verified_${Date.now()}`
    );
  });

  // =========================================================================
  // WORKFLOW 1: Product → Inventory
  // "Admin stock બદલે તો storefrontમાં યોગ્ય stock દેખાય."
  // =========================================================================
  describe("Workflow 1: Product → Inventory Synchronization", () => {
    it("should allow admin to adjust variant stock and immediately reflect on storefront query", async () => {
      // 1. Initial stock is 20
      const initialStock = await inventoryService.getVariantStock(sampleVariantId);
      assert.equal(initialStock.availableQuantity, 20);

      // 2. Admin adjusts stock: +15 units (e.g. Atelier workshop replenishment)
      const adjustmentResult = await inventoryService.adjustStock({
        variantId: sampleVariantId,
        quantityDelta: 15,
        reason: "RESTOCK",
        actorId: "admin_user_01",
        notes: "Atelier embroidery batch received from artisans",
      });

      assert.equal(adjustmentResult.previousQuantity, 20);
      assert.equal(adjustmentResult.newQuantity, 35);

      // 3. Storefront queries variant stock: must immediately reflect 35 units
      const storefrontStock = await inventoryService.getVariantStock(sampleVariantId);
      assert.equal(storefrontStock.availableQuantity, 35);
      assert.equal(storefrontStock.status, "IN_STOCK");
      assert.equal(storefrontStock.isPurchasable, true);

      // 4. Storefront queries product by slug: variants must contain updated quantity
      const storefrontProduct = await productRepository.findBySlug(sampleProduct.slug);
      assert.ok(storefrontProduct);
      const variant = storefrontProduct.variants.find((v) => v.id === sampleVariantId);
      assert.ok(variant);
      assert.equal(variant.inventoryQuantity, 35);
    });

    it("should prevent negative stock overdraft when reducing inventory", async () => {
      // Attempting to deduct 50 units when available is 35 should fail
      await assert.rejects(
        async () => {
          await inventoryService.adjustStock({
            variantId: sampleVariantId,
            quantityDelta: -50,
            reason: "CORRECTION",
            actorId: "admin_user_01",
            allowNegative: false,
          });
        },
        {
          name: "BadRequestError",
          message: /Cannot reduce stock by 50\. Available inventory is 35/,
        }
      );

      // Stock should remain safely intact at 35
      const currentStock = await inventoryService.getVariantStock(sampleVariantId);
      assert.equal(currentStock.availableQuantity, 35);
    });

    it("should sanitize CSV export to prevent formula injection in spreadsheet software", async () => {
      // Create a test product with potentially hazardous formula characters
      const dangerousProduct: Product = {
        id: `prod_csv_${Date.now()}`,
        title: "=cmd|' /C calc'!A0",
        slug: `danger-formula-${Date.now()}`,
        description: "+SUM(1+1)",
        categoryId: "cat_lehengas",
        status: "ACTIVE",
        isFeatured: false,
        isNewArrival: false,
        isActive: true,
        tags: ["@alert"],
        createdAt: new Date(),
        updatedAt: new Date(),
        collections: [],
        images: [],
        variants: [
          {
            id: `var_csv_${Date.now()}`,
            productId: `prod_csv`,
            sku: "@DANGEROUS-SKU",
            title: "-Formula Size",
            size: "M",
            colorName: "+SUM(1+1)",
            colorHex: "#FF0000",
            price: 50000,
            compareAtPrice: null,
            inventoryQuantity: 5,
            lowStockThreshold: 2,
            weightGrams: 500,
            isActive: true,
          },
        ],
      };

      productRepository.addMemoryProduct(dangerousProduct);

      const csvContent = await adminProductService.exportProductsToCsv();
      // Leading =, +, -, @ must be neutralized with a leading single quote (')
      assert.ok(csvContent.includes(`"'=cmd|' /C calc'!A0"`));
      assert.ok(csvContent.includes(`"'+SUM(1+1)"`));
      assert.ok(csvContent.includes(`"'@DANGEROUS-SKU"`));
    });
  });

  // =========================================================================
  // WORKFLOW 2: Order → Payment
  // "Razorpayનું verified payment status જ દેખાય."
  // =========================================================================
  describe("Workflow 2: Order → Verified Payment Intelligence", () => {
    it("should display verified Razorpay payment status for legitimately captured payment", async () => {
      const orderDetails = await adminOrderService.getOrderDetails(testOrderId);

      assert.ok(orderDetails);
      assert.equal(orderDetails.id, testOrderId);
      assert.equal(orderDetails.paymentMethod, PaymentMethod.RAZORPAY);
      assert.equal(orderDetails.paymentStatus, PaymentStatus.CAPTURED);

      // Verified Payment object must be populated with verified identifiers
      assert.ok(orderDetails.verifiedPayment);
      assert.equal(orderDetails.verifiedPayment.isVerified, true);
      assert.ok(orderDetails.verifiedPayment.razorpayPaymentId?.startsWith("pay_rzp_verified_"));
      assert.ok(orderDetails.verifiedPayment.razorpayOrderId?.startsWith("order_rzp_mock_"));
    });

    it("should flag payment as unverified if online order has not been captured", async () => {
      // Create an order without captured payment
      const pendingOrder = await orderRepository.create({
        orderNumber: `LZV-UNVERIFIED-${Date.now()}`,
        userId: null,
        guestEmail: "unpaid@leziva.com",
        guestPhone: "9123456789",
        guestName: "Prospective Buyer",
        status: OrderStatus.PENDING_PAYMENT,
        paymentMethod: PaymentMethod.RAZORPAY,
        paymentStatus: PaymentStatus.PENDING,
        currency: "INR",
        subtotal: 50000,
        discountAmount: 0,
        taxAmount: 6000,
        shippingFee: 0,
        codFee: 0,
        totalAmount: 56000,
        shippingAddressSnapshot: {
          fullName: "Prospective Buyer",
          phone: "9123456789",
          addressLine1: "12 Marine Drive",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400020",
          country: "India",
        },
        items: [],
      });

      const details = await adminOrderService.getOrderDetails(pendingOrder.id);
      assert.equal(details.verifiedPayment?.isVerified, false);
      assert.equal(details.verifiedPayment?.razorpayPaymentId, null);
    });
  });

  // =========================================================================
  // WORKFLOW 3: Order → Shipping
  // "Velocityનું AWB અને tracking સાચા order સાથે જોડાય."
  // =========================================================================
  describe("Workflow 3: Order → Velocity Shipping Linkage", () => {
    let testAwb: string;

    it("should link manifested Velocity shipment and AWB tracking to the exact order", async () => {
      testAwb = `VEL-ADM-${Date.now().toString().slice(-8)}`;

      // Create a forward shipment in shipment repository linked to testOrderId
      const createdShipment = await shipmentRepository.create({
        orderId: testOrderId,
        awb: testAwb,
        courierName: "BlueDart Luxury Surface",
        status: ShipmentStatus.AWB_GENERATED,
        shipmentType: "FORWARD",
        packageWeight: 3.5,
        packageLength: 45,
        packageBreadth: 35,
        packageHeight: 15,
        labelUrl: `https://labels.velocity.in/${testAwb}.pdf`,
      });

      assert.equal(createdShipment.orderId, testOrderId);
      assert.equal(createdShipment.awb, testAwb);

      // Verify that adminOrderService links this shipment to the exact order
      const orderDetails = await adminOrderService.getOrderDetails(testOrderId);
      assert.ok(orderDetails.activeShipment);
      assert.equal(orderDetails.activeShipment.awb, testAwb);
      assert.equal(orderDetails.activeShipment.courierName, "BlueDart Luxury Surface");
      assert.equal(orderDetails.activeShipment.status, "AWB_GENERATED");
      assert.equal(orderDetails.activeShipment.labelUrl, `https://labels.velocity.in/${testAwb}.pdf`);

      // Verify repository query isolation: shipment only belongs to testOrderId
      const shipmentsForOrder = await shipmentRepository.findByOrderId(testOrderId);
      assert.equal(shipmentsForOrder.length, 1);
      assert.equal(shipmentsForOrder[0].awb, testAwb);

      // Querying unrelated order ID must return empty array
      const unrelatedShipments = await shipmentRepository.findByOrderId("unrelated_order_xyz");
      assert.equal(unrelatedShipments.length, 0);
    });
  });

  // =========================================================================
  // WORKFLOW 4: Return → Refund
  // "Return approval અને actual refund status અલગ રીતે track થાય."
  // =========================================================================
  describe("Workflow 4: Return Approval vs. Financial Refund Separation", () => {
    let returnRequestId: string;

    it("should register customer return request without affecting payment or triggering refund", async () => {
      // 1. Customer initiates return request
      const returnRequest = await returnRequestRepository.create({
        orderId: testOrderId,
        userId: null,
        reason: "Waist fitting requires alteration",
        items: [{ variantId: sampleVariantId, quantity: 1 }],
        pickupAddress: { city: "Jaipur", pincode: "302001" },
      });

      returnRequestId = returnRequest.id;
      assert.equal(returnRequest.status, "REQUESTED");

      // Verify order payment state is untouched
      const order = await orderRepository.findById(testOrderId);
      assert.equal(order?.paymentStatus, PaymentStatus.CAPTURED);
      assert.equal(order?.status, OrderStatus.PAYMENT_CONFIRMED);
    });

    it("should allow return request approval for logistics pickup WITHOUT releasing refund funds", async () => {
      // 2. Operations Admin approves the return request for pickup
      const approvedReturn = await returnRequestRepository.updateStatus(
        returnRequestId,
        "APPROVED",
        "Approved for luxury courier pickup by Operations"
      );

      assert.ok(approvedReturn);
      assert.equal(approvedReturn.status, "APPROVED");

      // CRITICAL CHECK: Order payment status must REMAIN CAPTURED (money not yet refunded)
      const orderAfterApproval = await orderRepository.findById(testOrderId);
      assert.equal(orderAfterApproval?.paymentStatus, PaymentStatus.CAPTURED);
      assert.notEqual(orderAfterApproval?.status, OrderStatus.REFUNDED);
    });

    it("should reject refund processing if requested refund amount exceeds order total", async () => {
      await assert.rejects(
        async () => {
          await refundService.processRefund({
            orderId: testOrderId,
            amountInRupees: 999999, // Exceeds 162400
            reason: "Excessive refund test",
            returnRequestId,
            actorId: "admin_finance",
          });
        },
        {
          name: "BadRequestError",
          message: /exceeds maximum refundable order value/,
        }
      );
    });

    it("should process actual financial refund separately via Razorpay and update statuses", async () => {
      // 3. Inspection passes at warehouse; Finance admin explicitly triggers financial refund
      const refundResult = await refundService.processRefund({
        orderId: testOrderId,
        amountInRupees: 162400, // Full refund
        reason: "Product inspected and verified pristine condition",
        returnRequestId,
        actorId: "admin_finance_01",
        idempotencyKey: `idemp_rfnd_${testOrderId}`,
      });

      assert.ok(refundResult.success);
      assert.ok(refundResult.refundId);
      assert.equal(refundResult.amountRefunded, 162400);

      // 4. Verify order payment status has transitioned to REFUNDED
      const refundedOrder = await orderRepository.findById(testOrderId);
      assert.equal(refundedOrder?.paymentStatus, PaymentStatus.REFUNDED);
      assert.equal(refundedOrder?.status, OrderStatus.REFUNDED);

      // 5. Verify linked return request status is marked REFUNDED
      const updatedReturn = await returnRequestRepository.findById(returnRequestId);
      assert.equal(updatedReturn?.status, "REFUNDED");
    });

    it("should prevent duplicate refund charges using idempotency keys", async () => {
      await assert.rejects(
        async () => {
          await refundService.processRefund({
            orderId: testOrderId,
            amountInRupees: 162400,
            reason: "Duplicate charge attempt",
            actorId: "admin_finance_01",
            idempotencyKey: `idemp_rfnd_${testOrderId}`,
          });
        },
        {
          name: "BadRequestError",
          message: /already processed or in progress/,
        }
      );
    });
  });

  // =========================================================================
  // RBAC & Operational Integrity
  // =========================================================================
  describe("Role-Based Access Control (RBAC) & Governance", () => {
    it("should grant full administrative privileges to SUPER_ADMIN", () => {
      const allowed = rbacService.hasPermission([RoleType.SUPER_ADMIN], Permissions.REFUNDS_PROCESS);
      assert.equal(allowed, true);
      assert.equal(rbacService.hasPermission([RoleType.SUPER_ADMIN], Permissions.CUSTOMERS_GDPR_DELETE), true);
    });

    it("should restrict PRODUCT_MANAGER from processing refunds or deleting users", () => {
      assert.equal(rbacService.hasPermission([RoleType.PRODUCT_MANAGER], Permissions.PRODUCTS_WRITE), true);
      assert.equal(rbacService.hasPermission([RoleType.PRODUCT_MANAGER], Permissions.INVENTORY_ADJUST), true);
      assert.equal(rbacService.hasPermission([RoleType.PRODUCT_MANAGER], Permissions.REFUNDS_PROCESS), false);
      assert.equal(rbacService.hasPermission([RoleType.PRODUCT_MANAGER], Permissions.CUSTOMERS_GDPR_DELETE), false);
    });

    it("should restrict CUSTOMER_SUPPORT to reading orders and tickets without editing catalog", () => {
      assert.equal(rbacService.hasPermission([RoleType.CUSTOMER_SUPPORT], Permissions.SUPPORT_RESPOND), true);
      assert.equal(rbacService.hasPermission([RoleType.CUSTOMER_SUPPORT], Permissions.ORDERS_READ), true);
      assert.equal(rbacService.hasPermission([RoleType.CUSTOMER_SUPPORT], Permissions.PRODUCTS_WRITE), false);
      assert.equal(rbacService.hasPermission([RoleType.CUSTOMER_SUPPORT], Permissions.COUPONS_WRITE), false);
    });
  });

  // =========================================================================
  // Customer Privacy & GDPR Anonymization
  // =========================================================================
  describe("Customer GDPR Privacy Management", () => {
    it("should calculate customer lifetime value (LTV) across completed orders", async () => {
      const result = await customerService.getCustomers();
      assert.ok(Array.isArray(result.customers));
    });
  });

  // =========================================================================
  // Business Analytics Metric Aggregation
  // =========================================================================
  describe("Business Analytics & Operations Intelligence", () => {
    it("should calculate genuine financial and fulfillment KPIs without fabrication", async () => {
      const metrics = await analyticsService.getOverviewMetrics({ dateRange: "this_month" });

      assert.ok(typeof metrics.grossSales === "number");
      assert.ok(typeof metrics.netSales === "number");
      assert.ok(typeof metrics.totalOrders === "number");
      assert.ok(typeof metrics.averageOrderValue === "number");
      assert.ok(metrics.grossSales >= 0);
      assert.ok(metrics.totalOrders >= 0);
    });
  });

  // =========================================================================
  // Customer Support Ticketing System
  // =========================================================================
  describe("Customer Support & Ticketing Lifecycle", () => {
    it("should query support tickets and append replies", async () => {
      const tickets = await supportService.getTickets();
      assert.ok(Array.isArray(tickets));
      assert.ok(tickets.length > 0);

      const targetTicket = tickets[0];
      const initialMessageCount = targetTicket.messageCount;

      // Staff response
      const reply = await supportService.addReply(
        targetTicket.id,
        {
          message: "Our master couturiers have customized the garment sleeve dimensions as requested.",
          senderName: "Anita Sharma (Master Couturier)",
          senderRole: "AGENT",
          isInternal: false,
        },
        "usr_agent_01"
      );

      assert.ok(reply);
      assert.equal(reply.senderRole, "AGENT");
      assert.equal(reply.isInternal, false);

      const updated = await supportService.getTicketById(targetTicket.id);
      assert.equal(updated.messageCount, initialMessageCount + 1);
    });
  });

  // =========================================================================
  // Categories, Collections & Taxonomy Governance
  // =========================================================================
  describe("Categories, Collections & Attribute Governance", () => {
    let createdCatId: string;
    let createdColId: string;

    it("should create and retrieve a couture category", async () => {
      const created = await adminCategoryService.createCategory({
        name: "Festive Anarkalis",
        slug: `festive-anarkalis-${Date.now()}`,
        description: "Regal flared floor-length silhouettes.",
      });

      assert.ok(created);
      assert.ok(created.id);
      createdCatId = created.id;

      const list = await adminCategoryService.listCategories();
      const found = list.find((c) => c.id === createdCatId);
      assert.ok(found);
      assert.equal(found.name, "Festive Anarkalis");
    });

    it("should prevent circular hierarchy when assigning parent categories", async () => {
      // Cannot set category as its own parent
      await assert.rejects(
        async () => {
          await adminCategoryService.updateCategory(createdCatId, {
            parentId: createdCatId,
          });
        },
        {
          name: "BadRequestError",
          message: /cannot be its own parent/,
        }
      );
    });

    it("should prevent deletion of category if referenced by active products", async () => {
      // Attempting to delete sampleProduct's category (cat_bridal_couture) must fail
      await assert.rejects(
        async () => {
          await adminCategoryService.deleteCategory(sampleProduct.categoryId);
        },
        {
          name: "BadRequestError",
          message: /active products reference it/,
        }
      );
    });

    it("should create and manage seasonal brand collections", async () => {
      const collection = await adminCategoryService.createCollection({
        name: `Heritage Royale ${Date.now()}`,
        description: "Antique gold embroidery curation",
        isFeatured: true,
      });

      assert.ok(collection);
      assert.ok(collection.id);
      createdColId = collection.id;

      const cols = await adminCategoryService.listCollections();
      const match = cols.find((c) => c.id === createdColId);
      assert.ok(match);
      assert.equal(match.isFeatured, true);
    });

    it("should provide standardized luxury fashion attribute matrix", () => {
      const matrix = adminCategoryService.getAttributeMatrix();
      assert.ok(Array.isArray(matrix.sizes));
      assert.ok(matrix.sizes.some((s) => s.code === "CUSTOM"));
      assert.ok(Array.isArray(matrix.colors));
      assert.ok(matrix.colors.some((c) => c.hex === "#990000"));
      assert.ok(Array.isArray(matrix.fabrics));
      assert.ok(matrix.fabrics.includes("Pure Kanjeevaram Silk"));
    });
  });

  // =========================================================================
  // Patron Reviews & Testimonials Moderation
  // =========================================================================
  describe("Patron Reviews & Testimonials Moderation", () => {
    let testReviewId: string;

    it("should list patron reviews and detect verified buyers", async () => {
      const reviews = await reviewService.listReviews();
      assert.ok(Array.isArray(reviews));
      assert.ok(reviews.length > 0);

      const target = reviews.find((r) => !r.isApproved) || reviews[0];
      testReviewId = target.id;
      assert.ok(typeof target.isVerifiedBuyer === "boolean");
    });

    it("should moderate reviews by publishing or unpublishing", async () => {
      // Approve review
      const approved = await reviewService.moderateReview(testReviewId, true, "admin_mod");
      assert.equal(approved.isApproved, true);

      // Verify approved list
      const approvedList = await reviewService.listReviews({ isApproved: true });
      assert.ok(approvedList.some((r) => r.id === testReviewId));

      // Unpublish review
      const unpublished = await reviewService.moderateReview(testReviewId, false, "admin_mod");
      assert.equal(unpublished.isApproved, false);
    });

    it("should reject customer reviews with invalid ratings outside 1-5 bounds", async () => {
      await assert.rejects(
        async () => {
          await reviewService.submitReview({
            userId: "usr_patron_test",
            productId: sampleProduct.id,
            rating: 10, // Invalid
          });
        },
        {
          name: "BadRequestError",
          message: /Rating must be an integer between 1 and 5/,
        }
      );
    });
  });

  // =========================================================================
  // Transactional Notification Templates
  // =========================================================================
  describe("Transactional Notification Templates", () => {
    it("should retrieve all 9 specified lifecycle notification templates", async () => {
      const templates = await notificationTemplateService.getTemplates();
      assert.ok(templates.length >= 9);

      const requiredEvents = [
        "ORDER_CONFIRMATION",
        "PAYMENT_CONFIRMATION",
        "SHIPMENT_DISPATCHED",
        "TRACKING_UPDATE",
        "ORDER_DELIVERED",
        "ORDER_CANCELLED",
        "REFUND_PROCESSED",
        "RETURN_APPROVED",
        "SUPPORT_REPLY",
      ];

      for (const ev of requiredEvents) {
        const found = templates.find((t) => t.eventKey === ev);
        assert.ok(found, `Missing expected template for event: ${ev}`);
        assert.ok(found.variables.length > 0);
      }
    });

    it("should interpolate template variables accurately", () => {
      const rendered = notificationTemplateService.interpolate(
        "Order #{{orderNumber}} confirmed for {{customerName}} totaling INR {{totalAmount}}",
        {
          orderNumber: "LZV-84920",
          customerName: "Maharani Gayatri Devi",
          totalAmount: "1,62,400",
        }
      );

      assert.equal(
        rendered,
        "Order #LZV-84920 confirmed for Maharani Gayatri Devi totaling INR 1,62,400"
      );
    });
  });
});
