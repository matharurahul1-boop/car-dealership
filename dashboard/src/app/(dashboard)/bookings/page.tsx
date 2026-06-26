"use client";
import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { TableRowSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatPhone } from "@/lib/utils";
import { CalendarCheck, Search, CheckCircle, XCircle, Clock, Plus, Download } from "lucide-react";
import type { Booking } from "@/lib/types";

type BookingStatus = Booking["status"];
const statusVariant = (s: string): "info" | "success" | "danger" =>
  ({ confirmed: "info", completed: "success", cancelled: "danger" } as Record<string, "info" | "success" | "danger">)[s] ?? "info";

export default function BookingsPage() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", car: "", date: "", time: "", notes: "" });

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

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const updateStatus = async (id: string, status: BookingStatus) => {
    setUpdating(id);
    try {
      await fetch("/api/bookings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
      toast(`Booking ${status}`, "success");
    } finally {
      setUpdating(null);
    }
  };

  const createBooking = async () => {
    if (!form.name || !form.phone || !form.car || !form.date || !form.time) {
      toast("Please fill all required fields", "error");
      return;
    }
    setSubmitting(true);
    try {
      // Convert date from YYYY-MM-DD to DD-MM-YYYY
      const [y, m, d] = form.date.split("-");
      const dateStr = `${d}-${m}-${y}`;
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date: dateStr }),
      });
      if (res.ok) {
        toast("Booking created!", "success");
        setShowModal(false);
        setForm({ name: "", phone: "", car: "", date: "", time: "", notes: "" });
        fetchBookings();
      } else {
        toast("Failed to create booking", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    const rows = [
      ["Name", "Phone", "Car", "Date", "Time", "Status"],
      ...filtered.map((b) => [b.name, b.phone, b.car, formatDate(b.date), b.time, b.status]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `bookings-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast("CSV exported", "success");
  };

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    return (filterStatus === "all" || b.status === filterStatus) &&
      (b.name.toLowerCase().includes(q) || b.phone.includes(q) || b.car.toLowerCase().includes(q));
  });

  const counts = { all: bookings.length, confirmed: bookings.filter((b) => b.status === "confirmed").length, completed: bookings.filter((b) => b.status === "completed").length, cancelled: bookings.filter((b) => b.status === "cancelled").length };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Bookings"
        subtitle={`${bookings.length} total test drives`}
        onRefresh={fetchBookings}
        refreshing={loading}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={exportCSV}><Download size={14} /> Export</Button>
            <Button size="sm" onClick={() => setShowModal(true)}><Plus size={14} /> New Booking</Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-4 flex gap-2 flex-wrap">
          {(["all", "confirmed", "completed", "cancelled"] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${filterStatus === s ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-200"}`}>
              {s} ({counts[s]})
            </button>
          ))}
        </div>

        <div className="px-6 pt-3 pb-3">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, car…" className="w-full pl-8 pr-4 py-2 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="bg-gray-900 rounded-xl border border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-950/50">
                    {["Customer", "Phone", "Car", "Date", "Time", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-16 text-center">
                      <CalendarCheck size={36} className="mx-auto text-gray-200 mb-2" />
                      <p className="text-gray-400 text-sm">No bookings found</p>
                    </td></tr>
                  ) : filtered.map((b) => (
                    <tr key={b.id} className="border-b border-gray-700 hover:bg-gray-950/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-white">{b.name}</td>
                      <td className="px-6 py-3 text-gray-400 font-mono text-xs">{formatPhone(b.phone)}</td>
                      <td className="px-6 py-3 text-gray-200">{b.car}</td>
                      <td className="px-6 py-3 text-gray-200">{formatDate(b.date)}</td>
                      <td className="px-6 py-3 font-medium text-gray-200">{b.time}</td>
                      <td className="px-6 py-3"><Badge variant={statusVariant(b.status)}>{b.status}</Badge></td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          {b.status === "confirmed" && (
                            <>
                              <button onClick={() => updateStatus(b.id, "completed")} disabled={updating === b.id} title="Mark completed" className="text-green-500 hover:text-green-700 disabled:opacity-40"><CheckCircle size={16} /></button>
                              <button onClick={() => updateStatus(b.id, "cancelled")} disabled={updating === b.id} title="Cancel" className="text-red-400 hover:text-red-600 disabled:opacity-40"><XCircle size={16} /></button>
                            </>
                          )}
                          {b.status === "cancelled" && (
                            <button onClick={() => updateStatus(b.id, "confirmed")} disabled={updating === b.id} title="Re-confirm" className="text-blue-500 hover:text-blue-700 disabled:opacity-40"><Clock size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create Booking Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Test Drive Booking">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Customer Name *" placeholder="Rahul Sharma" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input label="Phone *" placeholder="919876543210" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <Input label="Car Model *" placeholder="e.g. Maruti Swift VXi" value={form.car} onChange={(e) => setForm((f) => ({ ...f, car: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date *" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            <Input label="Time *" type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
          </div>
          <Input label="Notes" placeholder="Optional notes…" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={createBooking} loading={submitting} className="flex-1">Create Booking</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
