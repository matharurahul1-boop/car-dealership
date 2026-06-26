"use client";
import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { formatPhone } from "@/lib/utils";
import { Plus, Search, UserPlus } from "lucide-react";
import type { Lead } from "@/lib/types";

type LeadStatus = Lead["status"];

const statusVariant: Record<LeadStatus, "default" | "info" | "warning" | "success" | "danger" | "secondary"> = {
  new: "default",
  contacted: "info",
  qualified: "secondary",
  booked: "success",
  lost: "danger",
};

const ALL_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "booked", "lost"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", interest: "", source: "WhatsApp" });

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

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filtered = leads.filter((l) => {
    const matchSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      l.interest?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleAddLead = async () => {
    if (!form.name || !form.phone) return;
    setSubmitting(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setShowModal(false);
      setForm({ name: "", phone: "", interest: "", source: "WhatsApp" });
      fetchLeads();
    } finally {
      setSubmitting(false);
    }
  };

  const counts = ALL_STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: leads.filter((l) => l.status === s).length }),
    {} as Record<LeadStatus, number>
  );

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Leads"
        subtitle={`${leads.length} total leads`}
        onRefresh={fetchLeads}
        refreshing={loading}
        actions={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Lead
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* Status Filter Tabs */}
        <div className="px-6 pt-4 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterStatus === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            All ({leads.length})
          </button>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${filterStatus === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {s} ({counts[s] ?? 0})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-6 pt-3 pb-4">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, interest…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="px-6 pb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="text-center py-16 text-gray-400">Loading leads...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <UserPlus size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">No leads found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Interest</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((lead) => (
                      <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3 font-medium text-gray-900">{lead.name}</td>
                        <td className="px-6 py-3 text-gray-500 font-mono text-xs">{formatPhone(lead.phone)}</td>
                        <td className="px-6 py-3 text-gray-700">{lead.interest || "—"}</td>
                        <td className="px-6 py-3 text-gray-500">{lead.source || "WhatsApp"}</td>
                        <td className="px-6 py-3">
                          <Badge variant={statusVariant[lead.status]}>{lead.status}</Badge>
                        </td>
                        <td className="px-6 py-3 text-gray-400 text-xs">
                          {lead.createdAt
                            ? new Date(lead.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                              })
                            : "—"}
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

      {/* Add Lead Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Lead">
        <div className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Rahul Sharma"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Phone Number *"
            placeholder="e.g. 919876543210"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <Input
            label="Car Interest"
            placeholder="e.g. Swift, Nexon, Fortuner"
            value={form.interest}
            onChange={(e) => setForm((f) => ({ ...f, interest: e.target.value }))}
          />
          <Select
            label="Source"
            value={form.source}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
          >
            <option>WhatsApp</option>
            <option>Website</option>
            <option>Referral</option>
            <option>Walk-in</option>
            <option>Social Media</option>
          </Select>
          <p className="text-xs text-gray-400">
            A WhatsApp welcome message will be sent automatically via N8N.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAddLead} loading={submitting} className="flex-1">
              Add Lead &amp; Send WhatsApp
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
