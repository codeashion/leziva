import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";

// Repositories
import { shipmentRepository } from "../server/repositories/shipment.repository";
import { returnRequestRepository } from "../server/repositories/return-request.repository";
import { orderRepository } from "../server/repositories/order.repository";

// Velocity Integration Services
import { velocityConfigService } from "../server/integrations/velocity/velocity.config";
import { velocityAuthService } from "../server/integrations/velocity/velocity-auth.service";
import { velocityWarehouseService } from "../server/integrations/velocity/velocity-warehouse.service";
import { velocityServiceabilityService } from "../server/integrations/velocity/velocity-serviceability.service";
import { velocityShipmentService } from "../server/integrations/velocity/velocity-shipment.service";
import { velocityTrackingService } from "../server/integrations/velocity/velocity-tracking.service";
import { velocityCancellationService } from "../server/integrations/velocity/velocity-cancellation.service";
import { velocityReverseService } from "../server/integrations/velocity/velocity-reverse.service";
import { velocityReportingService } from "../server/integrations/velocity/velocity-reporting.service";
import { velocityQueueService } from "../server/integrations/velocity/velocity-queue.service";
import {
  ShipmentStatus,
  ShipmentType,
  ReturnRequestStatus,
} from "../server/integrations/velocity/velocity.types";
import { OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";

describe("Phase 5: Velocity Shipping API Integration Comprehensive Suite", () => {
  let testOrderId = "";
  let testOrderNumber = "";

  before(async () => {
    // Seed a valid test order in order repository
    const created = await orderRepository.create({
      orderNumber: `LZV-${Date.now()}-TST1`,
      userId: null,
      guestEmail: "patron@leziva.com",
      guestPhone: "9876543210",
      guestName: "Ananya Singhania",
      status: OrderStatus.PAYMENT_CONFIRMED,
      paymentMethod: PaymentMethod.RAZORPAY,
      paymentStatus: PaymentStatus.CAPTURED,
      currency: "INR",
      subtotal: 18500,
      discountAmount: 0,
      taxAmount: 2220,
      shippingFee: 0,
      codFee: 0,
      totalAmount: 20720,
      shippingAddressSnapshot: {
        fullName: "Ananya Singhania",
        phone: "9876543210",
        addressLine1: "14 Altamount Road, Penthouse B",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400026",
        country: "India",
      },
      items: [
        {
          variantId: "var_saree_01_red",
          productId: "prod_saree_01",
          productTitle: "Varanasi Katan Silk Saree",
          variantTitle: "Red / Free Size",
          sku: "LZV-SAR-KAT-001",
          unitPrice: 18500,
          quantity: 1,
          lineSubtotal: 18500,
          discountAmount: 0,
          taxAmount: 2220,
          totalPrice: 20720,
        },
      ],
    });

    testOrderId = created.id;
    testOrderNumber = created.orderNumber;
  });

  after(() => {
    velocityQueueService.stopWorker();
  });

  // ==========================================================================
  // 1. Configuration & Security
  // ==========================================================================
  describe("1. Configuration & Secret Redaction", () => {
    it("should load server configuration with sanitized values", () => {
      const config = velocityConfigService.getConfig();
      assert.ok(config.baseUrl.includes("velocity.in") || config.baseUrl.includes("http"));
      assert.ok(config.warehouseId.length > 0);
      assert.ok(config.warehousePincode.length === 6);
    });

    it("should redact passwords and tokens from diagnostic logs", () => {
      const sanitized = velocityConfigService.getSanitizedConfig();
      assert.equal(sanitized.hasPassword, true);
      assert.ok(!("password" in sanitized));
    });
  });

  // ==========================================================================
  // 2. Authentication & Token Management
  // ==========================================================================
  describe("2. Authentication & 24h Token Lifecycle", () => {
    it("should acquire an auth token and track expiration", async () => {
      const token = await velocityAuthService.getAuthToken();
      assert.ok(typeof token === "string" && token.length > 10);
      const isExpired = velocityAuthService.isTokenExpired();
      assert.equal(isExpired, false);
    });

    it("should return the cached token on subsequent calls without refetching", async () => {
      const token1 = await velocityAuthService.getAuthToken();
      const token2 = await velocityAuthService.getAuthToken();
      assert.equal(token1, token2);
    });

    it("should invalidate the token on demand to handle 401 recovery", async () => {
      await velocityAuthService.invalidateToken();
      const isExpired = velocityAuthService.isTokenExpired();
      assert.equal(isExpired, true);
      const newToken = await velocityAuthService.getAuthToken();
      assert.ok(typeof newToken === "string");
    });
  });

  // ==========================================================================
  // 3. Warehouse Configuration & Diagnostics
  // ==========================================================================
  describe("3. Warehouse Configuration & Diagnostics", () => {
    it("should return operational warehouse diagnostics", async () => {
      const diag = await velocityWarehouseService.getWarehouseDiagnostics();
      assert.equal(diag.isConfigured, true);
      assert.equal(diag.pincode, "395007");
      assert.equal(diag.city, "Surat");
    });

    it("should register or validate atelier warehouse", async () => {
      const res = await velocityWarehouseService.registerWarehouse();
      assert.equal(Boolean(res.status), true);
      assert.ok(res.warehouse_id || res.data?.warehouse_id);
    });
  });

  // ==========================================================================
  // 4. PIN Code Serviceability Check
  // ==========================================================================
  describe("4. PIN Code Serviceability (Prepaid & COD)", () => {
    it("should validate destination PIN code format", async () => {
      await assert.rejects(
        () =>
          velocityServiceabilityService.checkServiceability({
            to: "123", // Invalid length
            payment_mode: "prepaid",
            shipment_type: "forward",
          }),
        /valid 6-digit Indian PIN code/
      );
    });

    it("should return serviceable status and eligible couriers for valid metro PIN", async () => {
      const result = await velocityServiceabilityService.checkServiceability({
        to: "400001",
        payment_mode: "prepaid",
        shipment_type: "forward",
      });

      assert.equal(result.is_serviceable, true);
      assert.ok(Array.isArray(result.couriers));
      assert.ok(result.couriers!.length > 0);
      assert.ok(result.couriers![0].courier_name.length > 0);
    });

    it("should distinguish COD availability from Prepaid availability", async () => {
      const codResult = await velocityServiceabilityService.checkServiceability({
        to: "400001",
        payment_mode: "cod",
        shipment_type: "forward",
      });

      assert.equal(codResult.is_serviceable, true);
      assert.ok(codResult.couriers?.some((c) => c.cod_available === true));
    });

    it("should return unserviceable for invalid or unmapped PIN codes", async () => {
      const result = await velocityServiceabilityService.checkServiceability({
        to: "999999",
        payment_mode: "prepaid",
        shipment_type: "forward",
      });

      assert.equal(result.is_serviceable, false);
      assert.equal(result.couriers?.length || 0, 0);
    });
  });

  // ==========================================================================
  // 5. Forward Shipment Creation (One-Step Orchestration & Deduplication)
  // ==========================================================================
  describe("5. Forward Shipment Creation & Idempotency", () => {
    it("should reject forward shipment for unpaid prepaid order", async () => {
      const unpaid = await orderRepository.create({
        orderNumber: `LZV-UNPAID-${Date.now()}`,
        userId: null,
        guestEmail: "unpaid@leziva.com",
        guestPhone: "9876543210",
        guestName: "Customer",
        status: OrderStatus.PENDING_PAYMENT,
        paymentMethod: PaymentMethod.RAZORPAY,
        paymentStatus: PaymentStatus.PENDING,
        currency: "INR",
        subtotal: 5000,
        discountAmount: 0,
        taxAmount: 600,
        shippingFee: 0,
        codFee: 0,
        totalAmount: 5600,
        shippingAddressSnapshot: {
          fullName: "Customer",
          phone: "9876543210",
          addressLine1: "Street",
          city: "Delhi",
          state: "Delhi",
          pincode: "110001",
          country: "India",
        },
        items: [
          {
            variantId: "var_01",
            productId: "prod_01",
            productTitle: "Kurti",
            variantTitle: "Free Size",
            sku: "SKU-01",
            unitPrice: 5000,
            quantity: 1,
            lineSubtotal: 5000,
            discountAmount: 0,
            taxAmount: 600,
            totalPrice: 5600,
          },
        ],
      });

      await assert.rejects(
        () => velocityShipmentService.createForwardShipment({ orderId: unpaid.id }),
        /Prepaid order.*payment has not been verified.*Cannot manifest forward shipment/
      );
    });

    it("should create and manifest forward shipment via one-step orchestration", async () => {
      const result = await velocityShipmentService.createForwardShipment({
        orderId: testOrderId,
      });

      assert.ok(result.shipmentId);
      assert.equal(result.orderNumber, testOrderNumber);
      assert.ok(result.awb.startsWith("VEL"));
      assert.ok(result.courierName.length > 0);
      assert.ok(result.labelUrl?.includes(".pdf"));
      assert.equal(result.status, ShipmentStatus.AWB_GENERATED);

      // Verify persisted in DB repository
      const dbShipment = await shipmentRepository.findById(result.shipmentId);
      assert.ok(dbShipment);
      assert.equal(dbShipment?.awb, result.awb);
      assert.equal(dbShipment?.shipmentType, ShipmentType.FORWARD);
    });

    it("should prevent duplicate shipment creation and return existing active shipment", async () => {
      const duplicateResult = await velocityShipmentService.createForwardShipment({
        orderId: testOrderId,
      });

      const existingShipments = await shipmentRepository.findByOrderId(testOrderId);
      assert.equal(existingShipments.length, 1);
      assert.equal(duplicateResult.awb, existingShipments[0].awb);
    });
  });

  // ==========================================================================
  // 6. Order Tracking Telemetry
  // ==========================================================================
  describe("6. Live Tracking Telemetry & Milestone Synchronization", () => {
    it("should retrieve tracking events for valid AWB", async () => {
      const shipments = await shipmentRepository.findByOrderId(testOrderId);
      const awb = shipments[0].awb!;

      const tracking = await velocityTrackingService.getTrackingForAwb(awb);
      assert.ok(tracking);
      assert.equal(tracking?.awb, awb);
      assert.ok(tracking?.activities.length > 0);
      assert.ok(tracking?.origin?.includes("Surat"));
    });

    it("should refresh tracking on demand and update shipment state", async () => {
      const shipments = await shipmentRepository.findByOrderId(testOrderId);
      const shipmentId = shipments[0].id;

      const refreshResult = await velocityTrackingService.refreshShipmentTracking(shipmentId);
      assert.ok(refreshResult);
      assert.equal(refreshResult.awb, shipments[0].awb);

      const updated = await shipmentRepository.findById(shipmentId);
      assert.ok(updated?.lastTrackingRefresh);
    });
  });

  // ==========================================================================
  // 7. Shipment Cancellation
  // ==========================================================================
  describe("7. Carrier Shipment Cancellation & Safeguards", () => {
    it("should reject batch cancellation exceeding 50 AWBs", async () => {
      const oversizedList = Array.from({ length: 51 }, (_, i) => `VEL${1000000000 + i}`);
      await assert.rejects(
        () => velocityCancellationService.cancelBatch(oversizedList),
        /maximum of 50 AWBs per batch cancellation/
      );
    });

    it("should cancel eligible shipment and synchronize status with carrier", async () => {
      const shipments = await shipmentRepository.findByOrderId(testOrderId);
      const shipmentId = shipments[0].id;

      // Ensure shipment is in eligible state (AWB_GENERATED) prior to carrier cancellation call
      await shipmentRepository.updateStatus(shipmentId, ShipmentStatus.AWB_GENERATED);

      const cancelResult = await velocityCancellationService.cancelShipment(shipmentId, "Customer requested cancellation");
      assert.equal(cancelResult.carrierAcknowledged, true);
      assert.equal(cancelResult.status, ShipmentStatus.CANCELLED);

      const dbShipment = await shipmentRepository.findById(shipmentId);
      assert.equal(dbShipment?.status, ShipmentStatus.CANCELLED);
    });

    it("should reject cancellation of shipments in uncancelable terminal states", () => {
      const eligibility = velocityCancellationService.isEligibleForCancellation(ShipmentStatus.DELIVERED);
      assert.equal(eligibility.eligible, false);
      assert.ok(eligibility.reason?.includes("DELIVERED"));
    });
  });

  // ==========================================================================
  // 8. Returns & Reverse Logistics Orchestration
  // ==========================================================================
  describe("8. Returns & Reverse Logistics Orchestration", () => {
    let testReturnRequestId: string;

    before(async () => {
      // Create an approved return request
      const returnReq = await returnRequestRepository.create({
        orderId: testOrderId,
        reason: "Size alteration requested for atelier fit",
        status: ReturnRequestStatus.APPROVED,
        pickupAddress: {
          fullName: "Ananya Singhania",
          phone: "9876543210",
          addressLine1: "14 Altamount Road, Penthouse B",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400026",
          country: "India",
        },
        items: [
          {
            productName: "Varanasi Katan Silk Saree",
            sku: "LZV-SAR-KAT-001",
            quantity: 1,
            unitPrice: 18500,
          },
        ],
      });
      testReturnRequestId = returnReq.id;
    });

    it("should orchestrate reverse pickup for approved return", async () => {
      const result = await velocityReverseService.orchestrateReversePickup(testReturnRequestId);

      assert.ok(result.shipmentId);
      assert.ok(result.awb.startsWith("REV"));
      assert.ok(result.courierName.includes("Reverse") || result.courierName.includes("Delhivery"));
      assert.equal(result.status, ShipmentStatus.PICKUP_PENDING);

      const updatedReq = await returnRequestRepository.findById(testReturnRequestId);
      assert.equal(updatedReq?.status, ReturnRequestStatus.PICKUP_SCHEDULED);

      const dbShipment = await shipmentRepository.findById(result.shipmentId);
      assert.equal(dbShipment?.shipmentType, ShipmentType.REVERSE);
    });

    it("should prevent duplicate reverse shipment for the same return request", async () => {
      const duplicate = await velocityReverseService.orchestrateReversePickup(testReturnRequestId);
      const existing = await shipmentRepository.findByOrderId(testOrderId);
      const reverseShipments = existing.filter((s) => s.shipmentType === ShipmentType.REVERSE);
      assert.equal(reverseShipments.length, 1);
      assert.equal(duplicate.awb, reverseShipments[0].awb);
    });
  });

  // ==========================================================================
  // 9. Reporting & Reconciliation
  // ==========================================================================
  describe("9. Activity Reports & Database Reconciliation", () => {
    it("should fetch summary reports from Velocity", async () => {
      const items = await velocityReportingService.getReport("2026-10-01 00:00:00", "2026-10-13 23:59:59", "forward");
      assert.ok(Array.isArray(items));
    });

    it("should reconcile carrier activity and report discrepancies", async () => {
      const report = await velocityReportingService.reconcileShipments(
        "2026-10-01 00:00:00",
        "2026-10-13 23:59:59",
        "forward",
        true
      );

      assert.equal(report.shipmentType, "forward");
      assert.ok(typeof report.totalReportedByCarrier === "number");
      assert.ok(Array.isArray(report.discrepancies));
    });
  });

  // ==========================================================================
  // 10. Asynchronous Queue & Ambiguous Timeout Handling
  // ==========================================================================
  describe("10. Background Processing & Queue Resilience", () => {
    it("should enqueue a background shipment job", async () => {
      const asyncOrder = await orderRepository.create({
        orderNumber: `LZV-ASYNC-${Date.now()}`,
        userId: null,
        guestEmail: "async@leziva.com",
        guestPhone: "9876543210",
        guestName: "Patron",
        status: OrderStatus.PAYMENT_CONFIRMED,
        paymentMethod: PaymentMethod.RAZORPAY,
        paymentStatus: PaymentStatus.CAPTURED,
        currency: "INR",
        subtotal: 10000,
        discountAmount: 0,
        taxAmount: 1200,
        shippingFee: 0,
        codFee: 0,
        totalAmount: 11200,
        shippingAddressSnapshot: {
          fullName: "Patron",
          phone: "9876543210",
          addressLine1: "Marine Drive",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400020",
          country: "India",
        },
        items: [
          {
            variantId: "var_02",
            productId: "prod_02",
            productTitle: "Anarkali",
            variantTitle: "Free Size",
            sku: "SKU-02",
            unitPrice: 10000,
            quantity: 1,
            lineSubtotal: 10000,
            discountAmount: 0,
            taxAmount: 1200,
            totalPrice: 11200,
          },
        ],
      });

      const job = await velocityQueueService.enqueueShipment(asyncOrder.id);
      assert.ok(job.id);
      assert.equal(job.orderId, asyncOrder.id);
      assert.equal(job.status, "QUEUED");
    });
  });
});
