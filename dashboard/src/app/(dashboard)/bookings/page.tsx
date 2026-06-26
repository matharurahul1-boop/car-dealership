"use client";
import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatPhone } from "@/lib/utils";
import { CalendarCheck, Search, CheckCircle, XCircle, Clock } from "lucide-react";
import type { Booking } from "@/lib/types";

type BookingStatus = Booking["status"];

const statusVariant: Record<BookingStatus, "default" | "info" | "success" | "danger"> = {
  confirmed: "info",
  completed: "success",
  cancelled: "danger",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateStatus = async (id: string, status: BookingStatus) => {
    setUpdating(id);
    try {
      await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );
    } finally {
      setUpdating(null);
    }
  };

  const filtered = bookings.filter((b) => {
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    const matchSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.phone.includes(search) ||
      b.car.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    all: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Bookings"
        subtitle={`${bookings.length} total test drives`}
        onRefresh={fetchBookings}
        refreshing={loading}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-4 flex gap-2 flex-wrap">
          {(["all", "confirmed", "completed", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${filterStatus === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {s} ({counts[s]})
            </button>
          ))}
        </div>

        <div className="px-6 pt-3 pb-4">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, car…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="text-center py-16 text-gray-400">Loading bookings...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <CalendarCheck size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">No bookings found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Car</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b) => (
                      <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3 font-medium text-gray-900">{b.name}</td>
                        <td className="px-6 py-3 text-gray-500 font-mono text-xs">{formatPhone(b.phone)}</td>
                        <td className="px-6 py-3 text-gray-700">{b.car}</td>
                        <td className="px-6 py-3 text-gray-700">{formatDate(b.date)}</td>
                        <td className="px-6 py-3 text-gray-700 font-medium">{b.time}</td>
                        <td className="px-6 py-3">
                          <Badge variant={statusVariant[b.status]}>{b.status}</Badge>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex gap-2">
                            {b.status === "confirmed" && (
                              <>
                                <button
                                  onClick={() => updateStatus(b.id, "completed")}
                                  disabled={updating === b.id}
                                  title="Mark completed"
                                  className="text-green-500 hover:text-green-700 disabled:opacity-50"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() => updateStatus(b.id, "cancelled")}
                                  disabled={updating === b.id}
                                  title="Cancel booking"
                                  className="text-red-400 hover:text-red-600 disabled:opacity-50"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                            {b.status === "cancelled" && (
                              <button
                                onClick={() => updateStatus(b.id, "confirmed")}
                                disabled={updating === b.id}
                                title="Reconfirm booking"
                                className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
                              >
                                <Clock size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
