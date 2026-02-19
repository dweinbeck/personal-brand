"use client";

import { useState } from "react";
import { importTasksAction } from "@/actions/tasks/import";
import { useAuth } from "@/context/AuthContext";

interface ImportResult {
  success?: boolean;
  error?: string;
  summary?: {
    workspace: { id: string; name: string; created: boolean };
    tags: { created: number; existing: number };
    projects: { created: number; existing: number };
    sections: { created: number; existing: number };
    tasks: { created: number; skipped: number };
    subtasks: { created: number; skipped: number };
  };
}

export function ImportButton() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleImport() {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await importTasksAction(token);
      setResult(res);
    } catch {
      setResult({ error: "An unexpected error occurred during import" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      {!result ? (
        <button
          type="button"
          onClick={handleImport}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-gold-light rounded-[var(--radius-button)] hover:bg-gold/20 transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? "Importing..." : "Import Sprint Plan"}
        </button>
      ) : result.error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
          <p className="font-semibold">Import failed</p>
          <p className="mt-1">{result.error}</p>
        </div>
      ) : result.summary ? (
        <div className="rounded-xl border border-sage/20 bg-sage/5 p-4 text-sm text-text-primary">
          <p className="font-semibold text-sage mb-2">Import complete</p>
          <ul className="space-y-1 text-text-secondary">
            <li>
              Workspace: {result.summary.workspace.name} (
              {result.summary.workspace.created ? "created" : "existing"})
            </li>
            <li>
              Tags: {result.summary.tags.created} created,{" "}
              {result.summary.tags.existing} existing
            </li>
            <li>
              Projects: {result.summary.projects.created} created,{" "}
              {result.summary.projects.existing} existing
            </li>
            <li>
              Sections: {result.summary.sections.created} created,{" "}
              {result.summary.sections.existing} existing
            </li>
            <li>
              Tasks: {result.summary.tasks.created} created,{" "}
              {result.summary.tasks.skipped} skipped
            </li>
            <li>
              Subtasks: {result.summary.subtasks.created} created,{" "}
              {result.summary.subtasks.skipped} skipped
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
