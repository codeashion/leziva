/**
 * LEZIVA — Shipment Database Repository
 * 
 * Provides PostgreSQL persistence for forward and reverse shipments
 * with resilient in-memory fallback for testing and offline modes.
 */

import { prisma } from "@/server/db/prisma";
import { logger } from "@/utils/logger";
import { ShipmentStatus, ShipmentType, Prisma } from "@prisma/client";

export interface StoredShipment {
  id: string;
  orderId: string;
  carrier: string;
  velocityOrderId: string | null;
  velocityShipmentId: string | null;
  awb: string | null;
  awbNumber: string | null;
  courierId: string | null;
  courierName: string | null;
  shipmentType: ShipmentType;
  status: ShipmentStatus;
  labelUrl: string | null;
  manifestUrl: string | null;
  pickupLocation: string | null;
  pickupDetails: Record<string, unknown> | null;
  packageLength: number;
  packageBreadth: number;
  packageHeight: number;
  packageWeight: number;
  manifestDate: Date | null;
  pickupDate: Date | null;
  deliveredDate: Date | null;
  lastTrackingAt: Date | null;
  lastTrackingRefresh: Date | null;
  trackingActivities: unknown[] | null;
  sanitizedError: string | null;
  lastProviderError: string | null;
  retryCount: number;
  returnRequestId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShipmentParams {
  orderId: string;
  carrier?: string;
  velocityOrderId?: string | null;
  velocityShipmentId?: string | null;
  awb?: string | null;
  courierId?: string | null;
  courierName?: string | null;
  shipmentType?: ShipmentType;
  status?: ShipmentStatus;
  labelUrl?: string | null;
  manifestUrl?: string | null;
  pickupLocation?: string | null;
  pickupDetails?: Record<string, unknown> | null;
  packageLength?: number;
  packageBreadth?: number;
  packageHeight?: number;
  packageWeight?: number;
  packageDimensions?: { length: number; breadth: number; height: number };
  pickupDate?: Date | null;
  trackingActivities?: unknown[] | null;
  returnRequestId?: string | null;
}

export class ShipmentRepository {
  private memoryShipments = new Map<string, StoredShipment>();

  private mapPrismaShipment(raw: Record<string, unknown>): StoredShipment {
    return {
      id: String(raw.id),
      orderId: String(raw.orderId),
      carrier: (raw.carrier as string) || "VELOCITY",
      velocityOrderId: (raw.velocityOrderId as string) || null,
      velocityShipmentId: (raw.velocityShipmentId as string) || null,
      awb: (raw.awb as string) || (raw.awbNumber as string) || null,
      awbNumber: (raw.awb as string) || (raw.awbNumber as string) || null,
      courierId: (raw.courierId as string) || null,
      courierName: (raw.courierName as string) || null,
      shipmentType: (raw.shipmentType as ShipmentType) || ShipmentType.FORWARD,
      status: (raw.status as ShipmentStatus) || ShipmentStatus.PENDING,
      labelUrl: (raw.labelUrl as string) || null,
      manifestUrl: (raw.manifestUrl as string) || null,
      pickupLocation: (raw.pickupLocation as string) || null,
      pickupDetails: (raw.pickupDetails as Record<string, unknown>) || null,
      packageLength: Number(raw.packageLength) || 30,
      packageBreadth: Number(raw.packageBreadth) || 25,
      packageHeight: Number(raw.packageHeight) || 8,
      packageWeight: Number(raw.packageWeight) || 1200,
      manifestDate: (raw.manifestDate as Date) || null,
      pickupDate: (raw.pickupDate as Date) || null,
      deliveredDate: (raw.deliveredDate as Date) || null,
      lastTrackingAt: (raw.lastTrackingAt as Date) || null,
      lastTrackingRefresh: (raw.lastTrackingAt as Date) || null,
      trackingActivities: (raw.trackingActivities as unknown[]) || null,
      sanitizedError: (raw.sanitizedError as string) || null,
      lastProviderError: (raw.sanitizedError as string) || null,
      retryCount: Number(raw.retryCount) || 0,
      returnRequestId: (raw.returnRequestId as string) || null,
      createdAt: raw.createdAt as Date,
      updatedAt: raw.updatedAt as Date,
    };
  }

  async create(data: CreateShipmentParams): Promise<StoredShipment> {
    const id = `shp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    try {
      const created = await prisma.shipment.create({
        data: {
          id,
          orderId: data.orderId,
          carrier: data.carrier || "VELOCITY",
          velocityOrderId: data.velocityOrderId || null,
          velocityShipmentId: data.velocityShipmentId || null,
          awb: data.awb || null,
          awbNumber: data.awb || null,
          courierId: data.courierId || null,
          courierName: data.courierName || null,
          shipmentType: data.shipmentType || ShipmentType.FORWARD,
          status: data.status || ShipmentStatus.PENDING,
          labelUrl: data.labelUrl || null,
          manifestUrl: data.manifestUrl || null,
          pickupLocation: data.pickupLocation || null,
          pickupDetails: data.pickupDetails ? (data.pickupDetails as Prisma.InputJsonValue) : Prisma.JsonNull,
          packageLength: data.packageLength || 30,
          packageBreadth: data.packageBreadth || 25,
          packageHeight: data.packageHeight || 8,
          packageWeight: data.packageWeight || 1200,
          trackingActivities: data.trackingActivities ? (data.trackingActivities as Prisma.InputJsonValue) : Prisma.JsonNull,
          returnRequestId: data.returnRequestId || null,
        },
      });

      const mapped = this.mapPrismaShipment(created);
      this.memoryShipments.set(id, mapped);
      return mapped;
    } catch {
      logger.info("[ShipmentRepository] Using memory fallback for create");
      const fallback: StoredShipment = {
        id,
        orderId: data.orderId,
        carrier: data.carrier || "VELOCITY",
        velocityOrderId: data.velocityOrderId || null,
        velocityShipmentId: data.velocityShipmentId || null,
        awb: data.awb || null,
        awbNumber: data.awb || null,
        courierId: data.courierId || null,
        courierName: data.courierName || null,
        shipmentType: data.shipmentType || ShipmentType.FORWARD,
        status: data.status || ShipmentStatus.PENDING,
        labelUrl: data.labelUrl || null,
        manifestUrl: data.manifestUrl || null,
        pickupLocation: data.pickupLocation || null,
        pickupDetails: data.pickupDetails || null,
        packageLength: data.packageLength || 30,
        packageBreadth: data.packageBreadth || 25,
        packageHeight: data.packageHeight || 8,
        packageWeight: data.packageWeight || 1200,
        manifestDate: data.status === ShipmentStatus.AWB_GENERATED ? now : null,
        pickupDate: null,
        deliveredDate: null,
        lastTrackingAt: null,
        lastTrackingRefresh: null,
        trackingActivities: data.trackingActivities || null,
        sanitizedError: null,
        lastProviderError: null,
        retryCount: 0,
        returnRequestId: data.returnRequestId || null,
        createdAt: now,
        updatedAt: now,
      };
      this.memoryShipments.set(id, fallback);
      return fallback;
    }
  }

  async findById(id: string): Promise<StoredShipment | null> {
    try {
      const found = await prisma.shipment.findUnique({ where: { id } });
      if (found) return this.mapPrismaShipment(found);
    } catch {
      // Memory fallback
    }
    return this.memoryShipments.get(id) || null;
  }

  async findByAwb(awb: string): Promise<StoredShipment | null> {
    try {
      const found = await prisma.shipment.findFirst({
        where: { OR: [{ awb }, { awbNumber: awb }] },
      });
      if (found) return this.mapPrismaShipment(found);
    } catch {
      // Memory fallback
    }
    for (const shp of this.memoryShipments.values()) {
      if (shp.awb === awb || shp.awbNumber === awb) {
        return shp;
      }
    }
    return null;
  }

  async findByOrderId(orderId: string): Promise<StoredShipment[]> {
    try {
      const list = await prisma.shipment.findMany({
        where: { orderId },
        orderBy: { createdAt: "desc" },
      });
      if (list.length > 0) return list.map((s) => this.mapPrismaShipment(s));
    } catch {
      // Memory fallback
    }

    const matches: StoredShipment[] = [];
    for (const shp of this.memoryShipments.values()) {
      if (shp.orderId === orderId) {
        matches.push(shp);
      }
    }
    return matches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findMany(filters: {
    status?: ShipmentStatus;
    shipmentType?: ShipmentType;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<StoredShipment[]> {
    const { status, shipmentType, search, limit = 50, offset = 0 } = filters;

    try {
      const where: Prisma.ShipmentWhereInput = {};
      if (status) where.status = status;
      if (shipmentType) where.shipmentType = shipmentType;
      if (search) {
        where.OR = [
          { awb: { contains: search, mode: "insensitive" } },
          { orderId: { contains: search, mode: "insensitive" } },
          { velocityOrderId: { contains: search, mode: "insensitive" } },
        ];
      }

      const list = await prisma.shipment.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });
      return list.map((s) => this.mapPrismaShipment(s));
    } catch {
      // Memory fallback
      let list = Array.from(this.memoryShipments.values());
      if (status) list = list.filter((s) => s.status === status);
      if (shipmentType) list = list.filter((s) => s.shipmentType === shipmentType);
      if (search) {
        const query = search.toLowerCase();
        list = list.filter(
          (s) =>
            (s.awb && s.awb.toLowerCase().includes(query)) ||
            s.orderId.toLowerCase().includes(query) ||
            (s.velocityOrderId && s.velocityOrderId.toLowerCase().includes(query))
        );
      }
      return list.slice(offset, offset + limit);
    }
  }

  async count(filters: { status?: ShipmentStatus; shipmentType?: ShipmentType; search?: string }): Promise<number> {
    const { status, shipmentType, search } = filters;
    try {
      const where: Prisma.ShipmentWhereInput = {};
      if (status) where.status = status;
      if (shipmentType) where.shipmentType = shipmentType;
      if (search) {
        where.OR = [
          { awb: { contains: search, mode: "insensitive" } },
          { orderId: { contains: search, mode: "insensitive" } },
        ];
      }
      return await prisma.shipment.count({ where });
    } catch {
      let list = Array.from(this.memoryShipments.values());
      if (status) list = list.filter((s) => s.status === status);
      if (shipmentType) list = list.filter((s) => s.shipmentType === shipmentType);
      return list.length;
    }
  }

  async updateStatus(id: string, status: ShipmentStatus, error?: string | null): Promise<StoredShipment | null> {
    const now = new Date();
    try {
      const updated = await prisma.shipment.update({
        where: { id },
        data: {
          status,
          sanitizedError: error !== undefined ? error : undefined,
          updatedAt: now,
        },
      });
      const mapped = this.mapPrismaShipment(updated);
      this.memoryShipments.set(id, mapped);
      return mapped;
    } catch {
      const existing = this.memoryShipments.get(id);
      if (!existing) return null;
      const updated: StoredShipment = {
        ...existing,
        status,
        sanitizedError: error !== undefined ? error : existing.sanitizedError,
        updatedAt: now,
      };
      this.memoryShipments.set(id, updated);
      return updated;
    }
  }

  async update(
    id: string,
    data: Partial<CreateShipmentParams & { lastProviderError?: string | null; status?: ShipmentStatus }>
  ): Promise<StoredShipment | null> {
    const now = new Date();
    try {
      const updateData: Prisma.ShipmentUpdateInput = { updatedAt: now };
      if (data.status) updateData.status = data.status;
      if (data.lastProviderError !== undefined) updateData.sanitizedError = data.lastProviderError;
      if (data.labelUrl !== undefined) updateData.labelUrl = data.labelUrl;
      if (data.manifestUrl !== undefined) updateData.manifestUrl = data.manifestUrl;
      if (data.courierName !== undefined) updateData.courierName = data.courierName;
      if (data.courierId !== undefined) updateData.courierId = data.courierId;
      if (data.awb !== undefined) {
        updateData.awb = data.awb;
        updateData.awbNumber = data.awb;
      }

      const updated = await prisma.shipment.update({
        where: { id },
        data: updateData,
      });
      const mapped = this.mapPrismaShipment(updated);
      this.memoryShipments.set(id, mapped);
      return mapped;
    } catch {
      const existing = this.memoryShipments.get(id);
      if (!existing) return null;
      const updated: StoredShipment = {
        ...existing,
        status: data.status || existing.status,
        sanitizedError: data.lastProviderError !== undefined ? data.lastProviderError : existing.sanitizedError,
        lastProviderError: data.lastProviderError !== undefined ? data.lastProviderError : existing.lastProviderError,
        labelUrl: data.labelUrl !== undefined ? data.labelUrl : existing.labelUrl,
        manifestUrl: data.manifestUrl !== undefined ? data.manifestUrl : existing.manifestUrl,
        courierName: data.courierName !== undefined ? data.courierName : existing.courierName,
        courierId: data.courierId !== undefined ? data.courierId : existing.courierId,
        awb: data.awb !== undefined ? data.awb : existing.awb,
        awbNumber: data.awb !== undefined ? data.awb : existing.awbNumber,
        updatedAt: now,
      };
      this.memoryShipments.set(id, updated);
      return updated;
    }
  }

  async updateAwb(
    id: string,
    params: {
      awb: string;
      courierId?: string | null;
      courierName?: string | null;
      labelUrl?: string | null;
      manifestUrl?: string | null;
      velocityShipmentId?: string | null;
      status?: ShipmentStatus;
    }
  ): Promise<StoredShipment | null> {
    const now = new Date();
    const newStatus = params.status || ShipmentStatus.AWB_GENERATED;

    try {
      const updated = await prisma.shipment.update({
        where: { id },
        data: {
          awb: params.awb,
          awbNumber: params.awb,
          courierId: params.courierId,
          courierName: params.courierName,
          labelUrl: params.labelUrl,
          manifestUrl: params.manifestUrl,
          velocityShipmentId: params.velocityShipmentId,
          status: newStatus,
          manifestDate: now,
          updatedAt: now,
        },
      });
      const mapped = this.mapPrismaShipment(updated);
      this.memoryShipments.set(id, mapped);
      return mapped;
    } catch {
      const existing = this.memoryShipments.get(id);
      if (!existing) return null;
      const updated: StoredShipment = {
        ...existing,
        awb: params.awb,
        awbNumber: params.awb,
        courierId: params.courierId || existing.courierId,
        courierName: params.courierName || existing.courierName,
        labelUrl: params.labelUrl || existing.labelUrl,
        manifestUrl: params.manifestUrl || existing.manifestUrl,
        velocityShipmentId: params.velocityShipmentId || existing.velocityShipmentId,
        status: newStatus,
        manifestDate: now,
        updatedAt: now,
      };
      this.memoryShipments.set(id, updated);
      return updated;
    }
  }

  async updateTracking(
    id: string,
    params: {
      status?: ShipmentStatus;
      activities?: unknown[];
      deliveredDate?: Date | null;
      pickupDate?: Date | null;
    }
  ): Promise<StoredShipment | null> {
    const now = new Date();

    try {
      const updated = await prisma.shipment.update({
        where: { id },
        data: {
          status: params.status,
          trackingActivities: params.activities ? (params.activities as Prisma.InputJsonValue) : undefined,
          deliveredDate: params.deliveredDate,
          pickupDate: params.pickupDate,
          lastTrackingAt: now,
          updatedAt: now,
        },
      });
      const mapped = this.mapPrismaShipment(updated);
      this.memoryShipments.set(id, mapped);
      return mapped;
    } catch {
      const existing = this.memoryShipments.get(id);
      if (!existing) return null;
      const updated: StoredShipment = {
        ...existing,
        status: params.status || existing.status,
        trackingActivities: params.activities || existing.trackingActivities,
        deliveredDate: params.deliveredDate !== undefined ? params.deliveredDate : existing.deliveredDate,
        pickupDate: params.pickupDate !== undefined ? params.pickupDate : existing.pickupDate,
        lastTrackingAt: now,
        lastTrackingRefresh: now,
        updatedAt: now,
      };
      this.memoryShipments.set(id, updated);
      return updated;
    }
  }

  async incrementRetry(id: string, error?: string): Promise<void> {
    try {
      await prisma.shipment.update({
        where: { id },
        data: {
          retryCount: { increment: 1 },
          sanitizedError: error || undefined,
          updatedAt: new Date(),
        },
      });
    } catch {
      const existing = this.memoryShipments.get(id);
      if (existing) {
        existing.retryCount += 1;
        if (error) existing.sanitizedError = error;
        existing.updatedAt = new Date();
      }
    }
  }
}

export const shipmentRepository = new ShipmentRepository();
