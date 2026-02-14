"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

// ── Types ───────────────────────────────────────────────────────

interface Stats {
  totalRequests: number;
  byTier: { standard: number; expert: number };
  byAction: { prompt: number; "follow-up": number; reconsider: number };
  totalCreditsSpent: number;
}

interface LogEntry {
  id: string;
  userId: string;
  tier: string;
  action: string;
  creditsCharged: number;
  geminiStatus: string;
  openaiStatus: string;
  createdAt: string | null;
}

// ── Component ───────────────────────────────────────────────────

export function UsageStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/research-assistant/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to load usage stats.");

      const data = await res.json();
      setStats(data.stats);
      setRecentLogs(data.recentLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-text-tertiary text-sm">Loading usage stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!stats || stats.totalRequests === 0) {
    return (
      <p className="text-text-tertiary text-sm py-8 text-center">
        No usage data yet.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total Requests" value={stats.totalRequests} />
        <SummaryCard label="Standard" value={stats.byTier.standard} />
        <SummaryCard label="Expert" value={stats.byTier.expert} />
        <SummaryCard label="Credits Spent" value={stats.totalCreditsSpent} />
      </div>

      {/* Action breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Prompts" value={stats.byAction.prompt} />
        <SummaryCard label="Follow-ups" value={stats.byAction["follow-up"]} />
        <SummaryCard label="Reconsiders" value={stats.byAction.reconsider} />
      </div>

      {/* Recent logs table */}
      <div>
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          Recent Usage (last 20)
        </h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-background">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">
                  Date
                </th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">
                  User
                </th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">
                  Tier
                </th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">
                  Action
                </th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary">
                  Credits
                </th>
                <th className="text-center px-4 py-3 font-medium text-text-secondary">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gold-light/30">
                  <td className="px-4 py-3 text-text-secondary">
                    {log.createdAt
                      ? new Date(log.createdAt).toLocaleDateString()
                      : "--"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-tertiary">
                    {log.userId.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 capitalize">{log.tier}</td>
                  <td className="px-4 py-3">{log.action}</td>
                  <td className="text-right px-4 py-3 tabular-nums">
                    {log.creditsCharged}
                  </td>
                  <td className="text-center px-4 py-3">
                    <StatusDot
                      gemini={log.geminiStatus}
                      openai={log.openaiStatus}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-2xl font-bold text-primary tabular-nums">
        {value.toLocaleString()}
      </p>
      <p className="text-xs text-text-tertiary mt-1">{label}</p>
    </div>
  );
}

function StatusDot({ gemini, openai }: { gemini: string; openai: string }) {
  const allSuccess = gemini === "success" && openai === "success";
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        allSuccess ? "bg-emerald-500" : "bg-amber-500"
      }`}
      title={`Gemini: ${gemini}, OpenAI: ${openai}`}
    />
  );
}
