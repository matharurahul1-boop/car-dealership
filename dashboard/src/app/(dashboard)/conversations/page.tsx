"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ChatSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase";
import { formatPhone } from "@/lib/utils";
import { MessageCircle, Send, Search } from "lucide-react";
import type { Conversation } from "@/lib/types";

export default function ConversationsPage() {
  const { toast } = useToast();
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
      const convs: Conversation[] = data.conversations || [];
      setConversations(convs);
      setSelected((prev) => prev ? convs.find((c) => c.phone === prev.phone) ?? convs[0] : convs[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Real-time new messages via Supabase
  useEffect(() => {
    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as { phone: string; name: string; text: string; direction: string; created_at: string; id: string };
        setConversations((prev) => {
          const existing = prev.find((c) => c.phone === msg.phone);
          if (existing) {
            return prev.map((c) =>
              c.phone === msg.phone
                ? { ...c, messages: [...c.messages, { id: msg.id, from: msg.phone, text: msg.text, timestamp: msg.created_at, direction: msg.direction as "inbound" | "outbound" }], lastMessage: msg.text, lastMessageTime: msg.created_at, unread: msg.direction === "inbound" ? c.unread + 1 : c.unread }
                : c
            );
          }
          return [{ phone: msg.phone, name: msg.name || msg.phone, lastMessage: msg.text, lastMessageTime: msg.created_at, unread: msg.direction === "inbound" ? 1 : 0, messages: [{ id: msg.id, from: msg.phone, text: msg.text, timestamp: msg.created_at, direction: msg.direction as "inbound" | "outbound" }] }, ...prev];
        });
        setSelected((prev) => {
          if (prev?.phone === msg.phone) {
            return { ...prev, messages: [...prev.messages, { id: msg.id, from: msg.phone, text: msg.text, timestamp: msg.created_at, direction: msg.direction as "inbound" | "outbound" }] };
          }
          return prev;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selected?.messages?.length]);
  useEffect(() => { if (selected) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 50); }, [selected?.phone]);

  const sendMessage = async () => {
    if (!selected || !message.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selected.phone, message: message.trim(), name: selected.name }),
      });
      if (res.ok) {
        setMessage("");
      } else {
        toast("Failed to send message", "error");
      }
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts: string) => {
    if (!ts) return "";
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };
  const filtered = conversations.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  return (
    <div className="flex flex-col h-full">
      <Header title="Conversations" subtitle="WhatsApp customer chats · Real-time" onRefresh={fetchConversations} refreshing={loading} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-[var(--border)] bg-[var(--bg-card)] flex flex-col shrink-0">
          <div className="p-3 border-b border-[var(--border)]">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="w-full pl-8 pr-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-[var(--bg-input)] text-[var(--text)] placeholder:text-[var(--text-muted)]" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <ChatSkeleton />
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle size={32} className="mx-auto text-[var(--text-sub)] mb-2" />
                <p className="text-[var(--text-muted)] text-sm">No conversations yet</p>
              </div>
            ) : filtered.map((c) => (
              <button
                key={c.phone}
                onClick={() => setSelected(c)}
                className={`w-full text-left px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--bg)] transition-colors ${selected?.phone === c.phone ? "bg-blue-600/10 border-l-2 border-l-blue-600" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-[var(--text)] text-sm font-bold shrink-0">
                    {c.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-[var(--text)] text-sm truncate">{c.name}</p>
                      <p className="text-xs text-[var(--text-muted)] shrink-0 ml-1">{formatTime(c.lastMessageTime)}</p>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <p className="text-xs text-[var(--text-muted)] truncate">{c.lastMessage}</p>
                      {c.unread > 0 && <span className="ml-1 shrink-0 w-4 h-4 rounded-full bg-blue-600 text-[var(--text)] text-xs flex items-center justify-center">{c.unread}</span>}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        {selected ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-card)] flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-[var(--text)] text-sm font-bold shrink-0">
                {selected.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="font-semibold text-[var(--text)] text-sm">{selected.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{formatPhone(selected.phone)}</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-[var(--text-muted)]">Live</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ background: "var(--bg)" }}>
              {(!selected.messages || selected.messages.length === 0) && (
                <p className="text-center text-[var(--text-muted)] text-sm py-8">No messages yet</p>
              )}
              {selected.messages?.map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-xl px-4 py-2.5 shadow-sm ${msg.direction === "outbound" ? "bg-blue-600 rounded-br-none" : "rounded-bl-none"}`} style={msg.direction === "outbound" ? {} : { background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <p className={`text-sm whitespace-pre-wrap ${msg.direction === "outbound" ? "text-white" : "text-[var(--text)]"}`}>{msg.text}</p>
                    <p className={`text-xs mt-1 text-right ${msg.direction === "outbound" ? "text-blue-100" : "text-[var(--text-muted)]"}`}>{formatTime(msg.timestamp)}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-card)] flex items-center gap-3">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Type a message…"
                className="flex-1 border border-[var(--border)] rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-[var(--bg-input)] text-[var(--text)] placeholder:text-[var(--text-muted)]"
              />
              <Button onClick={sendMessage} loading={sending} size="sm" className="rounded-full px-4">
                <Send size={15} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[var(--bg)]">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto text-[var(--text-sub)] mb-3" />
              <p className="text-[var(--text-muted)] text-sm">Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
