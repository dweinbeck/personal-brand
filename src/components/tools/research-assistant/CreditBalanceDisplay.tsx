"use client";

import Link from "next/link";
import { useCreditBalance } from "@/lib/hooks/use-credit-balance";

export function CreditBalanceDisplay() {
  const { balance, loading } = useCreditBalance();

  if (loading)
    return (
      <span className="text-xs text-text-tertiary">Loading balance...</span>
    );
  if (balance === null) return null;

  const isLow = balance < 20;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={isLow ? "text-red-500 font-medium" : "text-text-secondary"}
      >
        {balance.toLocaleString()} credits
      </span>
      {isLow && (
        <Link href="/billing" className="text-xs text-primary hover:underline">
          Buy Credits
        </Link>
      )}
    </div>
  );
}
