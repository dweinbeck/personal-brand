"use client";

import { useState } from "react";

const STORAGE_KEY = "tasks-free-trial-dismissed";

interface FreeWeekBannerProps {
  weekStart: string;
}

export function FreeWeekBanner({ weekStart }: FreeWeekBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  if (dismissed) return null;

  const daysSinceStart = Math.floor(
    (Date.now() - new Date(weekStart).getTime()) / 86400000,
  );
  const daysLeft = Math.max(0, 7 - daysSinceStart);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  return (
    <div className="relative mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 pr-10 text-sm text-emerald-800">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-2 right-2 cursor-pointer text-emerald-600 transition-colors hover:text-emerald-800"
        aria-label="Dismiss banner"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <title>Close</title>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <p className="font-semibold">Free Trial Week</p>
      <p className="mt-1">
        {daysLeft > 0
          ? `You have ${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your trial. After your free week ends, task management costs 100 credits/week ($1/week).`
          : "Your free trial has ended. Task management costs 100 credits/week ($1/week)."}
      </p>
    </div>
  );
}
