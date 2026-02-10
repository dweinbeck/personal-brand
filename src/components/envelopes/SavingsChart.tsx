"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCents } from "@/lib/envelopes/format";

type SavingsChartProps = {
  data: { weekLabel: string; cumulativeCents: number }[];
};

export function SavingsChart({ data }: SavingsChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-center text-text-secondary py-8">
        Savings data will appear after your first complete week.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,42,74,0.1)" />
        <XAxis dataKey="weekLabel" tick={{ fontSize: 12, fill: "#4a5568" }} />
        <YAxis
          tickFormatter={(v) => formatCents(v)}
          tick={{ fontSize: 12, fill: "#4a5568" }}
        />
        <Tooltip
          formatter={(value) => [formatCents(Number(value ?? 0)), "Savings"]}
        />
        <Area
          type="monotone"
          dataKey="cumulativeCents"
          stroke="#6b8e6f"
          fill="#6b8e6f"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
