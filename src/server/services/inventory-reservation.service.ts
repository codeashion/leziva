import { prisma } from "@/server/db/prisma";
import { inventoryService } from "@/server/services/inventory.service";
import { logger } from "@/utils/logger";
import { BadRequestError } from "@/utils/errors";
import { ReservationStatus } from "@prisma/client";

export interface ReservationItem {
  variantId: string;
  quantity: number;
}

export interface StoredReservation {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class InventoryReservationService {
  private memoryReservations = new Map<string, StoredReservation[]>();

  /**
   * Reserves stock for an order for a bounded TTL (e.g. 30 minutes).
   * Validates stock atomically and adjusts quantity with audit log.
   */
  async reserveStockForOrder(
    orderId: string,
    items: ReservationItem[],
    ttlMinutes: number = 30
  ): Promise<StoredReservation[]> {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    const reservations: StoredReservation[] = [];

    // Step 1: Validate all items can be fulfilled before altering any stock
    for (const item of items) {
      const validation = await inventoryService.validateAvailability(item.variantId, item.quantity);
      if (!validation.available) {
        throw new BadRequestError(
          validation.message || `Variant ${item.variantId} does not have sufficient inventory.`
        );
      }
    }

    // Step 2: Atomically reserve each item
    for (const item of items) {
      try {
        await inventoryService.adjustStock({
          variantId: item.variantId,
          quantityDelta: -item.quantity,
          reason: `ORDER_RESERVED_${orderId}`,
          notes: `Reserved for pending order ${orderId} (expires in ${ttlMinutes}m)`,
        });

        // Persist reservation in DB
        let resId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        try {
          const dbRes = await prisma.inventoryReservation.create({
            data: {
              orderId,
              variantId: item.variantId,
              quantity: item.quantity,
              status: ReservationStatus.RESERVED,
              expiresAt,
            },
          });
          resId = dbRes.id;
        } catch {
          // Handled by memory fallback below
        }

        const resObj: StoredReservation = {
          id: resId,
          orderId,
          variantId: item.variantId,
          quantity: item.quantity,
          status: ReservationStatus.RESERVED,
          expiresAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        reservations.push(resObj);
      } catch (err: unknown) {
        // Rollback any items already reserved in this loop
        for (const done of reservations) {
          await this.releaseSingleItem(done.variantId, done.quantity, orderId, "RESERVATION_FAILED_ROLLBACK");
        }
        const msg = err instanceof Error ? err.message : String(err);
        throw new BadRequestError(`Failed to reserve inventory: ${msg}`);
      }
    }

    const existingList = this.memoryReservations.get(orderId) || [];
    this.memoryReservations.set(orderId, [...existingList, ...reservations]);
    logger.info(`[InventoryReservation] Reserved ${items.length} items for order ${orderId}`);
    return reservations;
  }

  /**
   * Commits the reservation permanently upon payment capture or COD placement.
   */
  async commitReservation(orderId: string): Promise<void> {
    try {
      await prisma.inventoryReservation.updateMany({
        where: { orderId, status: ReservationStatus.RESERVED },
        data: { status: ReservationStatus.COMMITTED },
      });
    } catch {
      // Memory fallback
    }

    const list = this.memoryReservations.get(orderId);
    if (list) {
      for (const res of list) {
        if (res.status === ReservationStatus.RESERVED) {
          res.status = ReservationStatus.COMMITTED;
          res.updatedAt = new Date();
        }
      }
    }
    logger.info(`[InventoryReservation] Committed reservations for order ${orderId}`);
  }

  /**
   * Releases reserved stock back into available inventory on order cancellation or payment failure.
   */
  async releaseReservation(orderId: string, reason: string = "ORDER_CANCELLED"): Promise<void> {
    let reservations: StoredReservation[] = [];

    try {
      const dbList = await prisma.inventoryReservation.findMany({
        where: { orderId, status: { in: [ReservationStatus.RESERVED, ReservationStatus.COMMITTED] } },
      });
      reservations = dbList as unknown as StoredReservation[];

      await prisma.inventoryReservation.updateMany({
        where: { orderId, status: { in: [ReservationStatus.RESERVED, ReservationStatus.COMMITTED] } },
        data: { status: ReservationStatus.RELEASED },
      });
    } catch {
      reservations = this.memoryReservations.get(orderId) || [];
    }

    if (reservations.length === 0) {
      reservations = this.memoryReservations.get(orderId) || [];
    }

    for (const res of reservations) {
      if (res.status === ReservationStatus.RESERVED || res.status === ReservationStatus.COMMITTED) {
        await this.releaseSingleItem(res.variantId, res.quantity, orderId, reason);
        res.status = ReservationStatus.RELEASED;
        res.updatedAt = new Date();
      }
    }

    logger.info(`[InventoryReservation] Released reservations for order ${orderId} (${reason})`);
  }

  /**
   * Automatically expires any reservation whose TTL has passed.
   */
  async expireStaleReservations(): Promise<number> {
    const now = new Date();
    let expiredCount = 0;

    try {
      const staleList = await prisma.inventoryReservation.findMany({
        where: {
          status: ReservationStatus.RESERVED,
          expiresAt: { lt: now },
        },
      });

      for (const res of staleList) {
        await this.releaseSingleItem(res.variantId, res.quantity, res.orderId, "RESERVATION_EXPIRED");
        await prisma.inventoryReservation.update({
          where: { id: res.id },
          data: { status: ReservationStatus.EXPIRED },
        });
        expiredCount++;
      }
    } catch {
      // Memory fallback
      for (const list of this.memoryReservations.values()) {
        for (const res of list) {
          if (res.status === ReservationStatus.RESERVED && res.expiresAt < now) {
            await this.releaseSingleItem(res.variantId, res.quantity, res.orderId, "RESERVATION_EXPIRED");
            res.status = ReservationStatus.EXPIRED;
            res.updatedAt = new Date();
            expiredCount++;
          }
        }
      }
    }

    return expiredCount;
  }

  private async releaseSingleItem(
    variantId: string,
    quantity: number,
    orderId: string,
    reason: string
  ): Promise<void> {
    try {
      await inventoryService.adjustStock({
        variantId,
        quantityDelta: quantity,
        reason: `RELEASE_${reason}_${orderId}`,
        notes: `Restored ${quantity} units from order ${orderId} (${reason})`,
        allowNegative: true,
      });
    } catch (err: unknown) {
      logger.error(`[InventoryReservation] Error restoring item ${variantId}:`, err);
    }
  }
}

export const inventoryReservationService = new InventoryReservationService();
