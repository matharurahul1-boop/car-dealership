"use client";
import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CheckCircle, Copy, ExternalLink, Database, MessageCircle, Zap, Github, Bot, Bell } from "lucide-react";

function CopyRow({ label, value, masked }: { label: string; value: string; masked?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const display = masked ? value.slice(0, 10) + "••••••••" + value.slice(-4) : value;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0 gap-4">
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-muted)] mb-0.5">{label}</p>
        <p className="text-sm font-mono text-[var(--text-sub)] break-all">{display}</p>
      </div>
      <button onClick={copy} className="shrink-0 text-[var(--text-sub)] hover:text-blue-500 transition-colors" title="Copy">
        {copied ? <CheckCircle size={15} className="text-green-500" /> : <Copy size={15} />}
      </button>
    </div>
  );
}

function StatusDot({ ok = true }: { ok?: boolean }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />;
}

const HOURS_OPTIONS = [
  { value: 1,  label: "1 hour before" },
  { value: 2,  label: "2 hours before" },
  { value: 6,  label: "6 hours before" },
  { value: 12, label: "12 hours before" },
  { value: 24, label: "24 hours before (1 day)" },
  { value: 48, label: "48 hours before (2 days)" },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState("");

  // Reminder settings state
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderHours, setReminderHours] = useState(24);
  const [reminderMessage, setReminderMessage] = useState(
    "Hi {name}! 🚗 Reminder: your test drive for {car} is scheduled for {date} at {time}. See you at Handysolver Car Dealership!"
  );
  const [savingReminder, setSavingReminder] = useState(false);
  const [loadingReminder, setLoadingReminder] = useState(true);

  useEffect(() => {
    fetch("/api/reminder-settings")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setReminderEnabled(d.enabled);
          setReminderHours(d.hoursBefore);
          setReminderMessage(d.message);
        }
      })
      .finally(() => setLoadingReminder(false));
  }, []);

  const saveReminderSettings = async () => {
    setSavingReminder(true);
    try {
      const res = await fetch("/api/reminder-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: reminderEnabled, hoursBefore: reminderHours, message: reminderMessage }),
      });
      if (res.ok) toast("Reminder settings saved", "success");
      else toast("Failed to save settings", "error");
    } finally {
      setSavingReminder(false);
    }
  };

  const testWhatsApp = async () => {
    if (!testPhone) { toast("Enter a phone number first", "error"); return; }
    setTesting(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testPhone, message: "✅ Test message from Handysolver Car Dealership dashboard!" }),
      });
      if (res.ok) toast("Test message sent successfully!", "success");
      else toast("Failed — check token or phone number", "error");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" subtitle="Integrations and configuration" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5 max-w-3xl">

        {/* Supabase */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-green-50 rounded-lg"><Database size={16} className="text-green-600" /></div>
                <h2 className="font-semibold text-[var(--text)]">Supabase Database</h2>
              </div>
              <div className="flex items-center gap-1.5"><StatusDot /><Badge variant="success">Connected</Badge></div>
            </div>
          </CardHeader>
          <CardContent>
            <CopyRow label="Project URL" value="https://bvbwxgxrxqhgaupssqkg.supabase.co" />
            <CopyRow label="Publishable Key" value="Stored securely in environment variables" />
            <CopyRow label="Organization" value="matharurahul1-boop's Org · AWS ap-south-1" />
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">Tables</p>
              <div className="flex gap-2 flex-wrap">
                {["leads", "bookings", "messages", "app_settings", "reminders_log"].map((t) => (
                  <code key={t} className="text-xs bg-[var(--bg-muted)] text-[var(--text-sub)] px-2.5 py-1 rounded-lg">{t}</code>
                ))}
              </div>
            </div>
            <div className="mt-3 pt-1">
              <a
                href="https://supabase.com/dashboard/project/bvbwxgxrxqhgaupssqkg/editor"
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Open Table Editor <ExternalLink size={11} />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-green-50 rounded-lg"><MessageCircle size={16} className="text-green-600" /></div>
                <h2 className="font-semibold text-[var(--text)]">WhatsApp Cloud API</h2>
              </div>
              <div className="flex items-center gap-1.5"><StatusDot /><Badge variant="success">Active</Badge></div>
            </div>
          </CardHeader>
          <CardContent>
            <CopyRow label="Phone Number ID" value="1093164003887900" />
            <CopyRow label="System User Token (long-lived)" value="Stored securely in environment variables" />
            <CopyRow label="Test Number" value="+1 (555) 672-2118" />
            <CopyRow label="Business Portfolio" value="AutoPrime Car Dealership" />
            <div className="mt-4 pt-3 border-t border-[var(--border)]">
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">Send Test Message</p>
              <div className="flex gap-2">
                <input
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="91XXXXXXXXXX"
                  className="flex-1 border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-[var(--bg-input)] text-[var(--text)] placeholder:text-[var(--text-muted)]"
                />
                <Button variant="secondary" size="sm" onClick={testWhatsApp} loading={testing}>
                  Send Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* N8N */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-orange-50 rounded-lg"><Zap size={16} className="text-orange-500" /></div>
                <h2 className="font-semibold text-[var(--text)]">N8N Automation</h2>
              </div>
              <Badge variant="warning">Render.com</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CopyRow label="N8N Host" value="https://n8n-car-dealership.onrender.com" />
            <CopyRow label="New Lead Webhook" value="https://n8n-car-dealership.onrender.com/webhook/new-lead" />
            <CopyRow label="WhatsApp Webhook" value="https://n8n-car-dealership.onrender.com/webhook/whatsapp-webhook" />
            <CopyRow label="Dashboard Message Endpoint" value="/api/n8n/message" />
            <CopyRow label="Reminder Cron Endpoint" value="/api/reminders/run (daily 03:00 UTC / 8:30 AM IST)" />
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">Active Workflows</p>
              <div className="space-y-1.5">
                {[
                  "1. Meta Webhook Verify",
                  "2. New Lead Webhook",
                  "3. WhatsApp Reply Handler (Groq AI)",
                  "4. Sync to Dashboard (saves leads, messages, bookings)",
                  "5. Keep Server Warm (every 10 min)",
                  "6. Same Day Reminder (9 AM IST)",
                ].map((w) => (
                  <div key={w} className="flex items-center gap-2">
                    <StatusDot />
                    <p className="text-sm text-[var(--text-sub)]">{w}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-purple-50 rounded-lg"><Bot size={16} className="text-purple-600" /></div>
              <h2 className="font-semibold text-[var(--text)]">AI Configuration</h2>
            </div>
          </CardHeader>
          <CardContent>
            <CopyRow label="Provider" value="Groq" />
            <CopyRow label="Model" value="llama-3.1-8b-instant" />
            <CopyRow label="API Key" value="Stored securely in environment variables" />
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-50 rounded-lg"><Bell size={16} className="text-blue-600" /></div>
                <h2 className="font-semibold text-[var(--text)]">Test Drive Reminders</h2>
              </div>
              <Badge variant={reminderEnabled ? "success" : "warning"}>
                {reminderEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loadingReminder ? (
              <p className="text-sm text-[var(--text-muted)] py-2">Loading…</p>
            ) : (
              <div className="space-y-4">
                {/* Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">Send WhatsApp reminder</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Auto-send a reminder message before each test drive</p>
                  </div>
                  <button
                    onClick={() => setReminderEnabled((v) => !v)}
                    className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${reminderEnabled ? "bg-blue-600" : "bg-gray-400"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${reminderEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                {/* Hours before */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Send reminder</label>
                  <select
                    value={reminderHours}
                    onChange={(e) => setReminderHours(Number(e.target.value))}
                    disabled={!reminderEnabled}
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--bg-input)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                  >
                    {HOURS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Message template */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
                    Message template
                    <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">
                      Use {"{name}"}, {"{car}"}, {"{date}"}, {"{time}"}
                    </span>
                  </label>
                  <textarea
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    disabled={!reminderEnabled}
                    rows={3}
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--bg-input)] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 resize-none"
                  />
                  {/* Preview */}
                  <div className="mt-2 p-3 bg-[var(--bg-muted)] rounded-lg">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Preview</p>
                    <p className="text-xs text-[var(--text-sub)]">
                      {reminderMessage
                        .replace("{name}", "Rahul")
                        .replace("{car}", "Nexon EV")
                        .replace("{date}", "03-07-2026")
                        .replace("{time}", "10am")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Button onClick={saveReminderSettings} loading={savingReminder} size="sm">
                    Save Reminder Settings
                  </Button>
                  <p className="text-xs text-[var(--text-muted)]">Reminders run automatically daily at 8:30 AM IST via Vercel Cron</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* GitHub */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-[var(--bg-muted)] rounded-lg"><Github size={16} className="text-[var(--text-sub)]" /></div>
                <h2 className="font-semibold text-[var(--text)]">GitHub Repository</h2>
              </div>
              <a href="https://github.com/matharurahul1-boop/car-dealership" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs">
                View Repo <ExternalLink size={12} />
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <CopyRow label="Repository" value="matharurahul1-boop/car-dealership (private)" />
            <CopyRow label="N8N Workflows" value="car-dealership/" />
            <CopyRow label="Dashboard App" value="dashboard/" />
            <CopyRow label="Branch" value="master" />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
