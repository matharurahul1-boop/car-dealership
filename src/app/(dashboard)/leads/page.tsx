"use client";
import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Drawer } from "@/components/ui/drawer";
import { Input, Select } from "@/components/ui/input";
import { TableRowSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatPhone } from "@/lib/utils";
import { Plus, Search, UserPlus, Download, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import type { Lead } from "@/lib/types";

type LeadStatus = Lead["status"];

const STATUS_OPTIONS: LeadStatus[] = ["new", "contacted", "qualified", "booked", "lost"];
const statusVariant = (s: string): "default" | "info" | "secondary" | "success" | "danger" =>
  ({ new: "default", contacted: "info", qualified: "secondary", booked: "success", lost: "danger" } as Record<string, "default" | "info" | "secondary" | "success" | "danger">)[s] ?? "default";

const PAGE_SIZE = 20;

export default function LeadsPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", interest: "", source: "WhatsApp" });
  const [selected, setSelected] = useState<Lead | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      setLeads(data.leads || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = l.name.toLowerCase().includes(q) || l.phone.includes(q) || (l.interest || "").toLowerCase().includes(q);
    return matchSearch && (filterStatus === "all" || l.status === filterStatus);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const counts = STATUS_OPTIONS.reduce((acc, s) => ({ ...acc, [s]: leads.filter((l) => l.status === s).length }), {} as Record<LeadStatus, number>);

  const updateStatus = async (id: string, status: LeadStatus) => {
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : prev);
    toast(`Status updated to "${status}"`, "success");
  };

  const saveNotes = async () => {
    if (!selected) return;
    setSavingNotes(true);
    await fetch(`/api/leads/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes }) });
    setLeads((prev) => prev.map((l) => l.id === selected.id ? { ...l, notes } : l));
    setSavingNotes(false);
    toast("Notes saved", "success");
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setSelected(null);
    toast("Lead deleted", "info");
  };

  const addLead = async () => {
    if (!form.name || !form.phone) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        toast("Lead added & WhatsApp message sent!", "success");
        setShowModal(false);
        setForm({ name: "", phone: "", interest: "", source: "WhatsApp" });
        fetchLeads();
      } else {
        toast("Failed to add lead", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    const rows = [
      ["Name", "Phone", "Interest", "Status", "Source", "Created"],
      ...filtered.map((l) => [l.name, l.phone, l.interest || "", l.status, l.source || "", new Date(l.createdAt || "").toLocaleDateString("en-IN")]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast("CSV exported", "success");
  };

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Leads"
        subtitle={`${leads.length} total leads`}
        onRefresh={fetchLeads}
        refreshing={loading}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={exportCSV}><Download size={14} /> Export</Button>
            <Button size="sm" onClick={() => setShowModal(true)}><Plus size={14} /> Add Lead</Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* Status filter */}
        <div className="px-6 pt-4 flex gap-2 flex-wrap">
          {(["all", ...STATUS_OPTIONS] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${filterStatus === s ? "bg-blue-600 text-[var(--text)]" : "bg-[var(--bg-muted)] text-[var(--text-sub)] hover:bg-[var(--bg-hover)]"}`}
            >
              {s} ({s === "all" ? leads.length : counts[s as LeadStatus] ?? 0})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-6 pt-3 pb-3">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, phone, interest…" className="w-full pl-8 pr-4 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
        </div>

        {/* Table */}
        <div className="px-6 pb-6">
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg)]/50">
                    {["Name", "Phone", "Interest", "Source", "Status", "Created", ""].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-16 text-center">
                      <UserPlus size={36} className="mx-auto text-[var(--text-sub)] mb-2" />
                      <p className="text-[var(--text-muted)] text-sm">No leads found</p>
                    </td></tr>
                  ) : paginated.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => { setSelected(lead); setNotes(lead.notes || ""); }}
                      className="border-b border-[var(--border)] hover:bg-blue-50/30 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-3 font-medium text-[var(--text)]">{lead.name}</td>
                      <td className="px-6 py-3 text-[var(--text-muted)] font-mono text-xs">{formatPhone(lead.phone)}</td>
                      <td className="px-6 py-3 text-[var(--text-sub)]">{lead.interest || "—"}</td>
                      <td className="px-6 py-3 text-[var(--text-muted)]">{lead.source || "WhatsApp"}</td>
                      <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                          className="text-xs border border-[var(--border)] rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-[var(--bg-card)] capitalize"
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-3 text-[var(--text-muted)] text-xs">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                      </td>
                      <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => deleteLead(lead.id)} className="text-[var(--text-sub)] hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--border)] bg-[var(--bg)]/30">
                <p className="text-xs text-[var(--text-muted)]">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
                <div className="flex gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-sub)] hover:bg-[var(--bg-muted)] disabled:opacity-30">
                    <ChevronLeft size={15} />
                  </button>
                  <span className="px-3 py-1 text-xs text-[var(--text-sub)]">{page} / {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-sub)] hover:bg-[var(--bg-muted)] disabled:opacity-30">
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lead Detail Drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Lead Details">
        {selected && (
          <div className="p-6 space-y-5">
            {/* Info */}
            <div className="bg-[var(--bg)] rounded-xl p-4 space-y-3">
              {[
                ["Name", selected.name],
                ["Phone", formatPhone(selected.phone)],
                ["Interest", selected.interest || "—"],
                ["Source", selected.source || "WhatsApp"],
                ["Created", selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-muted)] font-medium">{k}</span>
                  <span className="text-sm text-[var(--text-sub)] font-medium">{v}</span>
                </div>
              ))}
            </div>

            {/* Status */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected.id, s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-all ${selected.status === s ? "border-blue-600 bg-blue-600 text-[var(--text)]" : "border-[var(--border)] text-[var(--text-sub)] hover:border-blue-400"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Sales Notes</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add notes about this lead…"
                className="w-full text-sm border border-[var(--border)] rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
              />
              <Button size="sm" onClick={saveNotes} loading={savingNotes} className="mt-2">Save Notes</Button>
            </div>

            {/* Danger */}
            <div className="pt-2 border-t border-[var(--border)]">
              <Button variant="danger" size="sm" onClick={() => deleteLead(selected.id)}>
                <Trash2 size={14} /> Delete Lead
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add Lead Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Lead">
        <div className="space-y-4">
          <Input label="Full Name *" placeholder="e.g. Rahul Sharma" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Phone Number *" placeholder="e.g. 919876543210" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <Input label="Car Interest" placeholder="e.g. Swift, Nexon, Fortuner" value={form.interest} onChange={(e) => setForm((f) => ({ ...f, interest: e.target.value }))} />
          <Select label="Source" value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}>
            <option>WhatsApp</option><option>Website</option><option>Referral</option><option>Walk-in</option><option>Social Media</option>
          </Select>
          <p className="text-xs text-[var(--text-muted)]">A WhatsApp welcome message will be sent automatically.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={addLead} loading={submitting} className="flex-1">Add Lead &amp; Send WhatsApp</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
