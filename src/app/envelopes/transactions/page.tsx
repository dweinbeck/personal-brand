"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { TransactionsPage } from "@/components/envelopes/TransactionsPage";

export default function TransactionsRoute() {
  return (
    <AuthGuard>
      <TransactionsPage />
    </AuthGuard>
  );
}
