"use client";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl mb-4">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>Something went wrong</h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{error.message || "An unexpected error occurred."}</p>
        <button onClick={reset} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          Try again
        </button>
      </div>
    </div>
  );
}
