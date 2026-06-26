"use client";
import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LeadsLineChart, StatusPieChart } from "@/components/dashboard/LeadsChart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCardSkeleton } from "@/components/ui/skeleton";
import { formatDate, formatPhone } from "@/lib/utils";
import { Users, CalendarCheck, MessageCircle, TrendingUp, Car, Clock } from "lucide-react";
import type { Booking } from "@/lib/types";

interface Stats {
  totalLeads: number;
  newLeadsToday: number;
  bookingsThisWeek: number;
  bookingsToday: number;
  conversionRate: number;
  activeConversations: number;
  dailyData: { date: string; count: number }[];
  statusData: { name: string; value: number; color: string }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/bookings"),
      ]);
      const statsData = await statsRes.json();
      const bookingsData = await bookingsRes.json();
      setStats(statsData);

      const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
      const todayStr =
        String(ist.getUTCDate()).padStart(2, "0") + "-" +
        String(ist.getUTCMonth() + 1).padStart(2, "0") + "-" +
        ist.getUTCFullYear();
      setTodayBookings(
        (bookingsData.bookings || []).filter(
          (b: Booking) => b.date === todayStr && b.status !== "cancelled"
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statusVariant = (s: string) =>
    ({ confirmed: "info", completed: "success", cancelled: "danger" } as Record<string, "info" | "success" | "danger">)[s] ?? "default";

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" subtitle="Handysolver Car Dealership Overview" onRefresh={fetchData} refreshing={loading} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <StatsCardSkeleton key={i} />)
          ) : (
            <>
              <StatsCard title="Total Leads" value={stats?.totalLeads ?? 0} subtitle={`${stats?.newLeadsToday ?? 0} new today`} icon={Users} iconColor="text-blue-600" iconBg="bg-blue-50" />
              <StatsCard title="Bookings This Week" value={stats?.bookingsThisWeek ?? 0} subtitle={`${stats?.bookingsToday ?? 0} today`} icon={CalendarCheck} iconColor="text-green-600" iconBg="bg-green-50" />
              <StatsCard title="Active Conversations" value={stats?.activeConversations ?? 0} subtitle="Contacted + Qualified" icon={MessageCircle} iconColor="text-purple-600" iconBg="bg-purple-50" />
              <StatsCard title="Conversion Rate" value={`${stats?.conversionRate ?? 0}%`} subtitle="Lead → Booking" icon={TrendingUp} iconColor="text-orange-600" iconBg="bg-orange-50" />
              <StatsCard title="Test Drives Today" value={todayBookings.length} subtitle="Confirmed appointments" icon={Car} iconColor="text-cyan-600" iconBg="bg-cyan-50" />
              <StatsCard title="New Leads Today" value={stats?.newLeadsToday ?? 0} subtitle="Via WhatsApp" icon={Clock} iconColor="text-pink-600" iconBg="bg-pink-50" />
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="font-semibold text-gray-900 text-sm">Leads — Last 14 Days</h2>
            </CardHeader>
            <CardContent>
              {loading || !stats?.dailyData?.length ? (
                <div className="h-[220px] flex items-center justify-center text-gray-300 text-sm">No data yet</div>
              ) : (
                <LeadsLineChart dailyData={stats.dailyData} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 text-sm">Lead Status Breakdown</h2>
            </CardHeader>
            <CardContent>
              {loading || !stats?.statusData?.length ? (
                <div className="h-[220px] flex items-center justify-center text-gray-300 text-sm">No data yet</div>
              ) : (
                <StatusPieChart data={stats.statusData} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Bookings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Today&apos;s Test Drives</h2>
              <Badge variant="info">{todayBookings.length} scheduled</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
            ) : todayBookings.length === 0 ? (
              <div className="text-center py-10">
                <Car size={36} className="mx-auto text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm">No test drives today</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      {["Customer", "Phone", "Car", "Time", "Status"].map((h) => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {todayBookings.map((b) => (
                      <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium text-gray-900">{b.name}</td>
                        <td className="px-6 py-3 text-gray-500 font-mono text-xs">{formatPhone(b.phone)}</td>
                        <td className="px-6 py-3 text-gray-700">{b.car}</td>
                        <td className="px-6 py-3 font-medium text-gray-700">{b.time}</td>
                        <td className="px-6 py-3"><Badge variant={statusVariant(b.status)}>{b.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
