import { cn } from "@/lib/utils";

export function Card({ className, children, style }: { className?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className={cn("rounded-xl border shadow-sm", className)}
      style={{ background: "var(--bg-card)", borderColor: "var(--border)", ...style }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("px-6 py-4 border-b", className)} style={{ borderColor: "var(--border)" }}>
      {children}
    </div>
  );
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}
