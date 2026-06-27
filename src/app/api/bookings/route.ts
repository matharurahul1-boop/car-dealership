import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bookings: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, car, date, time, notes } = body;

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .insert({ name, phone, car, date, time, notes, status: "confirmed" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update lead status to booked
  await supabaseAdmin.from("leads").update({ status: "booked" }).eq("phone", phone);

  return NextResponse.json({ success: true, booking: data });
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json();

  const { error } = await supabaseAdmin
    .from("bookings")
    .update({ status })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
