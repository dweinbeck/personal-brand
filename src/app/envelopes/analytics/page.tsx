"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AnalyticsPage } from "@/components/envelopes/AnalyticsPage";

export default function AnalyticsRoute() {
  return (
    <AuthGuard>
      <AnalyticsPage />
    </AuthGuard>
  );
}
