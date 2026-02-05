"use client";

import { useState } from "react";
import type { PromptVersion } from "@/lib/assistant/prompt-versions";

type Props = {
  versions: PromptVersion[];
};

export function PromptVersions({ versions: initialVersions }: Props) {
  const [versions, setVersions] = useState(initialVersions);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleRollback(versionId: string) {
    try {
      await fetch("/api/assistant/prompt-versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rollback", versionId }),
      });
      setVersions(
        versions.map((v) => ({
          ...v,
          isActive: v.id === versionId,
        })),
      );
    } catch {
      // handle error
    }
  }

  if (versions.length === 0) {
    return (
      <p className="text-sm text-text-tertiary">
        No prompt versions saved yet. Versions are created when you save changes
        from the facts editor.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {versions.map((v) => (
        <div
          key={v.id}
          className={`rounded-lg border p-3 ${
            v.isActive
              ? "border-sage/50 bg-sage/5"
              : "border-border bg-surface"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">
                v{v.version}
              </span>
              {v.isActive && (
                <span className="rounded-full bg-sage/20 px-2 py-0.5 text-[10px] font-medium text-sage">
                  Active
                </span>
              )}
              <span className="text-xs text-text-tertiary">
                {new Date(v.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setExpandedId(expandedId === v.id ? null : (v.id ?? null))
                }
                className="text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                {expandedId === v.id ? "Hide" : "View"}
              </button>
              {!v.isActive && (
                <button
                  type="button"
                  onClick={() => v.id && handleRollback(v.id)}
                  className="text-xs text-primary hover:text-primary-hover transition-colors"
                >
                  Rollback
                </button>
              )}
            </div>
          </div>
          {expandedId === v.id && (
            <pre className="mt-2 max-h-48 overflow-auto rounded bg-background p-2 text-[11px] text-text-secondary">
              {v.systemPrompt?.slice(0, 1000)}
              {(v.systemPrompt?.length ?? 0) > 1000 && "..."}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
