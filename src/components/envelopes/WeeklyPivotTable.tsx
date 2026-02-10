"use client";

import clsx from "clsx";
import { formatCents } from "@/lib/envelopes/format";
import type { PivotRow } from "@/lib/envelopes/types";

type WeeklyPivotTableProps = {
  envelopes: { id: string; title: string }[];
  pivotRows: PivotRow[];
};

export function WeeklyPivotTable({
  envelopes,
  pivotRows,
}: WeeklyPivotTableProps) {
  if (pivotRows.length === 0) {
    return (
      <p className="text-center text-text-secondary py-8">
        No transaction data yet. Analytics will appear after you record some
        spending.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left font-medium text-text-secondary text-xs">
              Week
            </th>
            {envelopes.map((env) => (
              <th
                key={env.id}
                className="px-3 py-2 text-right font-medium text-text-secondary text-xs"
              >
                {env.title}
              </th>
            ))}
            <th className="px-3 py-2 text-right font-medium text-text-secondary text-xs">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {pivotRows.map((row) => (
            <tr key={row.weekStart} className="border-b border-border">
              <td className="px-3 py-2 text-left font-medium">
                {row.weekLabel}
              </td>
              {envelopes.map((env) => {
                const cents = row.cells[env.id] ?? 0;
                return (
                  <td
                    key={env.id}
                    className={clsx(
                      "px-3 py-2 text-right tabular-nums",
                      cents === 0 && "text-text-secondary/50",
                    )}
                  >
                    {formatCents(cents)}
                  </td>
                );
              })}
              <td className="px-3 py-2 text-right tabular-nums font-semibold">
                {formatCents(row.totalCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
