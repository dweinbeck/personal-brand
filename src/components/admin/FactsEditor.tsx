"use client";

import { useState } from "react";
import type { Fact, FactCategory } from "@/lib/assistant/facts-store";
import { useIdToken, authHeaders } from "@/hooks/useIdToken";

const CATEGORIES: FactCategory[] = [
  "canon",
  "projects",
  "faq",
  "services",
  "contact",
  "writing",
];

type Props = {
  initialFacts: Fact[];
};

export function FactsEditor({ initialFacts }: Props) {
  const [facts, setFacts] = useState<Fact[]>(initialFacts);
  const [activeTab, setActiveTab] = useState<FactCategory>("canon");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);
  const getIdToken = useIdToken();

  const filtered = facts.filter((f) => f.category === activeTab);

  async function handleAdd() {
    if (!newKey.trim() || !newValue.trim()) return;
    setSaving(true);
    try {
      const headers = await authHeaders(getIdToken);
      const res = await fetch("/api/assistant/facts", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          category: activeTab,
          key: newKey,
          value: newValue,
        }),
      });
      if (res.ok) {
        const newFact: Fact = {
          category: activeTab,
          key: newKey,
          value: newValue,
          updatedAt: new Date().toISOString(),
        };
        setFacts([...facts, newFact]);
        setNewKey("");
        setNewValue("");
      }
    } catch {
      // handle error
    }
    setSaving(false);
  }

  async function handleDelete(factId: string) {
    try {
      const headers = await authHeaders(getIdToken);
      await fetch(`/api/assistant/facts?id=${factId}`, { method: "DELETE", headers });
      setFacts(facts.filter((f) => f.id !== factId));
    } catch {
      // handle error
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveTab(cat)}
            className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${
              activeTab === cat
                ? "bg-primary text-white"
                : "text-text-secondary hover:bg-gold-light"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Existing facts */}
      <div className="space-y-2 mb-6">
        {filtered.length === 0 && (
          <p className="text-sm text-text-tertiary">
            No Firestore facts for this category. The assistant uses file-based
            data from src/data/ as fallback.
          </p>
        )}
        {filtered.map((fact) => (
          <div
            key={fact.id ?? fact.key}
            className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">
                {fact.key}
              </p>
              <p className="text-sm text-text-secondary mt-0.5 whitespace-pre-wrap">
                {fact.value}
              </p>
              <p className="text-[10px] text-text-tertiary mt-1">
                Updated: {new Date(fact.updatedAt).toLocaleDateString()}
              </p>
            </div>
            {fact.id && (
              <button
                type="button"
                onClick={() => handleDelete(fact.id!)}
                className="text-xs text-text-tertiary hover:text-red-500 transition-colors flex-shrink-0"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add new fact */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-medium text-text-primary mb-3">
          Add Fact
        </h3>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Key (e.g., 'location', 'top_skill')"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
          <textarea
            placeholder="Value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20 resize-none"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !newKey.trim() || !newValue.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
          >
            {saving ? "Saving..." : "Add Fact"}
          </button>
        </div>
      </div>
    </div>
  );
}
