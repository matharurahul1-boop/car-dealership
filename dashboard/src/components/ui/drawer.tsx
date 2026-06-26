"use client";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export function Drawer({ open, onClose, title, children, width = "w-[480px]" }: DrawerProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-40 transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed top-0 right-0 h-full shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out",
          width,
          open ? "translate-x-0" : "translate-x-full"
        )}
        style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 transition-colors" style={{ color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
