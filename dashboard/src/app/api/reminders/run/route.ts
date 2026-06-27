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

  // Exact time-based: reminder fires when (booking_time - hoursBefore) is within ±15 min of now
  // Bookings are in IST (UTC+5:30), so we add 5.5h to convert booking local time → UTC
  const IST_MS = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  const WINDOW_MS = 15 * 60 * 1000; // ±15 minutes
  const sent: string[] = [];

  for (const booking of bookings ?? []) {
    if (sentIds.has(booking.id)) continue;

    const bookingDate = parseBookingDate(booking.date);
    if (!bookingDate) continue;

    const bookingTime = parseBookingTime(booking.time);
    if (!bookingTime) continue;

    // Booking datetime in IST (treated as local), convert to UTC
    const bookingIST = new Date(
      bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate(),
      bookingTime.hours, bookingTime.minutes
    );
    const bookingUTC = new Date(bookingIST.getTime() - IST_MS);

    // When should the reminder fire? bookingUTC - hoursBefore
    const reminderFireAt = new Date(bookingUTC.getTime() - hoursBefore * 3600000);

    // Send if reminder fire time has passed within the last 30 minutes
    // (covers bookings created after the previous cron run)
    const pastWindow = new Date(now.getTime() - 30 * 60 * 1000);
    if (reminderFireAt <= now && reminderFireAt >= pastWindow) {
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
