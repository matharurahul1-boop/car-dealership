import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  // Get all messages ordered by time
  const { data: messages, error } = await supabaseAdmin
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group into conversations by phone
  const convMap = new Map<string, {
    phone: string;
    name: string;
    lastMessage: string;
    lastMessageTime: string;
    unread: number;
    messages: typeof messages;
  }>();

  for (const msg of messages ?? []) {
    if (!convMap.has(msg.phone)) {
      convMap.set(msg.phone, {
        phone: msg.phone,
        name: msg.name || msg.phone,
        lastMessage: msg.text,
        lastMessageTime: msg.created_at,
        unread: 0,
        messages: [],
      });
    }
    const conv = convMap.get(msg.phone)!;
    conv.messages.push(msg);
    conv.lastMessage = msg.text;
    conv.lastMessageTime = msg.created_at;
    if (msg.direction === "inbound") conv.unread++;
  }

  const conversations = Array.from(convMap.values()).sort(
    (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );

  return NextResponse.json({ conversations });
}
