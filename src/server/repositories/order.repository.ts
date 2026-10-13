import { prisma } from "@/server/db/prisma";
import { logger } from "@/utils/logger";
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";

export interface StoredOrderItem {
  id: string;
  orderId: string;
  variantId: string;
  productId: string | null;
  productTitle: string;
  variantTitle: string;
  sku: string;
  selectedSize: string | null;
  selectedColor: string | null;
  unitPrice: number;
  quantity: number;
  lineSubtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalPrice: number;
}

export interface StoredPayment {
  id: string;
  orderId: string;
  gateway: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  attemptCount: number;
  idempotencyKey: string | null;
  verifiedAt: Date | null;
  failureCode: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredOrderStatusHistory {
  id: string;
  orderId: string;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  actorType: string;
  actorId: string | null;
  reason: string | null;
  createdAt: Date;
}

export interface StoredOrder {
  id: string;
  orderNumber: string;
  userId: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  guestName: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingFee: number;
  codFee: number;
  totalAmount: number;
  currency: string;
  notes: string | null;
  shippingAddressSnapshot: Record<string, unknown>;
  billingAddressSnapshot: Record<string, unknown> | null;
  couponCode: string | null;
  couponId: string | null;
  idempotencyKey: string | null;
  shippingAddressId: string | null;
  billingAddressId: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: StoredOrderItem[];
  payments: StoredPayment[];
  statusHistory: StoredOrderStatusHistory[];
}

export class OrderRepository {
  private memoryOrders = new Map<string, StoredOrder>();

  async findById(orderId: string): Promise<StoredOrder | null> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payments: true,
          statusHistory: { orderBy: { createdAt: "asc" } },
        },
      });
      if (order) return this.mapPrismaOrder(order);
    } catch {
      logger.info("[OrderRepository] Using memory fallback for findById");
    }
    return this.memoryOrders.get(orderId) || null;
  }

  async findByOrderNumber(orderNumber: string): Promise<StoredOrder | null> {
    try {
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
          items: true,
          payments: true,
          statusHistory: { orderBy: { createdAt: "asc" } },
        },
      });
      if (order) return this.mapPrismaOrder(order);
    } catch {
      logger.info("[OrderRepository] Using memory fallback for findByOrderNumber");
    }

    for (const ord of this.memoryOrders.values()) {
      if (ord.orderNumber === orderNumber) return ord;
    }
    return null;
  }

  async findByIdempotencyKey(key: string): Promise<StoredOrder | null> {
    try {
      const order = await prisma.order.findUnique({
        where: { idempotencyKey: key },
        include: {
          items: true,
          payments: true,
          statusHistory: true,
        },
      });
      if (order) return this.mapPrismaOrder(order);
    } catch {
      logger.info("[OrderRepository] Using memory fallback for findByIdempotencyKey");
    }

    for (const ord of this.memoryOrders.values()) {
      if (ord.idempotencyKey === key) return ord;
    }
    return null;
  }

  async findByUserId(userId: string): Promise<StoredOrder[]> {
    try {
      const orders = await prisma.order.findMany({
        where: { userId },
        include: {
          items: true,
          payments: true,
          statusHistory: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      });
      return orders.map((o) => this.mapPrismaOrder(o));
    } catch {
      logger.info("[OrderRepository] Using memory fallback for findByUserId");
      return Array.from(this.memoryOrders.values())
        .filter((o) => o.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  async create(data: {
    orderNumber: string;
    userId: string | null;
    guestEmail: string | null;
    guestPhone: string | null;
    guestName: string | null;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    shippingFee: number;
    codFee: number;
    totalAmount: number;
    currency: string;
    notes?: string | null;
    shippingAddressSnapshot: Record<string, unknown>;
    billingAddressSnapshot?: Record<string, unknown> | null;
    couponCode?: string | null;
    couponId?: string | null;
    idempotencyKey?: string | null;
    shippingAddressId?: string | null;
    billingAddressId?: string | null;
    items: Array<{
      variantId: string;
      productId?: string | null;
      productTitle: string;
      variantTitle: string;
      sku: string;
      selectedSize?: string | null;
      selectedColor?: string | null;
      unitPrice: number;
      quantity: number;
      lineSubtotal: number;
      discountAmount: number;
      taxAmount: number;
      totalPrice: number;
    }>;
    payment?: {
      gateway: string;
      razorpayOrderId?: string | null;
      amount: number;
      currency: string;
      status: PaymentStatus;
    };
  }): Promise<StoredOrder> {
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const items: StoredOrderItem[] = data.items.map((it, idx) => ({
      id: `oit_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`,
      orderId,
      variantId: it.variantId,
      productId: it.productId || null,
      productTitle: it.productTitle,
      variantTitle: it.variantTitle,
      sku: it.sku,
      selectedSize: it.selectedSize || null,
      selectedColor: it.selectedColor || null,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      lineSubtotal: it.lineSubtotal,
      discountAmount: it.discountAmount,
      taxAmount: it.taxAmount,
      totalPrice: it.totalPrice,
    }));

    const payments: StoredPayment[] = data.payment
      ? [
          {
            id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            orderId,
            gateway: data.payment.gateway,
            razorpayOrderId: data.payment.razorpayOrderId || null,
            razorpayPaymentId: null,
            razorpaySignature: null,
            amount: data.payment.amount,
            currency: data.payment.currency,
            status: data.payment.status,
            attemptCount: 1,
            idempotencyKey: data.idempotencyKey || null,
            verifiedAt: null,
            failureCode: null,
            failureReason: null,
            createdAt: now,
            updatedAt: now,
          },
        ]
      : [];

    const statusHistory: StoredOrderStatusHistory[] = [
      {
        id: `osh_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        orderId,
        previousStatus: null,
        newStatus: data.status,
        actorType: "SYSTEM",
        actorId: data.userId || null,
        reason: "Order created",
        createdAt: now,
      },
    ];

    const storedOrder: StoredOrder = {
      id: orderId,
      orderNumber: data.orderNumber,
      userId: data.userId,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone,
      guestName: data.guestName,
      status: data.status,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      subtotal: data.subtotal,
      discountAmount: data.discountAmount,
      taxAmount: data.taxAmount,
      shippingFee: data.shippingFee,
      codFee: data.codFee,
      totalAmount: data.totalAmount,
      currency: data.currency,
      notes: data.notes || null,
      shippingAddressSnapshot: data.shippingAddressSnapshot,
      billingAddressSnapshot: data.billingAddressSnapshot || null,
      couponCode: data.couponCode || null,
      couponId: data.couponId || null,
      idempotencyKey: data.idempotencyKey || null,
      shippingAddressId: data.shippingAddressId || null,
      billingAddressId: data.billingAddressId || null,
      createdAt: now,
      updatedAt: now,
      items,
      payments,
      statusHistory,
    };

    try {
      const dbOrder = await prisma.order.create({
        data: {
          id: orderId,
          orderNumber: data.orderNumber,
          userId: data.userId,
          guestEmail: data.guestEmail,
          guestPhone: data.guestPhone,
          guestName: data.guestName,
          status: data.status,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
          subtotal: data.subtotal,
          discountAmount: data.discountAmount,
          taxAmount: data.taxAmount,
          shippingFee: data.shippingFee,
          codFee: data.codFee,
          totalAmount: data.totalAmount,
          currency: data.currency,
          notes: data.notes || null,
          shippingAddressSnapshot: data.shippingAddressSnapshot as Prisma.InputJsonValue,
          billingAddressSnapshot: data.billingAddressSnapshot
            ? (data.billingAddressSnapshot as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          couponCode: data.couponCode || null,
          couponId: data.couponId || null,
          idempotencyKey: data.idempotencyKey || null,
          shippingAddressId: data.shippingAddressId || null,
          billingAddressId: data.billingAddressId || null,
          items: {
            create: data.items.map((it) => ({
              variantId: it.variantId,
              productId: it.productId || null,
              productTitle: it.productTitle,
              variantTitle: it.variantTitle,
              sku: it.sku,
              selectedSize: it.selectedSize || null,
              selectedColor: it.selectedColor || null,
              unitPrice: it.unitPrice,
              quantity: it.quantity,
              lineSubtotal: it.lineSubtotal,
              discountAmount: it.discountAmount,
              taxAmount: it.taxAmount,
              totalPrice: it.totalPrice,
            })),
          },
          payments: data.payment
            ? {
                create: {
                  gateway: data.payment.gateway,
                  razorpayOrderId: data.payment.razorpayOrderId || null,
                  amount: data.payment.amount,
                  currency: data.payment.currency,
                  status: data.payment.status,
                },
              }
            : undefined,
          statusHistory: {
            create: {
              previousStatus: null,
              newStatus: data.status,
              actorType: "SYSTEM",
              actorId: data.userId || null,
              reason: "Order created",
            },
          },
        },
        include: {
          items: true,
          payments: true,
          statusHistory: true,
        },
      });

      const mapped = this.mapPrismaOrder(dbOrder);
      this.memoryOrders.set(orderId, mapped);
      return mapped;
    } catch {
      logger.info("[OrderRepository] Using memory fallback for create");
      this.memoryOrders.set(orderId, storedOrder);
      return storedOrder;
    }
  }

  async updateStatus(
    orderId: string,
    newStatus: OrderStatus,
    reason: string = "Status updated",
    actorType: string = "SYSTEM",
    actorId?: string | null
  ): Promise<StoredOrder | null> {
    const order = await this.findById(orderId);
    if (!order) return null;

    const previousStatus = order.status;
    const historyEntry: StoredOrderStatusHistory = {
      id: `osh_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      orderId,
      previousStatus,
      newStatus,
      actorType,
      actorId: actorId || null,
      reason,
      createdAt: new Date(),
    };

    try {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: { status: newStatus },
        }),
        prisma.orderStatusHistory.create({
          data: {
            orderId,
            previousStatus,
            newStatus,
            actorType,
            actorId: actorId || null,
            reason,
          },
        }),
      ]);
    } catch {
      // Memory fallback
    }

    order.status = newStatus;
    order.updatedAt = new Date();
    order.statusHistory.push(historyEntry);
    this.memoryOrders.set(orderId, order);
    return order;
  }

  async findMany(options: {
    search?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<StoredOrder[]> {
    try {
      const where: Prisma.OrderWhereInput = {};
      if (options.status) where.status = options.status;
      if (options.paymentStatus) where.paymentStatus = options.paymentStatus;
      if (options.paymentMethod) where.paymentMethod = options.paymentMethod;
      if (options.startDate || options.endDate) {
        where.createdAt = {};
        if (options.startDate) where.createdAt.gte = options.startDate;
        if (options.endDate) where.createdAt.lte = options.endDate;
      }
      if (options.search) {
        where.OR = [
          { orderNumber: { contains: options.search, mode: "insensitive" } },
          { guestName: { contains: options.search, mode: "insensitive" } },
          { guestEmail: { contains: options.search, mode: "insensitive" } },
        ];
      }

      const list = await prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: options.limit || 100,
        include: {
          items: true,
          payments: true,
          statusHistory: { orderBy: { createdAt: "asc" } },
        },
      });

      if (list.length > 0) {
        return list.map((o) => this.mapPrismaOrder(o));
      }
    } catch {
      logger.info("[OrderRepository] Using memory fallback for findMany");
    }

    let results = Array.from(this.memoryOrders.values());
    if (options.status) results = results.filter((o) => o.status === options.status);
    if (options.paymentStatus) results = results.filter((o) => o.paymentStatus === options.paymentStatus);
    if (options.paymentMethod) results = results.filter((o) => o.paymentMethod === options.paymentMethod);
    if (options.startDate) results = results.filter((o) => new Date(o.createdAt) >= options.startDate!);
    if (options.endDate) results = results.filter((o) => new Date(o.createdAt) <= options.endDate!);
    if (options.search) {
      const s = options.search.toLowerCase();
      results = results.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(s) ||
          (o.guestName && o.guestName.toLowerCase().includes(s)) ||
          (o.guestEmail && o.guestEmail.toLowerCase().includes(s))
      );
    }

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return results.slice(0, options.limit || 100);
  }

  async update(orderId: string, data: Partial<StoredOrder>): Promise<StoredOrder | null> {
    try {
      const dbUpdated = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: data.status,
          paymentStatus: data.paymentStatus,
          notes: data.notes,
        },
        include: {
          items: true,
          payments: true,
          statusHistory: true,
        },
      });
      if (dbUpdated) return this.mapPrismaOrder(dbUpdated);
    } catch {
      // Memory fallback
    }

    const order = this.memoryOrders.get(orderId);
    if (!order) return null;

    if (data.status) order.status = data.status;
    if (data.paymentStatus) order.paymentStatus = data.paymentStatus;
    if (data.notes !== undefined) order.notes = data.notes;
    order.updatedAt = new Date();
    this.memoryOrders.set(orderId, order);
    return order;
  }

  async updatePaymentSuccess(
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<StoredOrder | null> {
    const order = await this.findById(orderId);
    if (!order) return null;

    try {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: PaymentStatus.CAPTURED,
            status: OrderStatus.PAYMENT_CONFIRMED,
          },
        }),
        prisma.payment.updateMany({
          where: { orderId },
          data: {
            status: PaymentStatus.CAPTURED,
            razorpayPaymentId,
            razorpaySignature,
            verifiedAt: new Date(),
          },
        }),
        prisma.orderStatusHistory.create({
          data: {
            orderId,
            previousStatus: order.status,
            newStatus: OrderStatus.PAYMENT_CONFIRMED,
            actorType: "WEBHOOK",
            reason: `Payment verified (${razorpayPaymentId})`,
          },
        }),
      ]);
    } catch {
      // Memory fallback
    }

    order.paymentStatus = PaymentStatus.CAPTURED;
    order.status = OrderStatus.PAYMENT_CONFIRMED;
    order.updatedAt = new Date();

    if (order.payments.length === 0) {
      order.payments.push({
        id: `pay_${Date.now()}`,
        orderId,
        gateway: "RAZORPAY",
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        amount: order.totalAmount,
        currency: order.currency,
        status: PaymentStatus.CAPTURED,
        attemptCount: 1,
        idempotencyKey: null,
        verifiedAt: new Date(),
        failureCode: null,
        failureReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      for (const pay of order.payments) {
        pay.status = PaymentStatus.CAPTURED;
        pay.razorpayPaymentId = razorpayPaymentId;
        pay.razorpaySignature = razorpaySignature;
        pay.verifiedAt = new Date();
        pay.updatedAt = new Date();
      }
    }

    order.statusHistory.push({
      id: `osh_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      orderId,
      previousStatus: OrderStatus.PENDING_PAYMENT,
      newStatus: OrderStatus.PAYMENT_CONFIRMED,
      actorType: "WEBHOOK",
      actorId: null,
      reason: `Payment verified (${razorpayPaymentId})`,
      createdAt: new Date(),
    });

    this.memoryOrders.set(orderId, order);
    return order;
  }

  private mapPrismaOrder(dbOrder: {
    id: string;
    orderNumber: string;
    userId: string | null;
    guestEmail: string | null;
    guestPhone: string | null;
    guestName: string | null;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    subtotal: unknown;
    discountAmount: unknown;
    taxAmount: unknown;
    shippingFee: unknown;
    codFee: unknown;
    totalAmount: unknown;
    currency: string;
    notes: string | null;
    shippingAddressSnapshot: unknown;
    billingAddressSnapshot: unknown;
    couponCode: string | null;
    couponId: string | null;
    idempotencyKey: string | null;
    shippingAddressId: string | null;
    billingAddressId: string | null;
    createdAt: Date;
    updatedAt: Date;
    items?: Array<{
      id: string;
      orderId: string;
      variantId: string;
      productId: string | null;
      productTitle: string;
      variantTitle: string;
      sku: string;
      selectedSize: string | null;
      selectedColor: string | null;
      unitPrice: unknown;
      quantity: number;
      lineSubtotal?: unknown;
      discountAmount?: unknown;
      taxAmount?: unknown;
      totalPrice: unknown;
    }>;
    payments?: Array<{
      id: string;
      orderId: string;
      gateway: string;
      razorpayOrderId: string | null;
      razorpayPaymentId: string | null;
      razorpaySignature: string | null;
      amount: unknown;
      currency: string;
      status: PaymentStatus;
      attemptCount?: number;
      idempotencyKey?: string | null;
      verifiedAt?: Date | null;
      failureCode?: string | null;
      failureReason?: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    statusHistory?: Array<{
      id: string;
      orderId: string;
      previousStatus: OrderStatus | null;
      newStatus: OrderStatus;
      actorType?: string;
      actorId: string | null;
      reason: string | null;
      createdAt: Date;
    }>;
  }): StoredOrder {
    return {
      id: dbOrder.id,
      orderNumber: dbOrder.orderNumber,
      userId: dbOrder.userId,
      guestEmail: dbOrder.guestEmail,
      guestPhone: dbOrder.guestPhone,
      guestName: dbOrder.guestName,
      status: dbOrder.status,
      paymentMethod: dbOrder.paymentMethod,
      paymentStatus: dbOrder.paymentStatus,
      subtotal: Number(dbOrder.subtotal),
      discountAmount: Number(dbOrder.discountAmount),
      taxAmount: Number(dbOrder.taxAmount),
      shippingFee: Number(dbOrder.shippingFee),
      codFee: Number(dbOrder.codFee),
      totalAmount: Number(dbOrder.totalAmount),
      currency: dbOrder.currency,
      notes: dbOrder.notes,
      shippingAddressSnapshot: dbOrder.shippingAddressSnapshot as Record<string, unknown>,
      billingAddressSnapshot: dbOrder.billingAddressSnapshot as Record<string, unknown> | null,
      couponCode: dbOrder.couponCode,
      couponId: dbOrder.couponId,
      idempotencyKey: dbOrder.idempotencyKey,
      shippingAddressId: dbOrder.shippingAddressId,
      billingAddressId: dbOrder.billingAddressId,
      createdAt: dbOrder.createdAt,
      updatedAt: dbOrder.updatedAt,
      items: (dbOrder.items || []).map((i) => ({
        id: i.id,
        orderId: i.orderId,
        variantId: i.variantId,
        productId: i.productId,
        productTitle: i.productTitle,
        variantTitle: i.variantTitle,
        sku: i.sku,
        selectedSize: i.selectedSize,
        selectedColor: i.selectedColor,
        unitPrice: Number(i.unitPrice),
        quantity: i.quantity,
        lineSubtotal: i.lineSubtotal ? Number(i.lineSubtotal) : Number(i.unitPrice) * i.quantity,
        discountAmount: Number(i.discountAmount || 0),
        taxAmount: Number(i.taxAmount || 0),
        totalPrice: Number(i.totalPrice),
      })),
      payments: (dbOrder.payments || []).map((p) => ({
        id: p.id,
        orderId: p.orderId,
        gateway: p.gateway,
        razorpayOrderId: p.razorpayOrderId,
        razorpayPaymentId: p.razorpayPaymentId,
        razorpaySignature: p.razorpaySignature,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        attemptCount: p.attemptCount || 1,
        idempotencyKey: p.idempotencyKey || null,
        verifiedAt: p.verifiedAt || null,
        failureCode: p.failureCode || null,
        failureReason: p.failureReason || null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      statusHistory: (dbOrder.statusHistory || []).map((h) => ({
        id: h.id,
        orderId: h.orderId,
        previousStatus: h.previousStatus,
        newStatus: h.newStatus,
        actorType: h.actorType || "SYSTEM",
        actorId: h.actorId,
        reason: h.reason,
        createdAt: h.createdAt,
      })),
    };
  }
}

export const orderRepository = new OrderRepository();
