import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { N8N_NEW_LEAD_URL } from "@/lib/config";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data });
}

export async function POST(req: NextRequest) {
  const { name, phone, interest, source } = await req.json();

  const { data, error } = await supabaseAdmin
    .from("leads")
    .upsert({ name, phone, interest, source: source || "WhatsApp", status: "new" }, { onConflict: "phone" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Trigger N8N to send WhatsApp welcome message
  await fetch(N8N_NEW_LEAD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone }),
  }).catch(() => {});

  return NextResponse.json({ success: true, lead: data });
}
