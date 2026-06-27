import Link from "next/link";
import { Car } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
          <Car size={28} className="text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--text)" }}>404</h1>
        <p className="mb-6" style={{ color: "var(--text-muted)" }}>This page doesn&apos;t exist.</p>
        <Link href="/dashboard" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
