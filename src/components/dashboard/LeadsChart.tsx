"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";

interface LeadsChartProps {
  dailyData: { date: string; count: number }[];
}

export function LeadsLineChart({ dailyData }: LeadsChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridColor = isDark ? "#374151" : "#f0f0f0";
  const tickColor = isDark ? "#9ca3af" : "#9ca3af";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipBorder = isDark ? "#374151" : "#e5e7eb";
  const tooltipText = isDark ? "#f9fafb" : "#111827";

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickColor }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: tickColor }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: `1px solid ${tooltipBorder}`,
            fontSize: "12px",
            background: tooltipBg,
            color: tooltipText,
          }}
          labelStyle={{ fontWeight: 600, color: tooltipText }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 3, fill: "#3b82f6" }}
          activeDot={{ r: 5 }}
          name="Leads"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface StatusChartProps {
  data: { name: string; value: number; color: string }[];
}

export function StatusPieChart({ data }: StatusChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tooltipBg = isDark ? "#1f2937" : "#ffffff";
  const tooltipBorder = isDark ? "#374151" : "#e5e7eb";
  const tooltipText = isDark ? "#f9fafb" : "#111827";
  const legendColor = isDark ? "#9ca3af" : "#6b7280";

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Legend
          formatter={(value) => (
            <span style={{ fontSize: "12px", color: legendColor }}>{value}</span>
          )}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: `1px solid ${tooltipBorder}`,
            fontSize: "12px",
            background: tooltipBg,
            color: tooltipText,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
