/**
 * LEZIVA — Administrative Data Reporting & Secure CSV Export Service
 * 
 * Generates sanitized CSV reports for Sales, Orders, Products, Inventory, and Customers
 * with strict spreadsheet formula injection mitigation (=, +, -, @ escaped).
 */

import { orderRepository } from "@/server/repositories/order.repository";
import { productRepository } from "@/server/repositories/product.repository";
import { customerService } from "@/server/services/customer.service";
import { auditRepository } from "@/server/repositories/audit.repository";
import { BadRequestError } from "@/utils/errors";

export type ExportType = "SALES" | "ORDERS" | "PRODUCTS" | "INVENTORY" | "CUSTOMERS";

export interface ExportParams {
  type: ExportType;
  startDate?: string;
  endDate?: string;
  actorId?: string;
}

export class ExportService {
  /**
   * Escapes dangerous characters to prevent CSV / Spreadsheet formula injection.
   */
  private escapeCell(val: unknown): string {
    if (val === null || val === undefined) return '""';
    const s = String(val);
    const sanitized = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${sanitized.replace(/"/g, '""')}"`;
  }

  /**
   * Generates sanitized CSV text according to requested data type.
   */
  async generateCsv(params: ExportParams): Promise<{ fileName: string; csv: string; rowCount: number }> {
    const { type, startDate, endDate, actorId } = params;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    let headers: string[] = [];
    const rows: string[] = [];

    switch (type) {
      case "ORDERS":
      case "SALES": {
        headers = [
          "Order ID",
          "Order Number",
          "Customer Name",
          "Customer Email",
          "Status",
          "Payment Method",
          "Payment Status",
          "Subtotal (INR)",
          "Discount (INR)",
          "Shipping (INR)",
          "Total Amount (INR)",
          "Order Date",
        ];

        const orders = await orderRepository.findMany({ startDate: start, endDate: end, limit: 2000 });
        for (const o of orders) {
          rows.push(
            [
              this.escapeCell(o.id),
              this.escapeCell(o.orderNumber),
              this.escapeCell(o.guestName || "Patron"),
              this.escapeCell(o.guestEmail || ""),
              this.escapeCell(o.status),
              this.escapeCell(o.paymentMethod),
              this.escapeCell(o.paymentStatus),
              this.escapeCell(o.subtotal),
              this.escapeCell(o.discountAmount),
              this.escapeCell(o.shippingFee),
              this.escapeCell(o.totalAmount),
              this.escapeCell(new Date(o.createdAt).toISOString()),
            ].join(",")
          );
        }
        break;
      }

      case "PRODUCTS": {
        headers = [
          "Product ID",
          "Title",
          "Slug",
          "Category ID",
          "Status",
          "SKU",
          "Size",
          "Color",
          "Price (INR)",
          "Compare At Price",
          "Stock Quantity",
          "Low Stock Threshold",
        ];

        const { products } = await productRepository.findProducts({ limit: 2000, includeUnpublished: true });
        for (const p of products) {
          for (const v of p.variants || []) {
            rows.push(
              [
                this.escapeCell(p.id),
                this.escapeCell(p.title),
                this.escapeCell(p.slug),
                this.escapeCell(p.categoryId),
                this.escapeCell(p.status),
                this.escapeCell(v.sku),
                this.escapeCell(v.size),
                this.escapeCell(v.colorName),
                this.escapeCell(v.price),
                this.escapeCell(v.compareAtPrice || ""),
                this.escapeCell(v.inventoryQuantity),
                this.escapeCell(v.lowStockThreshold || 5),
              ].join(",")
            );
          }
        }
        break;
      }

      case "INVENTORY": {
        headers = ["Variant ID", "Product Title", "SKU", "Size", "Color", "Stock Quantity", "Status"];
        const { products } = await productRepository.findProducts({ limit: 2000, includeUnpublished: true });
        for (const p of products) {
          for (const v of p.variants || []) {
            const qty = v.inventoryQuantity ?? 0;
            const status = qty === 0 ? "OUT_OF_STOCK" : qty <= (v.lowStockThreshold || 5) ? "LOW_STOCK" : "IN_STOCK";
            rows.push(
              [
                this.escapeCell(v.id),
                this.escapeCell(p.title),
                this.escapeCell(v.sku),
                this.escapeCell(v.size),
                this.escapeCell(v.colorName),
                this.escapeCell(qty),
                this.escapeCell(status),
              ].join(",")
            );
          }
        }
        break;
      }

      case "CUSTOMERS": {
        headers = ["Customer ID", "Name", "Email", "Status", "Order Count", "Lifetime Value (INR)", "Created Date"];
        const { customers } = await customerService.getCustomers({ limit: 2000 });
        for (const c of customers) {
          rows.push(
            [
              this.escapeCell(c.id),
              this.escapeCell(c.name || "Patron"),
              this.escapeCell(c.email),
              this.escapeCell(c.status),
              this.escapeCell(c.orderCount),
              this.escapeCell(c.lifetimeValue),
              this.escapeCell(c.createdAt),
            ].join(",")
          );
        }
        break;
      }

      default:
        throw new BadRequestError(`Unsupported export report type: ${type}`);
    }

    const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows].join("\n");
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `leziva_${type.toLowerCase()}_report_${timestamp}.csv`;

    await auditRepository.recordLog({
      actorId: actorId || null,
      action: "DATA_EXPORT_GENERATED",
      resourceType: "REPORT",
      metadata: { reportType: type, rowCount: rows.length, fileName },
    });

    return {
      fileName,
      csv: csvContent,
      rowCount: rows.length,
    };
  }
}

export const exportService = new ExportService();
