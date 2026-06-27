import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("key, value")
    .in("key", ["reminder_enabled", "reminder_hours_before", "reminder_message"]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const settings: Record<string, string> = {};
  for (const row of data ?? []) settings[row.key] = row.value;

  return NextResponse.json({
    enabled: settings["reminder_enabled"] !== "false",
    hoursBefore: parseInt(settings["reminder_hours_before"] ?? "24", 10),
    message: settings["reminder_message"] ?? "Hi {name}! 🚗 Reminder: your test drive for {car} is scheduled for {date} at {time}. See you at Handysolver Car Dealership!",
  });
}

export async function PUT(req: NextRequest) {
  const { enabled, hoursBefore, message } = await req.json();

  const rows = [
    { key: "reminder_enabled", value: String(enabled), updated_at: new Date().toISOString() },
    { key: "reminder_hours_before", value: String(hoursBefore), updated_at: new Date().toISOString() },
    { key: "reminder_message", value: message, updated_at: new Date().toISOString() },
  ];

  const { error } = await supabaseAdmin
    .from("app_settings")
    .upsert(rows, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
