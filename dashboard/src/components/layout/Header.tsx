"use client";
import { RefreshCw, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, onRefresh, refreshing, actions }: HeaderProps) {
  const { theme, toggle } = useTheme();

  return (
    <div className="flex items-center justify-between pl-14 lg:pl-6 pr-6 py-4 border-b"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>{title}</h1>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ color: "var(--text-muted)" }}
            title="Refresh"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>
        )}
        <button
          onClick={toggle}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--text-muted)", background: "var(--bg-muted)" }}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button
          className="p-2 rounded-lg transition-colors relative"
          style={{ color: "var(--text-muted)" }}
        >
          <Bell size={18} />
        </button>
      </div>
    </div>
  );
}
