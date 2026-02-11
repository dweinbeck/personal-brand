"use client";

import { useAuth } from "@/context/AuthContext";
import { formatCents } from "@/lib/envelopes/format";

type GreetingBannerProps = {
  onTrackCount: number;
  totalCount: number;
  totalSpentCents: number;
  totalRemainingCents: number;
};

export function GreetingBanner({
  onTrackCount,
  totalCount,
  totalSpentCents,
  totalRemainingCents,
}: GreetingBannerProps) {
  const { user } = useAuth();

  const name =
    user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const today = new Date();
  const dateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(today);

  return (
    <div className="mb-6">
      <p className="mb-3 text-center text-lg font-display font-semibold text-primary">
        Hi {name}! Today is {dateStr}.
      </p>
      <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-around">
          {totalCount > 0 && (
            <span className="text-sm text-text-secondary">
              {onTrackCount} of {totalCount} envelope
              {totalCount === 1 ? "" : "s"} on track this week
            </span>
          )}
          <span className="text-sm font-medium text-text-primary">
            Total Spent: {formatCents(totalSpentCents)}
          </span>
          <span className="text-sm font-medium text-text-primary">
            Total Remaining: {formatCents(totalRemainingCents)}
          </span>
        </div>
      </div>
    </div>
  );
}
