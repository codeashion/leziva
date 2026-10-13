import { z } from "zod";

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  alternatePhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number")
    .optional()
    .nullable()
    .or(z.literal("")),
  addressLine1: z.string().trim().min(5, "Address Line 1 must be at least 5 characters").max(200),
  addressLine2: z.string().trim().max(200).optional().nullable().or(z.literal("")),
  landmark: z.string().trim().max(100).optional().nullable().or(z.literal("")),
  city: z.string().trim().min(2, "City name is required").max(100),
  state: z.string().trim().min(2, "State name is required").max(100),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit Indian PIN code"),
  country: z.string().trim().default("India"),
  addressLabel: z.enum(["Home", "Work", "Other"]).default("Home"),
  isDefaultShipping: z.boolean().default(false),
  isDefaultBilling: z.boolean().default(false),
});

export const updateAddressSchema = addressSchema.partial();

export type AddressInput = z.infer<typeof addressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
