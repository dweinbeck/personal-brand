"use client";

import clsx from "clsx";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type StatusFilter = "all" | "pending" | "processing" | "routed" | "failed";

interface Capture {
  id: string;
  type: "dictation" | "screenshot";
  transcript?: string;
  context?: string;
  status: string;
  destination?: string | null;
  destinationRef?: string | null;
  routingResult?: { title?: string; confidence?: number } | null;
  createdAt?: { _seconds: number };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  routed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

function formatRelativeTime(seconds: number): string {
  const now = Date.now() / 1000;
  const diff = now - seconds;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function BuilderInboxPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/admin/builder-inbox${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to load captures.");

      const data = await res.json();
      setCaptures(data.captures);
      setCounts(data.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalCount = Object.values(counts).reduce((sum, c) => sum + c, 0);

  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: totalCount },
    { key: "pending", label: "Pending", count: counts.pending ?? 0 },
    { key: "processing", label: "Processing", count: counts.processing ?? 0 },
    { key: "routed", label: "Routed", count: counts.routed ?? 0 },
    { key: "failed", label: "Failed", count: counts.failed ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-primary mb-6">Builder Inbox</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={clsx(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              filter === tab.key
                ? "bg-gold text-white"
                : "bg-gray-100 text-text-secondary hover:bg-gray-200",
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 text-xs opacity-75">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <p className="text-text-tertiary text-sm py-8 text-center">
          Loading captures...
        </p>
      )}

      {/* Empty state */}
      {!loading && captures.length === 0 && (
        <p className="text-text-tertiary text-sm py-8 text-center">
          No captures found.
        </p>
      )}

      {/* Captures table */}
      {!loading && captures.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Title / Preview
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {captures.map((capture) => (
                <tr key={capture.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={clsx(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                        capture.type === "dictation"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-indigo-100 text-indigo-800",
                      )}
                    >
                      {capture.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-primary max-w-xs truncate">
                    <Link
                      href={`/control-center/builder-inbox/${capture.id}`}
                      className="hover:underline"
                    >
                      {capture.routingResult?.title ??
                        capture.transcript?.slice(0, 80) ??
                        capture.context?.slice(0, 80) ??
                        "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={clsx(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                        STATUS_COLORS[capture.status] ??
                          "bg-gray-100 text-gray-800",
                      )}
                    >
                      {capture.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {capture.destination ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-tertiary whitespace-nowrap">
                    {capture.createdAt?._seconds
                      ? formatRelativeTime(capture.createdAt._seconds)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
