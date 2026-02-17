"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCents } from "@/lib/envelopes/format";

type SpendingTrendChartProps = {
  data: {
    weekLabel: string;
    totalSpentCents: number;
    totalBudgetCents: number;
  }[];
};

export function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-center text-text-secondary py-8">
        Spending trend data will appear after your first week.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,42,74,0.1)" />
        <XAxis dataKey="weekLabel" tick={{ fontSize: 12, fill: "#4a5568" }} />
        <YAxis
          tickFormatter={(v) => formatCents(v)}
          tick={{ fontSize: 12, fill: "#4a5568" }}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatCents(value),
            name === "totalSpentCents" ? "Spent" : "Budget",
          ]}
        />
        <Line
          type="monotone"
          dataKey="totalSpentCents"
          stroke="#1b2a4a"
          strokeWidth={2}
          name="totalSpentCents"
          dot={{ fill: "#1b2a4a", r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="totalBudgetCents"
          stroke="#b8860b"
          strokeWidth={2}
          strokeDasharray="5 5"
          name="totalBudgetCents"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
