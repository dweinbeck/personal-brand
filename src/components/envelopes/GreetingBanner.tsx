"use client";

import { useAuth } from "@/context/AuthContext";

export function GreetingBanner() {
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
      <p className="text-center text-lg font-display font-semibold text-primary">
        Hi {name}! Today is {dateStr}.
      </p>
    </div>
  );
}
