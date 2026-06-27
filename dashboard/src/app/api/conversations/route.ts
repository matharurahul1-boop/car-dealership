import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  // Get all messages and leads in parallel
  const [{ data: messages, error }, { data: leads }] = await Promise.all([
    supabaseAdmin.from("messages").select("*").order("created_at", { ascending: true }),
    supabaseAdmin.from("leads").select("phone, name"),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Build phone → real name map from leads (leads have the actual customer name once collected)
  const leadNames = new Map<string, string>();
  for (const lead of leads ?? []) {
    if (lead.name && !lead.name.startsWith("WA-")) {
      leadNames.set(lead.phone, lead.name);
    }
  }

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
    // Prefer lead name over message name (lead name is updated when customer shares it)
    const displayName = leadNames.get(msg.phone) || (msg.name?.startsWith("WA-") ? msg.phone : msg.name) || msg.phone;

    if (!convMap.has(msg.phone)) {
      convMap.set(msg.phone, {
        phone: msg.phone,
        name: displayName,
        lastMessage: msg.text,
        lastMessageTime: msg.created_at,
        unread: 0,
        messages: [],
      });
    }
    const conv = convMap.get(msg.phone)!;
    // Keep updating name in case lead name was set after first message
    if (leadNames.has(msg.phone)) conv.name = leadNames.get(msg.phone)!;
    conv.messages.push({ ...msg, timestamp: msg.created_at });
    conv.lastMessage = msg.text;
    conv.lastMessageTime = msg.created_at;
    if (msg.direction === "inbound") conv.unread++;
  }

  const conversations = Array.from(convMap.values()).sort(
    (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );

  return NextResponse.json({ conversations });
}
