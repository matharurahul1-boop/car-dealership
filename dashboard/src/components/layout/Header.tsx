"use client";
import { RefreshCw, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { InstallPWA } from "@/components/InstallPWA";

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
    <div
      className="flex items-center justify-between pl-4 sm:pl-6 pr-3 sm:pr-6 py-3 sm:py-4 border-b shrink-0 gap-2"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="min-w-0">
        <h1 className="text-base sm:text-xl font-bold truncate" style={{ color: "var(--text)" }}>{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm mt-0.5 hidden sm:block truncate" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {actions}
        <InstallPWA />
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
          title="Notifications"
        >
          <Bell size={18} />
        </button>
      </div>
    </div>
  );
}
