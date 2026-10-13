/**
 * LEZIVA — Event Notification Templates & Communication Engine
 * 
 * Provides customizable HTML email & SMS templates for transactional order,
 * shipping, refund, and customer support notifications.
 */

import { prisma } from "@/server/db/prisma";
import { auditRepository } from "@/server/repositories/audit.repository";

export interface NotificationTemplateData {
  id: string;
  eventKey: string;
  name: string;
  subject: string;
  bodyHtml: string;
  variables: string[];
  isActive: boolean;
  updatedAt: string;
}

export class NotificationTemplateService {
  private memoryTemplates: NotificationTemplateData[] = [
    {
      id: "tmpl_order_confirmed",
      eventKey: "ORDER_CONFIRMATION",
      name: "Order Confirmation",
      subject: "Your LEZIVA Atelier Order #{{orderNumber}} Confirmation",
      bodyHtml: "<p>Dear {{customerName}},</p><p>We are delighted to confirm your order #{{orderNumber}} totaling INR {{totalAmount}}.</p>",
      variables: ["customerName", "orderNumber", "totalAmount"],
      isActive: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "tmpl_payment_confirmed",
      eventKey: "PAYMENT_CONFIRMATION",
      name: "Payment Received",
      subject: "Payment Verified for Order #{{orderNumber}}",
      bodyHtml: "<p>Dear {{customerName}},</p><p>We have successfully verified your payment of INR {{totalAmount}} (Gateway Ref: {{paymentId}}).</p>",
      variables: ["customerName", "orderNumber", "totalAmount", "paymentId"],
      isActive: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "tmpl_shipment_dispatched",
      eventKey: "SHIPMENT_DISPATCHED",
      name: "Shipment Dispatched",
      subject: "Dispatched: Your Order #{{orderNumber}} via {{courierName}}",
      bodyHtml: "<p>Dear {{customerName}},</p><p>Your ensemble has been manifested for dispatch with {{courierName}} under AWB <strong>{{awb}}</strong>.</p>",
      variables: ["customerName", "orderNumber", "courierName", "awb"],
      isActive: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "tmpl_tracking_update",
      eventKey: "TRACKING_UPDATE",
      name: "In-Transit Milestone",
      subject: "Milestone Update: Your Order #{{orderNumber}} is {{status}}",
      bodyHtml: "<p>Dear {{customerName}},</p><p>Your parcel (AWB: {{awb}}) is currently: <strong>{{status}}</strong> at {{location}}.</p>",
      variables: ["customerName", "orderNumber", "awb", "status", "location"],
      isActive: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "tmpl_order_delivered",
      eventKey: "ORDER_DELIVERED",
      name: "Order Delivered",
      subject: "Delivered: Your LEZIVA Atelier Ensemble Has Arrived",
      bodyHtml: "<p>Dear {{customerName}},</p><p>Your order #{{orderNumber}} has been delivered. We hope you cherish your handcrafted ensemble.</p>",
      variables: ["customerName", "orderNumber"],
      isActive: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "tmpl_order_cancelled",
      eventKey: "ORDER_CANCELLED",
      name: "Order Cancellation",
      subject: "Cancellation Confirmation for Order #{{orderNumber}}",
      bodyHtml: "<p>Dear {{customerName}},</p><p>Your order #{{orderNumber}} has been cancelled. Reason: {{reason}}.</p>",
      variables: ["customerName", "orderNumber", "reason"],
      isActive: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "tmpl_refund_processed",
      eventKey: "REFUND_PROCESSED",
      name: "Refund Processed",
      subject: "Credit Confirmation: Order #{{orderNumber}} Refund Initiated",
      bodyHtml: "<p>Dear {{customerName}},</p><p>A refund of INR {{refundAmount}} for order #{{orderNumber}} has been processed to your original payment method (Ref: {{refundId}}).</p>",
      variables: ["customerName", "orderNumber", "refundAmount", "refundId"],
      isActive: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "tmpl_return_approved",
      eventKey: "RETURN_APPROVED",
      name: "Return Request Approved",
      subject: "Return Authorized: Courier Pickup Scheduled for #{{orderNumber}}",
      bodyHtml: "<p>Dear {{customerName}},</p><p>Your return request for order #{{orderNumber}} is approved. Reverse pickup AWB: {{reverseAwb}}.</p>",
      variables: ["customerName", "orderNumber", "reverseAwb"],
      isActive: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "tmpl_support_reply",
      eventKey: "SUPPORT_REPLY",
      name: "Support Concierge Reply",
      subject: "Response to Support Ticket #{{ticketNumber}}: {{subject}}",
      bodyHtml: "<p>Dear {{customerName}},</p><p>Our concierge has responded to your ticket:</p><blockquote>{{agentMessage}}</blockquote>",
      variables: ["customerName", "ticketNumber", "subject", "agentMessage"],
      isActive: true,
      updatedAt: new Date().toISOString(),
    },
  ];

  /**
   * Retrieves all notification templates.
   */
  async getTemplates(): Promise<NotificationTemplateData[]> {
    try {
      const dbTemplates = await prisma.notificationTemplate.findMany({
        orderBy: { eventKey: "asc" },
      });
      if (dbTemplates.length > 0) {
        return dbTemplates.map((t) => ({
          id: t.id,
          eventKey: t.eventKey,
          name: t.name,
          subject: t.subject,
          bodyHtml: t.bodyHtml,
          variables: t.variables,
          isActive: t.isActive,
          updatedAt: t.updatedAt.toISOString(),
        }));
      }
    } catch {
      // Memory fallback
    }
    return this.memoryTemplates;
  }

  /**
   * Retrieves template by event key.
   */
  async getTemplateByEvent(eventKey: string): Promise<NotificationTemplateData | null> {
    const templates = await this.getTemplates();
    return templates.find((t) => t.eventKey === eventKey) || null;
  }

  /**
   * Saves or updates a notification template.
   */
  async saveTemplate(
    data: {
      eventKey: string;
      name: string;
      subject: string;
      bodyHtml: string;
      variables?: string[];
      isActive?: boolean;
    },
    actorId?: string
  ): Promise<NotificationTemplateData> {
    const item: NotificationTemplateData = {
      id: `tmpl_${data.eventKey.toLowerCase()}`,
      eventKey: data.eventKey,
      name: data.name,
      subject: data.subject,
      bodyHtml: data.bodyHtml,
      variables: data.variables || [],
      isActive: data.isActive ?? true,
      updatedAt: new Date().toISOString(),
    };

    try {
      await prisma.notificationTemplate.upsert({
        where: { eventKey: data.eventKey },
        update: {
          name: data.name,
          subject: data.subject,
          bodyHtml: data.bodyHtml,
          variables: data.variables,
          isActive: data.isActive,
        },
        create: {
          eventKey: data.eventKey,
          name: data.name,
          subject: data.subject,
          bodyHtml: data.bodyHtml,
          variables: data.variables || [],
          isActive: data.isActive ?? true,
        },
      });
    } catch {
      const idx = this.memoryTemplates.findIndex((t) => t.eventKey === data.eventKey);
      if (idx >= 0) {
        this.memoryTemplates[idx] = item;
      } else {
        this.memoryTemplates.push(item);
      }
    }

    await auditRepository.recordLog({
      actorId: actorId || null,
      action: "NOTIFICATION_TEMPLATE_SAVED",
      resourceType: "NOTIFICATION",
      resourceId: data.eventKey,
      metadata: { name: data.name },
    });

    return item;
  }

  /**
   * Renders a preview with sample variable interpolation.
   */
  renderPreview(template: NotificationTemplateData, sampleData: Record<string, string>): { subject: string; bodyHtml: string } {
    let subject = template.subject;
    let bodyHtml = template.bodyHtml;

    for (const [key, val] of Object.entries(sampleData)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      subject = subject.replace(regex, val);
      bodyHtml = bodyHtml.replace(regex, val);
    }

    return { subject, bodyHtml };
  }

  /**
   * Directly interpolates variables into a template string.
   */
  interpolate(templateText: string, variables: Record<string, string>): string {
    let result = templateText;
    for (const [key, val] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), val);
    }
    return result;
  }
}

export const notificationTemplateService = new NotificationTemplateService();
