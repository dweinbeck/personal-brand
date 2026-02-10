"use client";

import { useAuth } from "@/context/AuthContext";

type GreetingBannerProps = {
  onTrackCount: number;
  totalCount: number;
};

export function GreetingBanner({
  onTrackCount,
  totalCount,
}: GreetingBannerProps) {
  const { user } = useAuth();

  const name =
    user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
    new Date(),
  );

  return (
    <div className="mb-6 rounded-2xl border border-primary/10 bg-primary/5 p-5">
      <p className="text-lg font-display font-semibold text-primary">
        Hi {name}! Today is {weekday}.
      </p>
      {totalCount > 0 && (
        <p className="mt-1 text-sm text-text-secondary">
          {onTrackCount} of {totalCount} envelope{totalCount === 1 ? "" : "s"}{" "}
          on track this week.
        </p>
      )}
    </div>
  );
}
