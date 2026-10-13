"use client";

import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  MessageSquare,
  Send,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerName?: string | null;
  customerEmail?: string | null;
  orderId?: string | null;
  subject: string;
  category: string;
  priority: string;
  status: string;
  assignedToName?: string | null;
  messageCount: number;
  createdAt: string;
}

interface TicketDetail extends SupportTicket {
  internalNotes?: string | null;
  messages: Array<{
    id: string;
    senderName: string;
    senderRole: "CUSTOMER" | "AGENT";
    message: string;
    isInternal: boolean;
    createdAt: string;
  }>;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchTickets = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/admin/support/tickets");
      const data = await res.json();
      if (res.ok && data.success) {
        setTickets(data.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchTickets]);

  const handleSelectTicket = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/support/tickets/${id}/messages`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedTicket(data.data);
      }
    } catch {
      // error
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;
    setIsSending(true);

    try {
      const res = await fetch(`/api/v1/admin/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: replyText.trim(),
          isInternal: isInternalNote,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReplyText("");
        handleSelectTicket(selectedTicket.id);
        setBannerMessage({
          text: isInternalNote ? "Private internal note logged." : "Response sent to patron.",
          type: "success",
        });
      }
    } catch {
      setBannerMessage({ text: "Failed to send message.", type: "error" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#0B192C]">
            Customer Support &amp; Concierge Inbox
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Resolve patron inquiries, coordinate blouse tailoring customizations, and manage returns assistance.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchTickets}
          disabled={isLoading}
          className="border-[#EAE6DE]"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Inbox
        </Button>
      </div>

      {bannerMessage && (
        <div
          className={`p-4 rounded-md text-xs font-medium flex items-center justify-between ${
            bannerMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{bannerMessage.text}</span>
          <button onClick={() => setBannerMessage(null)} className="underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Support Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets Queue */}
        <div className="bg-white rounded-lg border border-[#EAE6DE] shadow-xs overflow-hidden">
          <div className="p-3 bg-[#FAF8F5] border-b border-[#EAE6DE] font-semibold text-xs text-slate-700">
            Active Tickets ({tickets.length})
          </div>
          <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
            {tickets.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Inbox is clear. No open support tickets.
              </div>
            ) : (
              tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTicket(t.id)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors block ${
                    selectedTicket?.id === t.id ? "bg-[#226192]/5 border-l-4 border-[#226192]" : ""
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-[#226192]">{t.ticketNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                        t.status === "OPEN"
                          ? "bg-rose-100 text-rose-800"
                          : t.status === "IN_PROGRESS"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-slate-900 mt-1 truncate">
                    {t.subject}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {t.customerName || "Patron"} &bull; {t.category}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected Thread View */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-[#EAE6DE] shadow-xs flex flex-col min-h-[500px]">
          {selectedTicket ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-[#EAE6DE] bg-[#FAF8F5] flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#226192]">
                      {selectedTicket.ticketNumber}
                    </span>
                    <h2 className="font-serif font-bold text-sm text-[#0B192C]">
                      {selectedTicket.subject}
                    </h2>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Patron: <strong>{selectedTicket.customerName}</strong> ({selectedTicket.customerEmail}) &bull; Priority: {selectedTicket.priority}
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-xs text-xs font-bold bg-slate-100 text-slate-700">
                  {selectedTicket.status}
                </span>
              </div>

              {/* Message List */}
              <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[50vh]">
                {selectedTicket.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-4 rounded-lg text-xs space-y-1 ${
                      m.isInternal
                        ? "bg-amber-50/80 border border-amber-200 text-amber-950 ml-6"
                        : m.senderRole === "AGENT"
                        ? "bg-[#226192]/10 border border-[#226192]/20 text-slate-900 ml-6"
                        : "bg-slate-50 border border-slate-200 text-slate-900 mr-6"
                    }`}
                  >
                    <div className="flex justify-between items-center font-semibold text-[11px]">
                      <span className="flex items-center gap-1">
                        {m.isInternal && <Lock className="w-3 h-3 text-amber-600" />}
                        {m.senderName} ({m.isInternal ? "Internal Note" : m.senderRole})
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-[#EAE6DE] bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="replyType"
                      checked={!isInternalNote}
                      onChange={() => setIsInternalNote(false)}
                      className="text-[#226192]"
                    />
                    <span>Customer Reply</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-amber-700">
                    <input
                      type="radio"
                      name="replyType"
                      checked={isInternalNote}
                      onChange={() => setIsInternalNote(true)}
                      className="text-amber-600"
                    />
                    <span className="flex items-center gap-1 font-semibold">
                      <Lock className="w-3 h-3" /> Private Internal Note
                    </span>
                  </label>
                </div>

                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    isInternalNote
                      ? "Add private internal operational note visible only to atelier staff..."
                      : "Type response to patron..."
                  }
                  required
                  className="w-full p-2.5 bg-white rounded-md border border-[#EAE6DE] text-xs focus:outline-hidden focus:border-[#226192]"
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSending || !replyText.trim()}
                    className={isInternalNote ? "bg-amber-600 text-white hover:bg-amber-700" : "bg-[#226192] text-white"}
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    {isSending ? "Sending..." : isInternalNote ? "Save Internal Note" : "Send Response"}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
              Select a support ticket from the queue to view thread history and respond.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
