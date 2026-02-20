"use client";

import clsx from "clsx";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface CaptureDetail {
  id: string;
  type: "dictation" | "screenshot";
  transcript?: string;
  screenshotUrl?: string;
  context?: string;
  status: string;
  destination?: string | null;
  destinationRef?: string | null;
  routingResult?: {
    category?: string;
    title?: string;
    summary?: string;
    priority?: string;
    confidence?: number;
  } | null;
  error?: string | null;
  createdAt?: { _seconds: number };
  updatedAt?: { _seconds: number };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  routed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

function formatTime(seconds: number): string {
  return new Date(seconds * 1000).toLocaleString();
}

export function CaptureDetailPage({ captureId }: { captureId: string }) {
  const { user } = useAuth();
  const [capture, setCapture] = useState<CaptureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchCapture = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/builder-inbox/${captureId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to load capture.");

      const data = await res.json();
      setCapture(data.capture);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }, [user, captureId]);

  useEffect(() => {
    fetchCapture();
  }, [fetchCapture]);

  async function handleRetry() {
    if (!user) return;
    setActionLoading(true);
    setActionMessage(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/builder-inbox/${captureId}/retry`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Retry failed.");

      setActionMessage("Retry queued. Refresh in a few seconds.");
      setTimeout(() => fetchCapture(), 3000);
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReroute(destination: string) {
    if (!user) return;
    setActionLoading(true);
    setActionMessage(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/builder-inbox/${captureId}/reroute`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ destination }),
      });

      if (!res.ok) throw new Error("Re-route failed.");

      setActionMessage(`Re-routed to ${destination}.`);
      fetchCapture();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-text-tertiary text-sm text-center py-8">
          Loading capture...
        </p>
      </div>
    );
  }

  if (error || !capture) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error ?? "Capture not found."}
        </div>
        <Link
          href="/control-center/builder-inbox"
          className="mt-4 inline-block text-sm text-text-secondary hover:text-primary"
        >
          Back to Builder Inbox
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Link
        href="/control-center/builder-inbox"
        className="text-sm text-text-secondary hover:text-primary mb-4 inline-block"
      >
        Builder Inbox
      </Link>

      <h1 className="text-2xl font-bold text-primary mb-2">
        {capture.routingResult?.title ?? `Capture ${capture.id.slice(0, 8)}`}
      </h1>

      {/* Status + metadata */}
      <div className="flex items-center gap-3 mb-6">
        <span
          className={clsx(
            "inline-flex items-center px-2.5 py-1 rounded text-xs font-medium",
            STATUS_COLORS[capture.status] ?? "bg-gray-100 text-gray-800",
          )}
        >
          {capture.status}
        </span>
        <span className="text-sm text-text-tertiary">
          {capture.type} capture
        </span>
        {capture.createdAt?._seconds && (
          <span className="text-sm text-text-tertiary">
            {formatTime(capture.createdAt._seconds)}
          </span>
        )}
      </div>

      {/* Action message */}
      {actionMessage && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {actionMessage}
        </div>
      )}

      {/* Content sections */}
      <div className="space-y-6">
        {/* Transcript / Context */}
        {capture.transcript && (
          <section>
            <h2 className="text-sm font-semibold text-text-secondary mb-2">
              Transcript
            </h2>
            <p className="text-sm text-primary bg-gray-50 rounded-md p-4 whitespace-pre-wrap">
              {capture.transcript}
            </p>
          </section>
        )}

        {capture.context && (
          <section>
            <h2 className="text-sm font-semibold text-text-secondary mb-2">
              Context
            </h2>
            <p className="text-sm text-primary bg-gray-50 rounded-md p-4 whitespace-pre-wrap">
              {capture.context}
            </p>
          </section>
        )}

        {capture.screenshotUrl && (
          <section>
            <h2 className="text-sm font-semibold text-text-secondary mb-2">
              Screenshot
            </h2>
            <p className="text-sm text-text-tertiary bg-gray-50 rounded-md p-4 font-mono">
              {capture.screenshotUrl}
            </p>
          </section>
        )}

        {/* Routing result */}
        {capture.routingResult && (
          <section>
            <h2 className="text-sm font-semibold text-text-secondary mb-2">
              Routing Decision
            </h2>
            <div className="bg-gray-50 rounded-md p-4">
              <table className="text-sm">
                <tbody>
                  <tr>
                    <td className="pr-4 py-1 text-text-secondary font-medium">
                      Category
                    </td>
                    <td className="py-1">{capture.routingResult.category}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 py-1 text-text-secondary font-medium">
                      Summary
                    </td>
                    <td className="py-1">{capture.routingResult.summary}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 py-1 text-text-secondary font-medium">
                      Priority
                    </td>
                    <td className="py-1">{capture.routingResult.priority}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 py-1 text-text-secondary font-medium">
                      Confidence
                    </td>
                    <td className="py-1">
                      {capture.routingResult.confidence != null
                        ? `${(capture.routingResult.confidence * 100).toFixed(0)}%`
                        : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Destination */}
        {capture.destination && (
          <section>
            <h2 className="text-sm font-semibold text-text-secondary mb-2">
              Destination
            </h2>
            <div className="bg-gray-50 rounded-md p-4 text-sm">
              <p>
                <span className="text-text-secondary font-medium">Type:</span>{" "}
                {capture.destination}
              </p>
              {capture.destinationRef && (
                <p className="mt-1">
                  <span className="text-text-secondary font-medium">Ref:</span>{" "}
                  {capture.destinationRef.startsWith("http") ? (
                    <a
                      href={capture.destinationRef}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {capture.destinationRef}
                    </a>
                  ) : (
                    capture.destinationRef
                  )}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Error */}
        {capture.error && (
          <section>
            <h2 className="text-sm font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-sm text-red-700 bg-red-50 rounded-md p-4 font-mono">
              {capture.error}
            </p>
          </section>
        )}

        {/* Actions */}
        <section>
          <h2 className="text-sm font-semibold text-text-secondary mb-3">
            Actions
          </h2>
          <div className="flex gap-3 flex-wrap">
            {(capture.status === "failed" || capture.status === "pending") && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? "Retrying..." : "Retry Processing"}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleReroute("github_issue")}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-text-secondary hover:bg-gray-50 disabled:opacity-50"
            >
              Route to GitHub
            </button>
            <button
              type="button"
              onClick={() => handleReroute("task")}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-text-secondary hover:bg-gray-50 disabled:opacity-50"
            >
              Route to Tasks
            </button>
            <button
              type="button"
              onClick={() => handleReroute("inbox")}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-text-secondary hover:bg-gray-50 disabled:opacity-50"
            >
              Keep in Inbox
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
