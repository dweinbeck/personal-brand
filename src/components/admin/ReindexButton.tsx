"use client";

import { useState } from "react";

export function ReindexButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleReindex() {
    setLoading(true);
    try {
      await fetch("/api/assistant/reindex", { method: "POST" });
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch {
      // handle error
    }
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleReindex}
      disabled={loading}
      className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-gold/40 hover:bg-gold-light disabled:opacity-40"
    >
      {loading ? "Reindexing..." : done ? "Cache cleared!" : "Clear Knowledge Cache"}
    </button>
  );
}
