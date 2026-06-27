import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// N8N calls this endpoint after every WhatsApp message (inbound + outbound AI reply)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone, name, inbound_text, outbound_text, booking } = body;

  if (!phone) return NextResponse.json({ error: "phone required" }, { status: 400 });

  // Upsert lead (create if not exists, don't overwrite status)
  await supabaseAdmin
    .from("leads")
    .upsert(
      { phone, name: name || phone, status: "contacted", source: "WhatsApp" },
      { onConflict: "phone", ignoreDuplicates: false }
    );

  const inserts = [];

  const now = new Date();
  if (inbound_text) {
    inserts.push({ phone, name: name || phone, text: inbound_text, direction: "inbound", created_at: now.toISOString() });
  }

  if (outbound_text) {
    // 1 second after inbound so outbound always sorts last (bot reply after customer message)
    const outboundTime = new Date(now.getTime() + 1000).toISOString();
    inserts.push({ phone, name: name || phone, text: outbound_text, direction: "outbound", created_at: outboundTime });
  }

  if (inserts.length > 0) {
    await supabaseAdmin.from("messages").insert(inserts);
  }

  // Save booking if AI collected one
  if (booking?.car && booking?.date && booking?.time) {
    // Upsert: one active booking per phone number (unique constraint on phone)
    await supabaseAdmin.from("bookings").upsert(
      { phone, name: name || phone, car: booking.car, date: booking.date, time: booking.time, status: "confirmed" },
      { onConflict: "phone" }
    );

    // Update lead status to booked
    await supabaseAdmin
      .from("leads")
      .update({ status: "booked" })
      .eq("phone", phone);
  }

  return NextResponse.json({ success: true });
}
