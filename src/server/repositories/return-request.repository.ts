/**
 * LEZIVA — Return Request Database Repository
 * 
 * Manages customer return requests and reverse pickup authorization.
 */

import { prisma } from "@/server/db/prisma";
import { logger } from "@/utils/logger";
import { ReturnRequestStatus, Prisma } from "@prisma/client";

export interface StoredReturnRequest {
  id: string;
  orderId: string;
  userId: string | null;
  reason: string;
  status: ReturnRequestStatus;
  items: unknown;
  pickupAddress: Record<string, unknown>;
  adminNotes: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReturnRequestParams {
  orderId: string;
  userId?: string | null;
  reason: string;
  items: unknown;
  pickupAddress: Record<string, unknown>;
  status?: ReturnRequestStatus;
}

export class ReturnRequestRepository {
  private memoryReturns = new Map<string, StoredReturnRequest>();

  private mapPrismaReturn(raw: Record<string, unknown>): StoredReturnRequest {
    return {
      id: String(raw.id),
      orderId: String(raw.orderId),
      userId: (raw.userId as string) || null,
      reason: String(raw.reason),
      status: raw.status as ReturnRequestStatus,
      items: raw.items,
      pickupAddress: (raw.pickupAddress as Record<string, unknown>) || {},
      adminNotes: (raw.adminNotes as string) || null,
      approvedAt: (raw.approvedAt as Date) || null,
      createdAt: raw.createdAt as Date,
      updatedAt: raw.updatedAt as Date,
    };
  }

  async create(data: CreateReturnRequestParams): Promise<StoredReturnRequest> {
    const id = `ret_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    try {
      const created = await prisma.returnRequest.create({
        data: {
          id,
          orderId: data.orderId,
          userId: data.userId || null,
          reason: data.reason,
          status: data.status || ReturnRequestStatus.REQUESTED,
          items: data.items as Prisma.InputJsonValue,
          pickupAddress: data.pickupAddress as Prisma.InputJsonValue,
        },
      });
      const mapped = this.mapPrismaReturn(created);
      this.memoryReturns.set(id, mapped);
      return mapped;
    } catch {
      logger.info("[ReturnRequestRepository] Using memory fallback for create");
      const fallback: StoredReturnRequest = {
        id,
        orderId: data.orderId,
        userId: data.userId || null,
        reason: data.reason,
        status: data.status || ReturnRequestStatus.REQUESTED,
        items: data.items,
        pickupAddress: data.pickupAddress,
        adminNotes: null,
        approvedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      this.memoryReturns.set(id, fallback);
      return fallback;
    }
  }

  async findById(id: string): Promise<StoredReturnRequest | null> {
    try {
      const found = await prisma.returnRequest.findUnique({ where: { id } });
      if (found) return this.mapPrismaReturn(found);
    } catch {
      // Memory fallback
    }
    return this.memoryReturns.get(id) || null;
  }

  async findByOrderId(orderId: string): Promise<StoredReturnRequest[]> {
    try {
      const list = await prisma.returnRequest.findMany({
        where: { orderId },
        orderBy: { createdAt: "desc" },
      });
      if (list.length > 0) return list.map((r) => this.mapPrismaReturn(r));
    } catch {
      // Memory fallback
    }

    const matches: StoredReturnRequest[] = [];
    for (const ret of this.memoryReturns.values()) {
      if (ret.orderId === orderId) {
        matches.push(ret);
      }
    }
    return matches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async update(
    id: string,
    data: { status?: ReturnRequestStatus; adminNotes?: string | null; approvedAt?: Date | null }
  ): Promise<StoredReturnRequest | null> {
    const now = new Date();
    try {
      const updated = await prisma.returnRequest.update({
        where: { id },
        data: {
          status: data.status,
          adminNotes: data.adminNotes !== undefined ? data.adminNotes : undefined,
          approvedAt: data.approvedAt !== undefined ? data.approvedAt : undefined,
          updatedAt: now,
        },
      });
      const mapped = this.mapPrismaReturn(updated);
      this.memoryReturns.set(id, mapped);
      return mapped;
    } catch {
      const existing = this.memoryReturns.get(id);
      if (!existing) return null;
      const updated: StoredReturnRequest = {
        ...existing,
        status: data.status || existing.status,
        adminNotes: data.adminNotes !== undefined ? data.adminNotes : existing.adminNotes,
        approvedAt: data.approvedAt !== undefined ? data.approvedAt : existing.approvedAt,
        updatedAt: now,
      };
      this.memoryReturns.set(id, updated);
      return updated;
    }
  }

  async updateStatus(
    id: string,
    status: ReturnRequestStatus,
    adminNotes?: string | null
  ): Promise<StoredReturnRequest | null> {
    const now = new Date();
    const approvedAt = status === ReturnRequestStatus.APPROVED ? now : undefined;

    try {
      const updated = await prisma.returnRequest.update({
        where: { id },
        data: {
          status,
          adminNotes: adminNotes !== undefined ? adminNotes : undefined,
          approvedAt,
          updatedAt: now,
        },
      });
      const mapped = this.mapPrismaReturn(updated);
      this.memoryReturns.set(id, mapped);
      return mapped;
    } catch {
      const existing = this.memoryReturns.get(id);
      if (!existing) return null;
      const updated: StoredReturnRequest = {
        ...existing,
        status,
        adminNotes: adminNotes !== undefined ? adminNotes : existing.adminNotes,
        approvedAt: approvedAt !== undefined ? approvedAt : existing.approvedAt,
        updatedAt: now,
      };
      this.memoryReturns.set(id, updated);
      return updated;
    }
  }

  async findMany(filters: { status?: ReturnRequestStatus; limit?: number; offset?: number }): Promise<StoredReturnRequest[]> {
    const { status, limit = 50, offset = 0 } = filters;
    try {
      const where: Prisma.ReturnRequestWhereInput = {};
      if (status) where.status = status;
      const list = await prisma.returnRequest.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
      });
      return list.map((r) => this.mapPrismaReturn(r));
    } catch {
      let list = Array.from(this.memoryReturns.values());
      if (status) list = list.filter((r) => r.status === status);
      return list.slice(offset, offset + limit);
    }
  }
}

export const returnRequestRepository = new ReturnRequestRepository();
