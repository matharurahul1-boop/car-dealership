import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

  const todayISO = ist.toISOString().split("T")[0];
  const todayStr =
    String(ist.getUTCDate()).padStart(2, "0") +
    "-" +
    String(ist.getUTCMonth() + 1).padStart(2, "0") +
    "-" +
    ist.getUTCFullYear();

  const weekStart = new Date(ist);
  weekStart.setUTCDate(ist.getUTCDate() - ist.getUTCDay());
  const weekStartISO = weekStart.toISOString().split("T")[0];

  const [leadsRes, bookingsRes, newTodayRes] = await Promise.all([
    supabaseAdmin.from("leads").select("status"),
    supabaseAdmin.from("bookings").select("date, status"),
    supabaseAdmin
      .from("leads")
      .select("id", { count: "exact" })
      .gte("created_at", `${todayISO}T00:00:00.000Z`),
  ]);

  const leads = leadsRes.data ?? [];
  const bookings = bookingsRes.data ?? [];

  const bookingsToday = bookings.filter(
    (b) => b.date === todayStr && b.status !== "cancelled"
  ).length;

  // Convert DD-MM-YYYY bookings dates to ISO for week comparison
  const bookingsThisWeek = bookings.filter((b) => {
    if (b.status === "cancelled" || !b.date) return false;
    const [d, m, y] = b.date.split("-");
    const iso = `${y}-${m}-${d}`;
    return iso >= weekStartISO && iso <= todayISO;
  }).length;

  const booked = leads.filter((l) => l.status === "booked").length;
  const conversionRate =
    leads.length > 0 ? Math.round((booked / leads.length) * 100) : 0;

  return NextResponse.json({
    totalLeads: leads.length,
    newLeadsToday: newTodayRes.count ?? 0,
    bookingsThisWeek,
    bookingsToday,
    conversionRate,
    activeConversations: leads.filter(
      (l) => l.status === "contacted" || l.status === "qualified"
    ).length,
  });
}
