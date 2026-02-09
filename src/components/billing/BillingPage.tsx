"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import type { BillingMeResponse } from "@/lib/billing/types";

function BillingContent() {
  const { user } = useAuth();
  const [data, setData] = useState<BillingMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);

  const fetchBilling = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/billing/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const handleBuy = async () => {
    if (!user) return;
    setBuying(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pack: "500" }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start checkout.",
      );
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-text-tertiary text-sm">Loading billing info...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const dollarValue = (data.balanceCredits / 100).toFixed(2);

  return (
    <div className="space-y-8">
      {/* Balance card */}
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-card)]">
        <p className="text-text-tertiary text-sm font-medium uppercase tracking-wide mb-1">
          Credit Balance
        </p>
        <p className="text-4xl font-bold text-primary font-display">
          {data.balanceCredits.toLocaleString()}
        </p>
        <p className="text-text-secondary text-sm mt-1">
          ${dollarValue} value (1 credit = $0.01)
        </p>

        <button
          type="button"
          onClick={handleBuy}
          disabled={buying}
          className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-white font-semibold text-sm border border-gold/30 hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buying ? "Redirecting to Stripe..." : "Buy 500 Credits ($5)"}
        </button>
      </div>

      {/* Pricing table */}
      {data.pricing.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold text-primary mb-4">
            Tool Pricing
          </h2>
          <div className="divide-y divide-border">
            {data.pricing.map((tool) => (
              <div
                key={tool.toolKey}
                className="flex items-center justify-between py-3"
              >
                <span className="text-sm text-text-primary font-medium">
                  {tool.label}
                </span>
                <span className="text-sm text-text-secondary">
                  {tool.creditsPerUse} credits ($
                  {(tool.creditsPerUse / 100).toFixed(2)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function BillingPage() {
  return (
    <AuthGuard>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-bold text-primary font-display mb-8">
          Billing
        </h1>
        <BillingContent />
      </div>
    </AuthGuard>
  );
}
