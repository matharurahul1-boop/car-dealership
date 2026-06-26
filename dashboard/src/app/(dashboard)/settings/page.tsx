"use client";
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CheckCircle, Copy, ExternalLink, Database, MessageCircle, Zap, Github, Bot } from "lucide-react";

function CopyRow({ label, value, masked }: { label: string; value: string; masked?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const display = masked ? value.slice(0, 10) + "••••••••" + value.slice(-4) : value;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 gap-4">
      <div className="min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-mono text-gray-800 break-all">{display}</p>
      </div>
      <button onClick={copy} className="shrink-0 text-gray-300 hover:text-blue-500 transition-colors" title="Copy">
        {copied ? <CheckCircle size={15} className="text-green-500" /> : <Copy size={15} />}
      </button>
    </div>
  );
}

function StatusDot({ ok = true }: { ok?: boolean }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState("");

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
                <h2 className="font-semibold text-gray-900">Supabase Database</h2>
              </div>
              <div className="flex items-center gap-1.5"><StatusDot /><Badge variant="success">Connected</Badge></div>
            </div>
          </CardHeader>
          <CardContent>
            <CopyRow label="Project URL" value="https://bvbwxgxrxqhgaupssqkg.supabase.co" />
            <CopyRow label="Publishable Key" value="Stored securely in environment variables" />
            <CopyRow label="Organization" value="matharurahul1-boop's Org · AWS ap-south-1" />
            <div className="mt-3 pt-3 border-t border-gray-50">
              <p className="text-xs font-semibold text-gray-500 mb-2">Tables</p>
              <div className="flex gap-2 flex-wrap">
                {["leads", "bookings", "messages"].map((t) => (
                  <code key={t} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">{t}</code>
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
                <h2 className="font-semibold text-gray-900">WhatsApp Cloud API</h2>
              </div>
              <div className="flex items-center gap-1.5"><StatusDot /><Badge variant="success">Active</Badge></div>
            </div>
          </CardHeader>
          <CardContent>
            <CopyRow label="Phone Number ID" value="1093164003887900" />
            <CopyRow label="System User Token (long-lived)" value="Stored securely in environment variables" />
            <CopyRow label="Test Number" value="+1 (555) 672-2118" />
            <CopyRow label="Business Portfolio" value="AutoPrime Car Dealership" />
            <div className="mt-4 pt-3 border-t border-gray-50">
              <p className="text-xs font-semibold text-gray-500 mb-2">Send Test Message</p>
              <div className="flex gap-2">
                <input
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="91XXXXXXXXXX"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <h2 className="font-semibold text-gray-900">N8N Automation</h2>
              </div>
              <Badge variant="warning">Render.com</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CopyRow label="N8N Host" value="https://n8n-car-dealership.onrender.com" />
            <CopyRow label="New Lead Webhook" value="https://n8n-car-dealership.onrender.com/webhook/new-lead" />
            <CopyRow label="WhatsApp Webhook" value="https://n8n-car-dealership.onrender.com/webhook/whatsapp-webhook" />
            <CopyRow label="Dashboard Message Endpoint" value="/api/n8n/message" />
            <div className="mt-3 pt-3 border-t border-gray-50">
              <p className="text-xs font-semibold text-gray-500 mb-2">Active Workflows</p>
              <div className="space-y-1.5">
                {[
                  "1. Meta Webhook Verify",
                  "2. New Lead Webhook",
                  "3. WhatsApp Reply Handler (Groq AI)",
                  "5. Keep Server Warm (every 10 min)",
                  "6. Same Day Reminder (9 AM IST)",
                ].map((w) => (
                  <div key={w} className="flex items-center gap-2">
                    <StatusDot />
                    <p className="text-sm text-gray-700">{w}</p>
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
              <h2 className="font-semibold text-gray-900">AI Configuration</h2>
            </div>
          </CardHeader>
          <CardContent>
            <CopyRow label="Provider" value="Groq" />
            <CopyRow label="Model" value="llama-3.1-8b-instant" />
            <CopyRow label="API Key" value="Stored securely in environment variables" />
          </CardContent>
        </Card>

        {/* GitHub */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-gray-100 rounded-lg"><Github size={16} className="text-gray-700" /></div>
                <h2 className="font-semibold text-gray-900">GitHub Repository</h2>
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
