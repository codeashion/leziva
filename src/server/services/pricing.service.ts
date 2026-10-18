import { productRepository } from "@/server/repositories/product.repository";
import { couponService } from "@/server/services/coupon.service";
import { BadRequestError } from "@/utils/errors";
import { PaymentMethod } from "@prisma/client";

export interface PricingLineItemInput {
  variantId: string;
  quantity: number;
}

export interface PricingLineItemDetail {
  variantId: string;
  productId: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
  size: string;
  colorName: string;
  colorHex: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineSubtotal: number;
  allocatedDiscount: number;
  allocatedTax: number;
  finalLineTotal: number;
}

export interface CalculateQuoteInput {
  items: PricingLineItemInput[];
  couponCode?: string | null;
  paymentMethod?: PaymentMethod;
  userId?: string | null;
  customerEmail?: string | null;
  shippingPincode?: string | null;
}

export interface AuthoritativeQuote {
  items: PricingLineItemDetail[];
  totalItemCount: number;
  subtotal: number;
  discountAmount: number;
  netTaxableAmount: number;
  taxAmount: number;
  taxRatePercent: number;
  taxBreakdown: {
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    description: string;
  };
  shippingFee: number;
  freeShippingThreshold: number;
  isFreeShipping: boolean;
  codFee: number;
  totalAmount: number;
  currency: string;
  coupon: {
    code: string;
    id: string;
    description: string | null;
    discountAmount: number;
  } | null;
  paymentMethod: PaymentMethod;
  priceCalculatedAt: string;
}

// Configured store policy constants
export const FREE_SHIPPING_THRESHOLD = 2999;
export const STANDARD_SHIPPING_FEE = 250;
export const COD_CONVENIENCE_FEE = 99;
export const APPAREL_GST_PERCENT = 5.0; // 5% GST for Indian handloom & luxury textiles

export class PricingService {
  /**
   * Authoritative server-side pricing engine.
   * Recalculates all line prices directly from database/product repository.
   * Never trusts any client-provided prices, totals, or discounts.
   */
  async calculateQuote(input: CalculateQuoteInput): Promise<AuthoritativeQuote> {
    if (!input.items || input.items.length === 0) {
      throw new BadRequestError("Cart is empty; cannot generate pricing quote");
    }

    const lineDetails: PricingLineItemDetail[] = [];
    let subtotal = 0;
    let totalItemCount = 0;
    const productIds: string[] = [];

    // Step 1: Batch validate each variant and get authoritative current price
    const variantIds = input.items.map((i) => i.variantId);
    const variantMap = await productRepository.findVariantsByIds(variantIds);

    for (const item of input.items) {
      if (item.quantity <= 0) {
        throw new BadRequestError(`Invalid quantity (${item.quantity}) for item`);
      }

      const variantRecord = variantMap.get(item.variantId);
      if (!variantRecord) {
        throw new BadRequestError(`Product variant "${item.variantId}" no longer exists`);
      }

      const { variant, product } = variantRecord;

      if (!variant.isActive || !product.isActive) {
        throw new BadRequestError(`Product variant "${variant.title}" is currently unavailable`);
      }

      const unitPrice = Number(variant.price);
      const lineSubtotal = Math.round(unitPrice * item.quantity * 100) / 100;

      subtotal += lineSubtotal;
      totalItemCount += item.quantity;
      if (variant.productId) {
        productIds.push(variant.productId);
      }

      lineDetails.push({
        variantId: variant.id,
        productId: variant.productId,
        productTitle: product.title,
        variantTitle: variant.title,
        sku: variant.sku,
        size: variant.size,
        colorName: variant.colorName,
        colorHex: variant.colorHex,
        imageUrl: variant.imageUrl || null,
        unitPrice,
        quantity: item.quantity,
        lineSubtotal,
        allocatedDiscount: 0,
        allocatedTax: 0,
        finalLineTotal: lineSubtotal,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // Step 2: Validate coupon and calculate discount
    let discountAmount = 0;
    let appliedCoupon: AuthoritativeQuote["coupon"] = null;

    if (input.couponCode && input.couponCode.trim()) {
      const couponResult = await couponService.validateAndCalculate(input.couponCode, {
        subtotal,
        userId: input.userId,
        customerEmail: input.customerEmail,
        productIds,
      });

      discountAmount = couponResult.discountAmount;
      appliedCoupon = {
        code: couponResult.coupon.code,
        id: couponResult.coupon.id,
        description: couponResult.coupon.description,
        discountAmount,
      };
    }

    // Step 3: Allocate discount proportionally across line items
    let allocatedDiscountSum = 0;
    if (discountAmount > 0 && subtotal > 0) {
      for (let i = 0; i < lineDetails.length; i++) {
        const line = lineDetails[i];
        if (i === lineDetails.length - 1) {
          // Last item gets remainder to guarantee exact sum
          line.allocatedDiscount = Math.round((discountAmount - allocatedDiscountSum) * 100) / 100;
        } else {
          const share = Math.round(((line.lineSubtotal / subtotal) * discountAmount) * 100) / 100;
          line.allocatedDiscount = share;
          allocatedDiscountSum += share;
        }
      }
    }

    // Step 4: Calculate Taxes (Indian GST) on net taxable amount
    const netTaxableAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
    const taxAmount = Math.round(((netTaxableAmount * APPAREL_GST_PERCENT) / 100) * 100) / 100;

    // Allocate tax across items
    let allocatedTaxSum = 0;
    for (let i = 0; i < lineDetails.length; i++) {
      const line = lineDetails[i];
      const lineTaxable = Math.max(0, line.lineSubtotal - line.allocatedDiscount);
      if (i === lineDetails.length - 1) {
        line.allocatedTax = Math.round((taxAmount - allocatedTaxSum) * 100) / 100;
      } else {
        const lineTax = netTaxableAmount > 0
          ? Math.round(((lineTaxable / netTaxableAmount) * taxAmount) * 100) / 100
          : 0;
        line.allocatedTax = lineTax;
        allocatedTaxSum += lineTax;
      }
      line.finalLineTotal = Math.round((line.lineSubtotal - line.allocatedDiscount + line.allocatedTax) * 100) / 100;
    }

    const halfTax = Math.round((taxAmount / 2) * 100) / 100;
    const taxBreakdown = {
      cgstAmount: halfTax,
      sgstAmount: Math.round((taxAmount - halfTax) * 100) / 100,
      igstAmount: 0,
      description: `${APPAREL_GST_PERCENT}% Indian Textile & Apparel GST`,
    };

    // Step 5: Calculate Shipping Fee (Decoupled from carrier dispatch)
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingFee = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;

    // Step 6: Payment method & COD Fee
    const paymentMethod = input.paymentMethod || PaymentMethod.RAZORPAY;
    const codFee = paymentMethod === PaymentMethod.COD ? COD_CONVENIENCE_FEE : 0;

    // Step 7: Final authoritative payable amount in INR
    const totalAmount = Math.round((netTaxableAmount + taxAmount + shippingFee + codFee) * 100) / 100;

    return {
      items: lineDetails,
      totalItemCount,
      subtotal,
      discountAmount,
      netTaxableAmount,
      taxAmount,
      taxRatePercent: APPAREL_GST_PERCENT,
      taxBreakdown,
      shippingFee,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      isFreeShipping,
      codFee,
      totalAmount,
      currency: "INR",
      coupon: appliedCoupon,
      paymentMethod,
      priceCalculatedAt: new Date().toISOString(),
    };
  }
}

export const pricingService = new PricingService();
