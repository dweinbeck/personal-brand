"use client";

import { createContext, type ReactNode, useContext } from "react";

export interface BillingContextValue {
  mode: "readwrite" | "readonly";
  reason?: "free_week" | "unpaid";
}

const BillingContext = createContext<BillingContextValue>({
  mode: "readwrite",
});

export function BillingProvider({
  billing,
  children,
}: {
  billing: BillingContextValue;
  children: ReactNode;
}) {
  return <BillingContext value={billing}>{children}</BillingContext>;
}

export function useBilling(): BillingContextValue {
  return useContext(BillingContext);
}
