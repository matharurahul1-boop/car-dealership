import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID } from "@/lib/config";

export async function POST(req: NextRequest) {
  const { to, message, name } = await req.json();

  const res = await fetch(
    `https://graph.facebook.com/v25.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data }, { status: res.status });

  // Save outbound message to Supabase
  await supabaseAdmin.from("messages").insert({
    phone: to,
    name: name || to,
    text: message,
    direction: "outbound",
    wa_message_id: data.messages?.[0]?.id,
  });

  return NextResponse.json({ success: true });
}
