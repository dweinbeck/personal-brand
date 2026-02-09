"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { BillingUser, ToolPricing } from "@/lib/billing/types";

type Tab = "users" | "pricing";

export function AdminBillingPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<(BillingUser & { id: string })[]>([]);
  const [pricing, setPricing] = useState<ToolPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [usersRes, pricingRes] = await Promise.all([
        fetch("/api/admin/billing/users", { headers }),
        fetch("/api/admin/billing/pricing", { headers }),
      ]);

      if (!usersRes.ok || !pricingRes.ok) {
        throw new Error("Failed to load billing data.");
      }

      const usersData = await usersRes.json();
      const pricingData = await pricingRes.json();
      setUsers(usersData.users);
      setPricing(pricingData.pricing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePricingUpdate = async (tool: ToolPricing) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/billing/pricing", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tool),
      });
      if (!res.ok) throw new Error("Failed to update pricing.");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-text-tertiary text-sm">Loading billing data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-primary font-display mb-6">
        Billing Management
      </h1>

      {/* Tab bar */}
      <div className="flex gap-4 border-b border-border mb-6">
        {(["users", "pricing"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? "border-gold text-primary"
                : "border-transparent text-text-secondary hover:text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "users" && <UsersTable users={users} />}
      {tab === "pricing" && (
        <PricingTable pricing={pricing} onUpdate={handlePricingUpdate} />
      )}
    </div>
  );
}

function UsersTable({ users }: { users: (BillingUser & { id: string })[] }) {
  if (users.length === 0) {
    return <p className="text-text-tertiary text-sm">No billing users yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-background">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-text-secondary">
              Email
            </th>
            <th className="text-right px-4 py-3 font-medium text-text-secondary">
              Balance
            </th>
            <th className="text-right px-4 py-3 font-medium text-text-secondary">
              Purchased
            </th>
            <th className="text-right px-4 py-3 font-medium text-text-secondary">
              Spent
            </th>
            <th className="text-right px-4 py-3 font-medium text-text-secondary">
              Cost to Us
            </th>
            <th className="text-right px-4 py-3 font-medium text-text-secondary">
              Margin
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((u) => {
            const revenue = u.lifetimeSpentCredits; // credits = cents
            const cost = u.lifetimeCostToUsCents;
            const margin =
              revenue > 0
                ? (((revenue - cost) / revenue) * 100).toFixed(0)
                : "--";
            return (
              <tr key={u.id} className="hover:bg-gold-light/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/control-center/billing/${u.id}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {u.email}
                  </Link>
                </td>
                <td className="text-right px-4 py-3 tabular-nums">
                  {u.balanceCredits.toLocaleString()}
                </td>
                <td className="text-right px-4 py-3 tabular-nums text-text-secondary">
                  {u.lifetimePurchasedCredits.toLocaleString()}
                </td>
                <td className="text-right px-4 py-3 tabular-nums text-text-secondary">
                  {u.lifetimeSpentCredits.toLocaleString()}
                </td>
                <td className="text-right px-4 py-3 tabular-nums text-text-secondary">
                  ${(cost / 100).toFixed(2)}
                </td>
                <td className="text-right px-4 py-3 tabular-nums text-text-secondary">
                  {margin}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PricingTable({
  pricing,
  onUpdate,
}: {
  pricing: ToolPricing[];
  onUpdate: (tool: ToolPricing) => Promise<void>;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    creditsPerUse: number;
    costToUsCentsEstimate: number;
    active: boolean;
  }>({ creditsPerUse: 0, costToUsCentsEstimate: 0, active: false });

  const startEdit = (tool: ToolPricing) => {
    setEditing(tool.toolKey);
    setEditValues({
      creditsPerUse: tool.creditsPerUse,
      costToUsCentsEstimate: tool.costToUsCentsEstimate,
      active: tool.active,
    });
  };

  const saveEdit = async (tool: ToolPricing) => {
    await onUpdate({
      ...tool,
      ...editValues,
    });
    setEditing(null);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-background">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-text-secondary">
              Tool
            </th>
            <th className="text-right px-4 py-3 font-medium text-text-secondary">
              Credits/Use
            </th>
            <th className="text-right px-4 py-3 font-medium text-text-secondary">
              Cost to Us
            </th>
            <th className="text-center px-4 py-3 font-medium text-text-secondary">
              Active
            </th>
            <th className="text-right px-4 py-3 font-medium text-text-secondary">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {pricing.map((tool) => {
            const isEditing = editing === tool.toolKey;
            return (
              <tr key={tool.toolKey}>
                <td className="px-4 py-3 font-medium text-text-primary">
                  {tool.label}
                </td>
                <td className="text-right px-4 py-3">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editValues.creditsPerUse}
                      onChange={(e) =>
                        setEditValues((v) => ({
                          ...v,
                          creditsPerUse: Number(e.target.value),
                        }))
                      }
                      className="w-20 text-right rounded border border-border px-2 py-1 text-sm"
                    />
                  ) : (
                    tool.creditsPerUse
                  )}
                </td>
                <td className="text-right px-4 py-3">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editValues.costToUsCentsEstimate}
                      onChange={(e) =>
                        setEditValues((v) => ({
                          ...v,
                          costToUsCentsEstimate: Number(e.target.value),
                        }))
                      }
                      className="w-20 text-right rounded border border-border px-2 py-1 text-sm"
                    />
                  ) : (
                    `$${(tool.costToUsCentsEstimate / 100).toFixed(2)}`
                  )}
                </td>
                <td className="text-center px-4 py-3">
                  {isEditing ? (
                    <input
                      type="checkbox"
                      checked={editValues.active}
                      onChange={(e) =>
                        setEditValues((v) => ({
                          ...v,
                          active: e.target.checked,
                        }))
                      }
                    />
                  ) : tool.active ? (
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
                  )}
                </td>
                <td className="text-right px-4 py-3">
                  {isEditing ? (
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => saveEdit(tool)}
                        className="text-xs text-emerald-600 hover:underline font-medium"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        className="text-xs text-text-tertiary hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(tool)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
