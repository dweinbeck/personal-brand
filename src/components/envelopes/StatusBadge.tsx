"use client";

import clsx from "clsx";

type Status = "On Track" | "Watch" | "Over";

const statusStyles: Record<Status, string> = {
  "On Track": "bg-sage/15 text-sage",
  Watch: "bg-amber/15 text-amber",
  Over: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}
