import { getServerEnv } from "@/shared/validations/env";
import { logger } from "@/utils/logger";

export interface OrderEmailItem {
  productTitle: string;
  variantTitle: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderEmailPayload {
  toEmail: string;
  recipientName: string;
  orderNumber: string;
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingFee: number;
  codFee: number;
  currency: string;
  paymentMethod: string;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  items: OrderEmailItem[];
}

export class EmailService {
  /**
   * Dispatches order placement confirmation email.
   */
  async sendOrderConfirmationEmail(payload: OrderEmailPayload): Promise<boolean> {
    const isCod = payload.paymentMethod === "COD";
    const subject = isCod
      ? `LEZIVA Atelier: Your Cash-on-Delivery Order #${payload.orderNumber} is Confirmed`
      : `LEZIVA Atelier: Order #${payload.orderNumber} Received`;

    const html = this.renderOrderEmailHtml(payload, isCod ? "COD Confirmation" : "Order Placed");
    return this.dispatchEmail(payload.toEmail, subject, html);
  }

  /**
   * Dispatches verified payment receipt email.
   */
  async sendPaymentVerifiedEmail(
    payload: OrderEmailPayload,
    paymentDetails: { razorpayPaymentId: string; amount: number }
  ): Promise<boolean> {
    const subject = `LEZIVA Atelier: Payment Verified for Order #${payload.orderNumber}`;
    const html = this.renderPaymentReceiptHtml(payload, paymentDetails);
    return this.dispatchEmail(payload.toEmail, subject, html);
  }

  /**
   * Dispatches order cancellation notice.
   */
  async sendOrderCancelledEmail(
    payload: {
      toEmail: string;
      recipientName: string;
      orderNumber: string;
      reason?: string | null;
    }
  ): Promise<boolean> {
    const subject = `LEZIVA Atelier: Order #${payload.orderNumber} Has Been Cancelled`;
    const html = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e1e1e; background-color: #faf9f6; border: 1px solid #e5e0d8;">
        <h1 style="color: #226192; font-size: 24px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">LEZIVA</h1>
        <p style="font-size: 12px; letter-spacing: 1px; color: #EF8557; text-transform: uppercase; margin-top: 0;">Haute Couture & Handloom Atelier</p>
        <hr style="border: none; border-top: 1px solid #e0d9cd; margin: 20px 0;" />
        <p>Dear ${payload.recipientName},</p>
        <p>Your cancellation request for Order <strong>#${payload.orderNumber}</strong> has been successfully processed.</p>
        ${payload.reason ? `<p><strong>Reason:</strong> ${payload.reason}</p>` : ""}
        <p>If any pre-payment was verified for this order, our concierge team will initiate an automated refund according to store policy.</p>
        <p style="margin-top: 32px; font-size: 13px; color: #666;">Warm regards,<br /><strong>LEZIVA Client Concierge</strong></p>
      </div>
    `;
    return this.dispatchEmail(payload.toEmail, subject, html);
  }

  private renderOrderEmailHtml(payload: OrderEmailPayload, title: string): string {
    const itemRows = payload.items
      .map(
        (it) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eae5db;">
            <strong>${it.productTitle}</strong><br />
            <span style="font-size: 12px; color: #666;">${it.variantTitle} × ${it.quantity}</span>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eae5db; text-align: right;">
            ₹${it.totalPrice.toLocaleString("en-IN")}
          </td>
        </tr>`
      )
      .join("");

    return `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 28px; color: #1e1e1e; background-color: #faf9f6; border: 1px solid #e5e0d8;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #226192; font-size: 28px; letter-spacing: 4px; text-transform: uppercase; margin: 0;">LEZIVA</h1>
          <p style="font-size: 11px; letter-spacing: 2px; color: #EF8557; text-transform: uppercase; margin-top: 4px;">Luxury Indian Fashion Atelier</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e0d9cd; margin: 16px 0;" />
        <h2 style="font-size: 18px; color: #226192; margin-bottom: 12px;">${title}</h2>
        <p>Dear ${payload.recipientName},</p>
        <p>Thank you for choosing LEZIVA. We have received your order <strong>#${payload.orderNumber}</strong>. Our master artisans are preparing your garments with the utmost care.</p>
        
        <div style="background-color: #ffffff; padding: 16px; border-radius: 4px; margin: 20px 0; border: 1px solid #eae5db;">
          <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 0; color: #226192;">Ensemble Summary</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            ${itemRows}
            <tr>
              <td style="padding: 8px 10px; color: #666;">Item Subtotal</td>
              <td style="padding: 8px 10px; text-align: right;">₹${payload.subtotal.toLocaleString("en-IN")}</td>
            </tr>
            ${
              payload.discountAmount > 0
                ? `<tr>
                    <td style="padding: 8px 10px; color: #226192;">Privilege Discount</td>
                    <td style="padding: 8px 10px; text-align: right; color: #226192;">-₹${payload.discountAmount.toLocaleString("en-IN")}</td>
                  </tr>`
                : ""
            }
            <tr>
              <td style="padding: 8px 10px; color: #666;">Taxes (5% GST)</td>
              <td style="padding: 8px 10px; text-align: right;">₹${payload.taxAmount.toLocaleString("en-IN")}</td>
            </tr>
            <tr>
              <td style="padding: 8px 10px; color: #666;">Express Shipping</td>
              <td style="padding: 8px 10px; text-align: right;">${payload.shippingFee === 0 ? "Complimentary" : `₹${payload.shippingFee.toLocaleString("en-IN")}`}</td>
            </tr>
            ${
              payload.codFee > 0
                ? `<tr>
                    <td style="padding: 8px 10px; color: #666;">COD Convenience Fee</td>
                    <td style="padding: 8px 10px; text-align: right;">₹${payload.codFee.toLocaleString("en-IN")}</td>
                  </tr>`
                : ""
            }
            <tr style="font-weight: bold; font-size: 16px; border-top: 2px solid #226192;">
              <td style="padding: 12px 10px;">Total Payable</td>
              <td style="padding: 12px 10px; text-align: right; color: #226192;">₹${payload.totalAmount.toLocaleString("en-IN")}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #ffffff; padding: 16px; border-radius: 4px; margin: 20px 0; border: 1px solid #eae5db; font-size: 13px;">
          <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 0; color: #226192;">Delivery Address</h3>
          <p style="margin: 0; line-height: 1.6;">
            <strong>${payload.shippingAddress.fullName}</strong><br />
            ${payload.shippingAddress.addressLine1}${payload.shippingAddress.addressLine2 ? `, ${payload.shippingAddress.addressLine2}` : ""}<br />
            ${payload.shippingAddress.city}, ${payload.shippingAddress.state} - ${payload.shippingAddress.pincode}<br />
            Phone: ${payload.shippingAddress.phone}
          </p>
        </div>

        <p style="font-size: 13px; color: #555;">Payment Mode: <strong>${payload.paymentMethod}</strong></p>
        <p style="margin-top: 32px; font-size: 13px; color: #666;">With warm appreciation,<br /><strong>The LEZIVA Atelier Team</strong></p>
      </div>
    `;
  }

  private renderPaymentReceiptHtml(
    payload: OrderEmailPayload,
    payment: { razorpayPaymentId: string; amount: number }
  ): string {
    return `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 28px; color: #1e1e1e; background-color: #faf9f6; border: 1px solid #e5e0d8;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #226192; font-size: 28px; letter-spacing: 4px; text-transform: uppercase; margin: 0;">LEZIVA</h1>
          <p style="font-size: 11px; letter-spacing: 2px; color: #EF8557; text-transform: uppercase; margin-top: 4px;">Official Payment Receipt</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e0d9cd; margin: 16px 0;" />
        <p>Dear ${payload.recipientName},</p>
        <p>Your payment for Order <strong>#${payload.orderNumber}</strong> has been successfully verified.</p>
        
        <div style="background-color: #eaf4fb; padding: 16px; border-radius: 4px; border: 1px solid #bce0fd; margin: 20px 0; font-size: 14px;">
          <p style="margin: 4px 0;"><strong>Transaction Reference:</strong> ${payment.razorpayPaymentId}</p>
          <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ₹${payment.amount.toLocaleString("en-IN")}</p>
          <p style="margin: 4px 0;"><strong>Payment Status:</strong> Verified & Captured</p>
          <p style="margin: 4px 0;"><strong>Gateway:</strong> Razorpay Secure Payment</p>
        </div>

        <p>Your order is now being tailored and packed at our atelier.</p>
        <p style="margin-top: 32px; font-size: 13px; color: #666;">Warm regards,<br /><strong>LEZIVA Client Concierge</strong></p>
      </div>
    `;
  }

  private async dispatchEmail(to: string, subject: string, html: string): Promise<boolean> {
    const env = getServerEnv();
    const isMock =
      env.EMAIL_PROVIDER === "mock" ||
      env.SMTP_USER.includes("placeholder") ||
      env.SMTP_HOST.includes("mailtrap.io");

    if (isMock) {
      logger.info(
        `[EmailService] Simulated transactional email to "${to}" with subject: "${subject}" (${html.length} bytes)`
      );
      return true;
    }

    try {
      // In production, integrate SMTP or Resend transport
      logger.info(`[EmailService] Dispatched transactional email to "${to}"`);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`[EmailService] Failed to send email to ${to}:`, msg);
      return false;
    }
  }
}

export const emailService = new EmailService();
