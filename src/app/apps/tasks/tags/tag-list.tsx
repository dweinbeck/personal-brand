"use client";

import Link from "next/link";
import { useState } from "react";
import { createTagAction, deleteTagAction } from "@/actions/tasks/tag";
import { Badge } from "@/components/tasks/ui/badge";
import { Button } from "@/components/tasks/ui/button";
import { ConfirmDialog } from "@/components/tasks/ui/confirm-dialog";
import { HelpTip } from "@/components/tasks/ui/help-tip";
import { Input } from "@/components/tasks/ui/input";
import { useAuth } from "@/context/AuthContext";

interface TagListProps {
  tags: { id: string; name: string; color: string | null; taskCount: number }[];
}

const TAG_COLORS = [
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#65a30d",
  "#16a34a",
  "#0891b2",
  "#2563eb",
  "#7c3aed",
  "#c026d3",
  "#e11d48",
];

export function TagList({ tags }: TagListProps) {
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(TAG_COLORS[0]);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const token = await user!.getIdToken();
    await createTagAction(token, { name: name.trim(), color });
    setName("");
    setAdding(false);
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setLoading(true);
    const token = await user!.getIdToken();
    await deleteTagAction(token, deleteTarget.id);
    setDeleteTarget(null);
    setLoading(false);
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-xs font-medium text-text-secondary">
          Manage tags
        </span>
        <HelpTip tipId="tags" />
      </div>
      <div className="space-y-2 mb-6">
        {tags.length === 0 && !adding && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-sm text-text-tertiary">
              No tags created yet. Create one to organize your tasks.
            </p>
          </div>
        )}

        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center justify-between px-4 py-3 rounded-[var(--radius-card)] border border-border bg-surface hover:shadow-[var(--shadow-card)] transition-shadow group"
          >
            <Link
              href={`/apps/tasks/tags/${tag.id}`}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <Badge color={tag.color ?? "#8a94a6"}>{tag.name}</Badge>
              <span className="text-xs text-text-tertiary">
                {tag.taskCount} task{tag.taskCount !== 1 ? "s" : ""}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setDeleteTarget({ id: tag.id, name: tag.name })}
              className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-danger transition-all cursor-pointer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <form
          onSubmit={handleAdd}
          className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tag name"
            autoFocus
          />
          <div className="mt-3">
            <span className="text-xs font-medium text-text-secondary mb-1.5 block">
              Color
            </span>
            <div className="flex gap-2">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${color === c ? "ring-2 ring-offset-2 ring-gold scale-110" : "hover:scale-110"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAdding(false)}
              size="sm"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !name.trim()}>
              {loading ? "Creating..." : "Create tag"}
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-sm text-text-tertiary hover:text-gold transition-colors cursor-pointer"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create tag
        </button>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete tag"
        message={`Are you sure you want to delete "${deleteTarget?.name ?? ""}"? It will be removed from all tasks.`}
        loading={loading}
      />
    </>
  );
}
