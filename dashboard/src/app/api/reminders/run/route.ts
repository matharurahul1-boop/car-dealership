import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID } from "@/lib/config";

// Parses booking date strings: "DD-MM-YYYY", "YYYY-MM-DD", "29 June 2026", "03-07-2026"
function parseBookingDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // DD-MM-YYYY
  const dmy = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmy) return new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1]));

  // YYYY-MM-DD
  const ymd = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) return new Date(parseInt(ymd[1]), parseInt(ymd[2]) - 1, parseInt(ymd[3]));

  // Natural: "29 June 2026"
  const natural = new Date(dateStr);
  if (!isNaN(natural.getTime())) return natural;

  return null;
}

// Parses time strings: "2pm", "10am", "14:00", "2:30 PM"
function parseBookingTime(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  const t = timeStr.trim().toLowerCase();

  // "2pm", "10am"
  const ampm = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (ampm) {
    let h = parseInt(ampm[1]);
    const m = ampm[2] ? parseInt(ampm[2]) : 0;
    if (ampm[3] === "pm" && h !== 12) h += 12;
    if (ampm[3] === "am" && h === 12) h = 0;
    return { hours: h, minutes: m };
  }

  // "14:00"
  const hhmm = t.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) return { hours: parseInt(hhmm[1]), minutes: parseInt(hhmm[2]) };

  return null;
}

async function sendWhatsApp(phone: string, message: string) {
  await fetch(`https://graph.facebook.com/v25.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: message },
    }),
  });
}

export async function GET() {
  // Read settings
  const { data: settingsRows } = await supabaseAdmin
    .from("app_settings")
    .select("key, value")
    .in("key", ["reminder_enabled", "reminder_hours_before", "reminder_message"]);

  const settings: Record<string, string> = {};
  for (const row of settingsRows ?? []) settings[row.key] = row.value;

  if (settings["reminder_enabled"] === "false") {
    return NextResponse.json({ skipped: "reminders disabled" });
  }

  const hoursBefore = parseInt(settings["reminder_hours_before"] ?? "24", 10);
  const messageTemplate =
    settings["reminder_message"] ??
    "Hi {name}! 🚗 Reminder: your test drive for {car} is scheduled for {date} at {time}. See you at Handysolver Car Dealership!";

  // Fetch confirmed bookings
  const { data: bookings } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("status", "confirmed");

  // Fetch already-sent reminders
  const { data: sentLog } = await supabaseAdmin
    .from("reminders_log")
    .select("booking_id");

  const sentIds = new Set((sentLog ?? []).map((r: { booking_id: string }) => r.booking_id));

  // For day-based reminders (>=24h): find bookings on the target date regardless of time
  // For hour-based reminders (<24h): find bookings within a ±1h window today
  const now = new Date();
  const sent: string[] = [];

  for (const booking of bookings ?? []) {
    if (sentIds.has(booking.id)) continue;

    const bookingDate = parseBookingDate(booking.date);
    if (!bookingDate) continue;

    let shouldSend = false;

    if (hoursBefore >= 24) {
      // Check if booking is on the target day (days ahead = hoursBefore / 24, rounded)
      const daysAhead = Math.round(hoursBefore / 24);
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysAhead);
      shouldSend =
        bookingDate.getFullYear() === targetDate.getFullYear() &&
        bookingDate.getMonth() === targetDate.getMonth() &&
        bookingDate.getDate() === targetDate.getDate();
    } else {
      // Hour-based: check if booking datetime is within ±1h of the reminder window
      const bookingTime = parseBookingTime(booking.time);
      if (bookingTime) {
        const bookingDateTime = new Date(
          bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate(),
          bookingTime.hours, bookingTime.minutes
        );
        const windowStart = new Date(now.getTime() + (hoursBefore - 1) * 3600000);
        const windowEnd = new Date(now.getTime() + (hoursBefore + 1) * 3600000);
        shouldSend = bookingDateTime >= windowStart && bookingDateTime <= windowEnd;
      }
    }

    if (shouldSend) {
      const message = messageTemplate
        .replace("{name}", booking.name || booking.phone)
        .replace("{car}", booking.car || "your chosen car")
        .replace("{date}", booking.date)
        .replace("{time}", booking.time);

      await sendWhatsApp(booking.phone, message);

      await supabaseAdmin
        .from("reminders_log")
        .insert({ booking_id: booking.id, phone: booking.phone });

      sent.push(booking.phone);
    }
  }

  return NextResponse.json({ sent, count: sent.length, checkedAt: now.toISOString() });
}
