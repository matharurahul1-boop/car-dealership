"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { formatPhone } from "@/lib/utils";
import { MessageCircle, Send, Search } from "lucide-react";
import type { Conversation } from "@/lib/types";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      const convs = data.conversations || [];
      setConversations(convs);
      if (!selected && convs.length > 0) setSelected(convs[0]);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected]);

  const sendMessage = async () => {
    if (!selected || !message.trim()) return;
    setSending(true);
    try {
      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selected.phone, message: message.trim() }),
      });
      setMessage("");
      // Optimistically add message to UI
      setSelected((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: Date.now().toString(),
              from: "agent",
              text: message.trim(),
              timestamp: new Date().toISOString(),
              direction: "outbound",
            },
          ],
        };
      });
    } finally {
      setSending(false);
    }
  };

  const filteredConvs = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const formatTime = (ts: string) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Conversations"
        subtitle="WhatsApp customer chats"
        onRefresh={fetchConversations}
        refreshing={loading}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
            ) : filteredConvs.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle size={36} className="mx-auto text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm">No conversations yet</p>
              </div>
            ) : (
              filteredConvs.map((c) => (
                <button
                  key={c.phone}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected?.phone === c.phone ? "bg-blue-50 border-l-2 border-l-blue-600" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {c.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.lastMessage}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xs text-gray-400">{formatTime(c.lastMessageTime)}</p>
                      {c.unread > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 mt-1 rounded-full bg-blue-600 text-white text-xs font-bold">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selected ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                {selected.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selected.name}</p>
                <p className="text-xs text-gray-400">{formatPhone(selected.phone)}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e5ddd5]">
              {selected.messages?.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">No messages yet</p>
              )}
              {selected.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl px-4 py-2.5 shadow-sm ${
                      msg.direction === "outbound"
                        ? "bg-[#dcf8c6] text-gray-900 rounded-br-none"
                        : "bg-white text-gray-900 rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <p className="text-xs text-gray-400 mt-1 text-right">{formatTime(msg.timestamp)}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-200 bg-white flex items-center gap-3">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Type a message…"
                className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Button onClick={sendMessage} loading={sending} size="sm" className="rounded-full px-4">
                <Send size={15} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400">Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
