import { addressRepository, StoredAddress } from "@/server/repositories/address.repository";
import { addressSchema, updateAddressSchema, AddressInput, UpdateAddressInput } from "@/server/validations/address.validation";
import { ForbiddenError, NotFoundError } from "@/utils/errors";
import { logger } from "@/utils/logger";

export class AddressService {
  async getCustomerAddresses(userId: string): Promise<StoredAddress[]> {
    return addressRepository.findByUserId(userId);
  }

  async getAddressById(addressId: string, userId?: string): Promise<StoredAddress> {
    const address = await addressRepository.findById(addressId);
    if (!address) {
      throw new NotFoundError("Address not found");
    }
    if (userId && address.userId && address.userId !== userId) {
      throw new ForbiddenError("You are not authorized to access this address");
    }
    return address;
  }

  async createAddress(userId: string | null, input: AddressInput): Promise<StoredAddress> {
    const validated = addressSchema.parse(input);
    const existing = userId ? await addressRepository.findByUserId(userId) : [];
    
    // If it's the user's first address, automatically make it default shipping and billing
    if (userId && existing.length === 0) {
      validated.isDefaultShipping = true;
      validated.isDefaultBilling = true;
    }

    const created = await addressRepository.create(userId, validated);
    logger.info(`[AddressService] Address created: ${created.id} for user: ${userId || "guest"}`);
    return created;
  }

  async updateAddress(addressId: string, userId: string, input: UpdateAddressInput): Promise<StoredAddress> {
    const validated = updateAddressSchema.parse(input);
    const existing = await this.getAddressById(addressId, userId);

    const updated = await addressRepository.update(existing.id, validated);
    if (!updated) {
      throw new NotFoundError("Address not found");
    }
    logger.info(`[AddressService] Address updated: ${addressId} for user: ${userId}`);
    return updated;
  }

  async deleteAddress(addressId: string, userId: string): Promise<void> {
    const existing = await this.getAddressById(addressId, userId);
    await addressRepository.delete(existing.id);
    logger.info(`[AddressService] Address deleted: ${addressId} for user: ${userId}`);
  }

  async setDefaultShipping(addressId: string, userId: string): Promise<StoredAddress> {
    return this.updateAddress(addressId, userId, { isDefaultShipping: true });
  }

  async setDefaultBilling(addressId: string, userId: string): Promise<StoredAddress> {
    return this.updateAddress(addressId, userId, { isDefaultBilling: true });
  }
}

export const addressService = new AddressService();
