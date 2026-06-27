import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// N8N calls this endpoint after every WhatsApp message (inbound + outbound AI reply)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone, name, inbound_text, outbound_text, booking } = body;

  if (!phone) return NextResponse.json({ error: "phone required" }, { status: 400 });

  const isRealName = name && !name.startsWith("WA-");

  // Insert lead if first time (ignoreDuplicates: true so we never overwrite with WA- fallback)
  await supabaseAdmin
    .from("leads")
    .upsert(
      { phone, name: isRealName ? name : phone, status: "contacted", source: "WhatsApp" },
      { onConflict: "phone", ignoreDuplicates: true }
    );

  // If we now have a real name, update it (separate update so WA- never overwrites a real name)
  if (isRealName) {
    await supabaseAdmin.from("leads").update({ name }).eq("phone", phone);
  }

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
    const carName = String(booking.car).trim();

    // Reject multi-car bookings (AI bundling two cars into one field)
    const isMultiCar = carName.includes(",") || carName.includes(" and ") || carName.includes(" & ");
    if (!isMultiCar) {
      // Check if booking already exists for this phone + car (reschedule = UPDATE, new = INSERT)
      const { data: existing } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("phone", phone)
        .ilike("car", carName)
        .eq("status", "confirmed")
        .maybeSingle();

      if (existing) {
        // Reschedule: update existing booking
        await supabaseAdmin
          .from("bookings")
          .update({ date: booking.date, time: booking.time, name: name || phone })
          .eq("id", existing.id);
      } else {
        // New booking: insert
        await supabaseAdmin.from("bookings").insert({
          phone,
          name: name || phone,
          car: carName,
          date: booking.date,
          time: booking.time,
          status: "confirmed",
        });
      }

      // Update lead status to booked
      await supabaseAdmin.from("leads").update({ status: "booked" }).eq("phone", phone);
    }
  }

  return NextResponse.json({ success: true });
}
