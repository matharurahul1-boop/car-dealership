"use client";
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, ExternalLink } from "lucide-react";

function CopyableValue({ label, value, masked }: { label: string; value: string; masked?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const display = masked ? value.slice(0, 8) + "..." + value.slice(-6) : value;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm font-mono text-gray-800">{display}</p>
      </div>
      <button
        onClick={copy}
        className="text-gray-400 hover:text-blue-600 transition-colors ml-4"
        title="Copy"
      >
        {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const testWhatsApp = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "919833XXXXXX",
          message: "Test message from Handysolver Car Dealership dashboard ✅",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ ok: true, message: "WhatsApp API is working correctly!" });
      } else {
        setTestResult({ ok: false, message: JSON.stringify(data.error || data) });
      }
    } catch {
      setTestResult({ ok: false, message: "Network error — check N8N / API status" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" subtitle="Configuration and integrations" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl">

        {/* WhatsApp Config */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">WhatsApp Cloud API</h2>
              <Badge variant="success">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CopyableValue label="Phone Number ID" value="1093164003887900" />
            <CopyableValue
              label="System User Token (long-lived)"
              value="EAAXR63I2WKMBR4KQao7Xs1CtKHxnIMT4IUz8jngkz3ZC6NjqR7Bh2btKZCyKYOyFo3uAzj65Pz3KF2sOk1sWBsHRDlXF2WZAcV6PIMRqHtfZByfcBlfTD1m8hO6qQehTNUDbSNVqNwCTToXX3C9wlRtMwhX65XfxhlvX6c3cMTZApb4t1bCe0GA6xSOtKAQZDZD"
              masked
            />
            <CopyableValue label="Test Number" value="+1 (555) 672-2118" />
            <CopyableValue label="Business Portfolio" value="AutoPrime Car Dealership" />
          </CardContent>
        </Card>

        {/* N8N Config */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">N8N Workflows</h2>
              <Badge variant="info">Render.com</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CopyableValue label="N8N Host" value="https://n8n-car-dealership.onrender.com" />
            <CopyableValue label="New Lead Webhook" value="https://n8n-car-dealership.onrender.com/webhook/new-lead" />
            <CopyableValue label="WhatsApp Webhook" value="https://n8n-car-dealership.onrender.com/webhook/whatsapp-webhook" />
            <div className="mt-3 pt-3 border-t border-gray-50">
              <p className="text-xs font-semibold text-gray-500 mb-2">Active Workflows</p>
              <div className="space-y-1.5">
                {[
                  "1. Meta Webhook Verify",
                  "2. New Lead Webhook",
                  "3. WhatsApp Reply Handler",
                  "5. Keep Server Warm (10min ping)",
                  "6. Same Day Reminder (9AM IST)",
                ].map((w) => (
                  <div key={w} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <p className="text-sm text-gray-700">{w}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google Sheets Config */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Google Apps Script / Sheets</h2>
              <Badge variant="success">Connected</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CopyableValue
              label="Apps Script URL"
              value="https://script.google.com/macros/s/AKfycbzoYisQi9UxCYe7NBypqS3jQTAWOkGgfvyLF09Rkb_XX34AN6MTfbQpsbZk03uIpLCs/exec"
            />
            <CopyableValue label="Google Sheet ID" value="1n9c6yjKy7Ylgq9aXREO1Pa4T7-mOkddllIDxznfVDhs" />
            <div className="mt-3 pt-3 border-t border-gray-50">
              <p className="text-xs font-semibold text-gray-500 mb-2">Available Actions</p>
              <div className="flex flex-wrap gap-2">
                {["getLeads", "addLead", "getAllBookings", "updateBookingStatus", "getConversations", "markSent"].map((a) => (
                  <code key={a} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {a}
                  </code>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Config */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">AI Configuration</h2>
          </CardHeader>
          <CardContent>
            <CopyableValue label="Provider" value="Groq" />
            <CopyableValue label="Model" value="llama-3.1-8b-instant" />
            <CopyableValue label="API Key" value="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" masked />
          </CardContent>
        </Card>

        {/* GitHub */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">GitHub (N8N Workflows)</h2>
              <a
                href="https://github.com/matharurahul1-boop/car-dealership"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
              >
                View Repo <ExternalLink size={13} />
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <CopyableValue label="Repository" value="matharurahul1-boop/car-dealership (private)" />
            <CopyableValue label="Workflows Path" value="n8n/" />
            <CopyableValue label="Branch" value="master" />
          </CardContent>
        </Card>

        {/* Test Panel */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Connection Test</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Test the WhatsApp API connection. Replace the phone number in the API route with a verified test number before running.
            </p>
            <Button onClick={testWhatsApp} loading={testing} variant="secondary">
              Test WhatsApp API
            </Button>
            {testResult && (
              <div
                className={`mt-3 p-3 rounded-lg text-sm ${testResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
              >
                {testResult.message}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
