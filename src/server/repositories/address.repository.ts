import { prisma } from "@/server/db/prisma";
import { logger } from "@/utils/logger";
import { AddressInput, UpdateAddressInput } from "@/server/validations/address.validation";

export interface StoredAddress {
  id: string;
  userId: string | null;
  fullName: string;
  phone: string;
  alternatePhone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  addressLabel: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AddressRepository {
  private memoryAddresses = new Map<string, StoredAddress>();

  async findByUserId(userId: string): Promise<StoredAddress[]> {
    try {
      const addresses = await prisma.address.findMany({
        where: { userId },
        orderBy: [{ isDefaultShipping: "desc" }, { createdAt: "desc" }],
      });
      return addresses as StoredAddress[];
    } catch {
      logger.info("[AddressRepository] Using in-memory fallback for findByUserId");
      return Array.from(this.memoryAddresses.values())
        .filter((a) => a.userId === userId)
        .sort((a, b) => (b.isDefaultShipping ? 1 : 0) - (a.isDefaultShipping ? 1 : 0));
    }
  }

  async findById(addressId: string): Promise<StoredAddress | null> {
    try {
      const address = await prisma.address.findUnique({
        where: { id: addressId },
      });
      return address as StoredAddress | null;
    } catch {
      logger.info("[AddressRepository] Using in-memory fallback for findById");
      return this.memoryAddresses.get(addressId) || null;
    }
  }

  async create(userId: string | null, input: AddressInput): Promise<StoredAddress> {
    try {
      if (userId && input.isDefaultShipping) {
        await prisma.address.updateMany({
          where: { userId, isDefaultShipping: true },
          data: { isDefaultShipping: false },
        });
      }
      if (userId && input.isDefaultBilling) {
        await prisma.address.updateMany({
          where: { userId, isDefaultBilling: true },
          data: { isDefaultBilling: false },
        });
      }

      const created = await prisma.address.create({
        data: {
          userId,
          fullName: input.fullName,
          phone: input.phone,
          alternatePhone: input.alternatePhone || null,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2 || null,
          landmark: input.landmark || null,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          country: input.country || "India",
          addressLabel: input.addressLabel || "Home",
          isDefaultShipping: input.isDefaultShipping,
          isDefaultBilling: input.isDefaultBilling,
        },
      });
      return created as StoredAddress;
    } catch {
      logger.info("[AddressRepository] Using in-memory fallback for create");
      const id = `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date();

      if (userId && input.isDefaultShipping) {
        for (const addr of this.memoryAddresses.values()) {
          if (addr.userId === userId) addr.isDefaultShipping = false;
        }
      }
      if (userId && input.isDefaultBilling) {
        for (const addr of this.memoryAddresses.values()) {
          if (addr.userId === userId) addr.isDefaultBilling = false;
        }
      }

      const record: StoredAddress = {
        id,
        userId,
        fullName: input.fullName,
        phone: input.phone,
        alternatePhone: input.alternatePhone || null,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 || null,
        landmark: input.landmark || null,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        country: input.country || "India",
        addressLabel: input.addressLabel || "Home",
        isDefaultShipping: input.isDefaultShipping,
        isDefaultBilling: input.isDefaultBilling,
        createdAt: now,
        updatedAt: now,
      };
      this.memoryAddresses.set(id, record);
      return record;
    }
  }

  async update(addressId: string, input: UpdateAddressInput): Promise<StoredAddress | null> {
    try {
      const existing = await prisma.address.findUnique({ where: { id: addressId } });
      if (!existing) return null;

      if (existing.userId && input.isDefaultShipping) {
        await prisma.address.updateMany({
          where: { userId: existing.userId, isDefaultShipping: true },
          data: { isDefaultShipping: false },
        });
      }
      if (existing.userId && input.isDefaultBilling) {
        await prisma.address.updateMany({
          where: { userId: existing.userId, isDefaultBilling: true },
          data: { isDefaultBilling: false },
        });
      }

      const updated = await prisma.address.update({
        where: { id: addressId },
        data: input,
      });
      return updated as StoredAddress;
    } catch {
      logger.info("[AddressRepository] Using in-memory fallback for update");
      const existing = this.memoryAddresses.get(addressId);
      if (!existing) return null;

      if (existing.userId && input.isDefaultShipping) {
        for (const addr of this.memoryAddresses.values()) {
          if (addr.userId === existing.userId) addr.isDefaultShipping = false;
        }
      }
      if (existing.userId && input.isDefaultBilling) {
        for (const addr of this.memoryAddresses.values()) {
          if (addr.userId === existing.userId) addr.isDefaultBilling = false;
        }
      }

      const updated: StoredAddress = {
        ...existing,
        ...input,
        updatedAt: new Date(),
      };
      this.memoryAddresses.set(addressId, updated);
      return updated;
    }
  }

  async delete(addressId: string): Promise<boolean> {
    try {
      await prisma.address.delete({ where: { id: addressId } });
      return true;
    } catch {
      logger.info("[AddressRepository] Using in-memory fallback for delete");
      return this.memoryAddresses.delete(addressId);
    }
  }

  clearMemory(): void {
    this.memoryAddresses.clear();
  }
}

export const addressRepository = new AddressRepository();
