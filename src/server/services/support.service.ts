/**
 * LEZIVA — Customer Support Ticketing & Helpdesk Service
 * 
 * Manages customer inquiries, order assistance threads, agent assignments,
 * internal private notes, and ticket lifecycle states.
 */

import { prisma } from "@/server/db/prisma";
import { auditRepository } from "@/server/repositories/audit.repository";
import { TicketPriority, TicketStatus } from "@prisma/client";
import { NotFoundError } from "@/utils/errors";

export interface SupportTicketSummary {
  id: string;
  ticketNumber: string;
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  orderId?: string | null;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedToName?: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketMessageData {
  id: string;
  ticketId: string;
  senderName: string;
  senderRole: "CUSTOMER" | "AGENT";
  message: string;
  isInternal: boolean;
  createdAt: string;
}

export interface SupportTicketDetail extends SupportTicketSummary {
  internalNotes?: string | null;
  messages: SupportTicketMessageData[];
}

export class SupportService {
  private memoryTickets: SupportTicketDetail[] = [
    {
      id: "tck_demo_1",
      ticketNumber: "TCK-84219",
      customerId: "usr_demo_patron_1",
      customerName: "Princess Gayatri Devi",
      customerEmail: "patron@leziva.com",
      orderId: "ord_demo_1",
      subject: "Bespoke Blouse Tailoring Consultation",
      category: "ORDER",
      priority: TicketPriority.HIGH,
      status: TicketStatus.OPEN,
      assignedToName: "Atelier Concierge",
      messageCount: 2,
      internalNotes: "VIP patron requesting customized sleeve embroidery for Royal Festive saree.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: "msg_1",
          ticketId: "tck_demo_1",
          senderName: "Princess Gayatri Devi",
          senderRole: "CUSTOMER",
          message: "Greetings Atelier. Can the neckline on the Banarasi Silk saree blouse be tailored with gold zari piping?",
          isInternal: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "msg_2",
          ticketId: "tck_demo_1",
          senderName: "Atelier Concierge",
          senderRole: "AGENT",
          message: "Our master artisans are delighted to accommodate your bespoke embroidery specification.",
          isInternal: false,
          createdAt: new Date().toISOString(),
        },
      ],
    },
  ];

  /**
   * Retrieves support tickets with optional filtering.
   */
  async getTickets(params: {
    status?: TicketStatus;
    priority?: TicketPriority;
    search?: string;
  } = {}): Promise<SupportTicketSummary[]> {
    try {
      const dbTickets = await prisma.supportTicket.findMany({
        where: {
          status: params.status,
          priority: params.priority,
          subject: params.search ? { contains: params.search, mode: "insensitive" } : undefined,
        },
        orderBy: { updatedAt: "desc" },
        include: {
          customer: { select: { name: true, email: true } },
          assignedTo: { select: { name: true } },
          messages: { select: { id: true } },
        },
      });

      if (dbTickets.length > 0) {
        return dbTickets.map((t) => ({
          id: t.id,
          ticketNumber: t.ticketNumber,
          customerId: t.customerId,
          customerName: t.customer?.name || "Patron",
          customerEmail: t.customer?.email || "",
          orderId: t.orderId,
          subject: t.subject,
          category: t.category,
          priority: t.priority,
          status: t.status,
          assignedToName: t.assignedTo?.name || null,
          messageCount: t.messages.length,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        }));
      }
    } catch {
      // Memory fallback
    }

    return this.memoryTickets.filter((t) => {
      if (params.status && t.status !== params.status) return false;
      if (params.priority && t.priority !== params.priority) return false;
      if (params.search && !t.subject.toLowerCase().includes(params.search.toLowerCase())) return false;
      return true;
    });
  }

  /**
   * Retrieves full ticket thread by ID.
   */
  async getTicketById(id: string): Promise<SupportTicketDetail> {
    try {
      const t = await prisma.supportTicket.findUnique({
        where: { id },
        include: {
          customer: { select: { name: true, email: true } },
          assignedTo: { select: { name: true } },
          messages: { orderBy: { createdAt: "asc" } },
        },
      });

      if (t) {
        return {
          id: t.id,
          ticketNumber: t.ticketNumber,
          customerId: t.customerId,
          customerName: t.customer?.name || "Patron",
          customerEmail: t.customer?.email || "",
          orderId: t.orderId,
          subject: t.subject,
          category: t.category,
          priority: t.priority,
          status: t.status,
          assignedToName: t.assignedTo?.name || null,
          internalNotes: t.internalNotes,
          messageCount: t.messages.length,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
          messages: t.messages.map((m) => ({
            id: m.id,
            ticketId: m.ticketId,
            senderName: m.senderName,
            senderRole: m.senderRole as "CUSTOMER" | "AGENT",
            message: m.message,
            isInternal: m.isInternal,
            createdAt: m.createdAt.toISOString(),
          })),
        };
      }
    } catch {
      // Memory fallback
    }

    const memoryTicket = this.memoryTickets.find((t) => t.id === id);
    if (!memoryTicket) {
      throw new NotFoundError(`Support ticket not found: ${id}`);
    }
    return memoryTicket;
  }

  /**
   * Appends a reply message or internal note to an existing ticket.
   */
  async addReply(
    ticketId: string,
    input: {
      message: string;
      senderName: string;
      senderRole?: "CUSTOMER" | "AGENT";
      isInternal?: boolean;
    },
    actorId?: string
  ): Promise<SupportTicketMessageData> {
    const ticket = await this.getTicketById(ticketId);

    const messageItem: SupportTicketMessageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ticketId,
      senderName: input.senderName,
      senderRole: input.senderRole || "AGENT",
      message: input.message,
      isInternal: !!input.isInternal,
      createdAt: new Date().toISOString(),
    };

    try {
      await prisma.supportTicketMessage.create({
        data: {
          id: messageItem.id,
          ticketId,
          senderName: messageItem.senderName,
          senderRole: messageItem.senderRole,
          message: messageItem.message,
          isInternal: messageItem.isInternal,
          senderId: actorId || null,
        },
      });

      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() },
      });
    } catch {
      ticket.messages.push(messageItem);
      ticket.messageCount = ticket.messages.length;
      ticket.updatedAt = new Date().toISOString();
    }

    await auditRepository.recordLog({
      actorId: actorId || null,
      action: input.isInternal ? "SUPPORT_INTERNAL_NOTE_ADDED" : "SUPPORT_REPLY_POSTED",
      resourceType: "SUPPORT_TICKET",
      resourceId: ticketId,
      metadata: { ticketNumber: ticket.ticketNumber, isInternal: !!input.isInternal },
    });

    return messageItem;
  }

  /**
   * Updates status or priority of a ticket.
   */
  async updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    actorId?: string
  ): Promise<SupportTicketDetail> {
    const ticket = await this.getTicketById(ticketId);

    try {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status, updatedAt: new Date() },
      });
    } catch {
      ticket.status = status;
      ticket.updatedAt = new Date().toISOString();
    }

    await auditRepository.recordLog({
      actorId: actorId || null,
      action: "SUPPORT_STATUS_UPDATED",
      resourceType: "SUPPORT_TICKET",
      resourceId: ticketId,
      metadata: { newStatus: status },
    });

    return ticket;
  }
}

export const supportService = new SupportService();
