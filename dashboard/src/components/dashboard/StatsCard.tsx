import { LucideIcon } from "lucide-react";

type CardColor = "blue" | "green" | "purple" | "orange" | "cyan" | "pink";

const colorMap: Record<CardColor, { rgba: string; iconBg: string }> = {
  blue:   { rgba: "59,130,246",  iconBg: "rgba(59,130,246,0.15)" },
  green:  { rgba: "34,197,94",   iconBg: "rgba(34,197,94,0.15)" },
  purple: { rgba: "168,85,247",  iconBg: "rgba(168,85,247,0.15)" },
  orange: { rgba: "249,115,22",  iconBg: "rgba(249,115,22,0.15)" },
  cyan:   { rgba: "6,182,212",   iconBg: "rgba(6,182,212,0.15)" },
  pink:   { rgba: "236,72,153",  iconBg: "rgba(236,72,153,0.15)" },
};

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  color: CardColor;
  trend?: { value: number; positive: boolean };
}

export function StatsCard({ title, value, subtitle, icon: Icon, iconColor, color, trend }: StatsCardProps) {
  const { rgba, iconBg } = colorMap[color];

  return (
    <div
      className="rounded-xl border shadow-sm p-5"
      style={{
        background: `linear-gradient(135deg, rgba(${rgba},0.04) 0%, rgba(${rgba},0.14) 100%)`,
        borderColor: `rgba(${rgba},0.25)`,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: "var(--text-sub)" }}>{title}</p>
          <p className="text-3xl font-bold mt-1" style={{ color: "var(--text)" }}>{value}</p>
          {subtitle && <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-2 ${trend.positive ? "text-green-500" : "text-red-500"}`}>
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% vs last week
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl shrink-0 ml-3" style={{ background: iconBg }}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>
    </div>
  );
}
