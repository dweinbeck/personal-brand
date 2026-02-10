"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type {
  BillingUser,
  LedgerEntry,
  Purchase,
  ToolUsage,
} from "@/lib/billing/types";

type UserDetailData = {
  user: BillingUser;
  ledger: (LedgerEntry & { id: string })[];
  usage: (ToolUsage & { id: string })[];
  purchases: (Purchase & { id: string })[];
};

export function AdminBillingUserDetail({ uid }: { uid: string }) {
  const { user: authUser } = useAuth();
  const [data, setData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Adjust form
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    setError(null);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/admin/billing/users/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load user.");
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }, [authUser, uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdjust = async () => {
    if (!authUser || !adjustDelta || !adjustReason) return;
    setAdjusting(true);
    setError(null);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/admin/billing/users/${uid}/adjust`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deltaCredits: Number(adjustDelta),
          reason: adjustReason,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Adjust failed.");
      }
      setAdjustDelta("");
      setAdjustReason("");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Adjust failed.");
    } finally {
      setAdjusting(false);
    }
  };

  const handleRefund = async (usageId: string) => {
    if (!authUser) return;
    const reason = prompt("Refund reason:");
    if (!reason) return;

    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/admin/billing/usage/${usageId}/refund`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Refund failed.");
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refund failed.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-text-tertiary text-sm">Loading user details...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user: billingUser, ledger, usage, purchases } = data;
  const revenue = billingUser.lifetimeSpentCredits;
  const cost = billingUser.lifetimeCostToUsCents;
  const margin =
    revenue > 0 ? (((revenue - cost) / revenue) * 100).toFixed(1) : "--";

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link
        href="/control-center/billing"
        className="text-sm text-text-secondary hover:text-primary"
      >
        &larr; All users
      </Link>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-bold text-primary font-display mb-4">
          {billingUser.email}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-text-tertiary">Balance</p>
            <p className="text-xl font-bold text-primary tabular-nums">
              {billingUser.balanceCredits.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-text-tertiary">Purchased</p>
            <p className="tabular-nums font-medium">
              {billingUser.lifetimePurchasedCredits.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-text-tertiary">Spent</p>
            <p className="tabular-nums font-medium">
              {billingUser.lifetimeSpentCredits.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-text-tertiary">Margin</p>
            <p className="tabular-nums font-medium">{margin}%</p>
          </div>
        </div>
      </div>

      {/* Adjust credits */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-sm font-semibold text-primary mb-3">
          Adjust Credits
        </h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label
              htmlFor="adjust-delta"
              className="text-xs text-text-tertiary block mb-1"
            >
              Delta (+ or -)
            </label>
            <input
              id="adjust-delta"
              type="number"
              value={adjustDelta}
              onChange={(e) => setAdjustDelta(e.target.value)}
              className="w-28 rounded border border-border px-3 py-2 text-sm"
              placeholder="100"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="adjust-reason"
              className="text-xs text-text-tertiary block mb-1"
            >
              Reason (required)
            </label>
            <input
              id="adjust-reason"
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full rounded border border-border px-3 py-2 text-sm"
              placeholder="Manual adjustment reason"
            />
          </div>
          <button
            type="button"
            onClick={handleAdjust}
            disabled={adjusting || !adjustDelta || !adjustReason}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {adjusting ? "Adjusting..." : "Apply"}
          </button>
        </div>
      </div>

      {/* Ledger */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-sm font-semibold text-primary mb-3">
          Recent Ledger
        </h3>
        {ledger.length === 0 ? (
          <p className="text-text-tertiary text-sm">No ledger entries.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-tertiary">
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 pr-4 font-medium text-right">Delta</th>
                  <th className="pb-2 pr-4 font-medium">Reason</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2 pr-4">
                      <span className="inline-block rounded-full bg-background px-2 py-0.5 text-xs font-medium">
                        {entry.type}
                      </span>
                    </td>
                    <td
                      className={`py-2 pr-4 text-right tabular-nums font-medium ${
                        entry.deltaCredits > 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {entry.deltaCredits > 0 ? "+" : ""}
                      {entry.deltaCredits}
                    </td>
                    <td className="py-2 pr-4 text-text-secondary max-w-[200px] truncate">
                      {entry.reason}
                    </td>
                    <td className="py-2 text-text-tertiary text-xs">
                      {formatTimestamp(entry.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Usage */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-sm font-semibold text-primary mb-3">
          Recent Usage
        </h3>
        {usage.length === 0 ? (
          <p className="text-text-tertiary text-sm">No usage records.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-tertiary">
                  <th className="pb-2 pr-4 font-medium">Tool</th>
                  <th className="pb-2 pr-4 font-medium text-right">Credits</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {usage.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2 pr-4 font-medium">{u.toolKey}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {u.creditsCharged}
                    </td>
                    <td className="py-2 pr-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="py-2 pr-4 text-text-tertiary text-xs">
                      {formatTimestamp(u.createdAt)}
                    </td>
                    <td className="py-2 text-right">
                      {u.status !== "refunded" && (
                        <button
                          type="button"
                          onClick={() => handleRefund(u.id)}
                          className="text-xs text-red-600 hover:underline font-medium"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Purchases */}
      {purchases.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-semibold text-primary mb-3">Purchases</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-tertiary">
                  <th className="pb-2 pr-4 font-medium">Amount</th>
                  <th className="pb-2 pr-4 font-medium text-right">Credits</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {purchases.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-4 font-medium">
                      ${(p.usdCents / 100).toFixed(2)}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-emerald-600">
                      +{p.creditsGranted}
                    </td>
                    <td className="py-2 text-text-tertiary text-xs">
                      {formatTimestamp(p.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    started: "bg-amber-100 text-amber-700",
    succeeded: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
    refunded: "bg-blue-100 text-blue-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

function formatTimestamp(ts: unknown): string {
  if (!ts) return "--";
  // Firestore timestamps come as { _seconds, _nanoseconds } in JSON
  if (typeof ts === "object" && ts !== null && "_seconds" in ts) {
    return new Date(
      (ts as { _seconds: number })._seconds * 1000,
    ).toLocaleString();
  }
  if (typeof ts === "string") {
    return new Date(ts).toLocaleString();
  }
  return "--";
}
