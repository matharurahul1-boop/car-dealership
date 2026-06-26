import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const todayISO = ist.toISOString().split("T")[0];
  const todayStr =
    String(ist.getUTCDate()).padStart(2, "0") + "-" +
    String(ist.getUTCMonth() + 1).padStart(2, "0") + "-" +
    ist.getUTCFullYear();

  const weekStart = new Date(ist);
  weekStart.setUTCDate(ist.getUTCDate() - ist.getUTCDay());
  const weekStartISO = weekStart.toISOString().split("T")[0];

  // Last 14 days for chart
  const chartStart = new Date(ist);
  chartStart.setUTCDate(ist.getUTCDate() - 13);
  const chartStartISO = chartStart.toISOString().split("T")[0];

  const [leadsRes, bookingsRes, newTodayRes, chartLeadsRes] = await Promise.all([
    supabaseAdmin.from("leads").select("status, created_at"),
    supabaseAdmin.from("bookings").select("date, status"),
    supabaseAdmin.from("leads").select("id", { count: "exact" }).gte("created_at", `${todayISO}T00:00:00.000Z`),
    supabaseAdmin.from("leads").select("created_at").gte("created_at", `${chartStartISO}T00:00:00.000Z`),
  ]);

  const leads = leadsRes.data ?? [];
  const bookings = bookingsRes.data ?? [];

  const bookingsToday = bookings.filter(
    (b) => b.date === todayStr && b.status !== "cancelled"
  ).length;

  const bookingsThisWeek = bookings.filter((b) => {
    if (b.status === "cancelled" || !b.date) return false;
    const [d, m, y] = b.date.split("-");
    const iso = `${y}-${m}-${d}`;
    return iso >= weekStartISO && iso <= todayISO;
  }).length;

  const booked = leads.filter((l) => l.status === "booked").length;
  const conversionRate = leads.length > 0 ? Math.round((booked / leads.length) * 100) : 0;

  // Build daily leads chart data (last 14 days)
  const dailyMap: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(ist);
    d.setUTCDate(ist.getUTCDate() - i);
    const key = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    dailyMap[key] = 0;
    if (!dailyMap[`__label_${key}`]) dailyMap[`__label_${key}`] = label as unknown as number;
  }
  for (const lead of chartLeadsRes.data ?? []) {
    const key = lead.created_at.split("T")[0];
    if (key in dailyMap) dailyMap[key]++;
  }
  const dailyData = Object.entries(dailyMap)
    .filter(([k]) => !k.startsWith("__label_"))
    .map(([k, count]) => ({
      date: new Date(k).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      count,
    }));

  // Status breakdown for pie chart
  const statusColors: Record<string, string> = {
    new: "#6b7280",
    contacted: "#3b82f6",
    qualified: "#8b5cf6",
    booked: "#10b981",
    lost: "#ef4444",
  };
  const statusData = ["new", "contacted", "qualified", "booked", "lost"].map((s) => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: leads.filter((l) => l.status === s).length,
    color: statusColors[s],
  })).filter((s) => s.value > 0);

  return NextResponse.json({
    totalLeads: leads.length,
    newLeadsToday: newTodayRes.count ?? 0,
    bookingsThisWeek,
    bookingsToday,
    conversionRate,
    activeConversations: leads.filter((l) => l.status === "contacted" || l.status === "qualified").length,
    dailyData,
    statusData,
  });
}
