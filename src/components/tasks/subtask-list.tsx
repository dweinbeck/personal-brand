"use client";

import { useState } from "react";
import {
  createTaskAction,
  deleteTaskAction,
  toggleTaskAction,
  updateTaskAction,
} from "@/actions/tasks/task";
import { useAuth } from "@/context/AuthContext";
import type { Task } from "@/generated/prisma/client";
import { useDemoMode } from "@/lib/tasks/demo";
import { EFFORT_QUICK_PICKS } from "@/lib/tasks/effort";
import { cn } from "@/lib/utils";

interface SubtaskListProps {
  subtasks: Task[];
  parentTaskId: string;
  projectId: string;
  parentEffort?: number | null;
}

export function SubtaskList({
  subtasks,
  parentTaskId,
  projectId,
  parentEffort,
}: SubtaskListProps) {
  const { user } = useAuth();
  const isDemo = useDemoMode();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [effort, setEffort] = useState<number | null>(null);
  const [customEffort, setCustomEffort] = useState("");
  const [loading, setLoading] = useState(false);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEffort, setEditEffort] = useState<number | null>(null);
  const [editCustomEffort, setEditCustomEffort] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const subtaskTotal = subtasks
    .filter((s) => s.effort != null)
    .reduce((sum, s) => sum + (s.effort as number), 0);

  function handleEffortQuickPick(value: number) {
    if (effort === value) {
      setEffort(null);
      setCustomEffort("");
    } else {
      setEffort(value);
      setCustomEffort(String(value));
    }
  }

  function handleCustomEffortChange(val: string) {
    setCustomEffort(val);
    const num = Number.parseInt(val, 10);
    if (val && !Number.isNaN(num) && num > 0) {
      setEffort(num);
    } else if (!val) {
      setEffort(null);
    }
  }

  function handleEditEffortQuickPick(value: number) {
    if (editEffort === value) {
      setEditEffort(null);
      setEditCustomEffort("");
    } else {
      setEditEffort(value);
      setEditCustomEffort(String(value));
    }
  }

  function handleEditCustomEffortChange(val: string) {
    setEditCustomEffort(val);
    const num = Number.parseInt(val, 10);
    if (val && !Number.isNaN(num) && num > 0) {
      setEditEffort(num);
    } else if (!val) {
      setEditEffort(null);
    }
  }

  function startEditing(subtask: Task) {
    setEditingId(subtask.id);
    setEditName(subtask.name);
    setEditEffort(subtask.effort);
    setEditCustomEffort(subtask.effort != null ? String(subtask.effort) : "");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName("");
    setEditEffort(null);
    setEditCustomEffort("");
  }

  async function handleSaveEdit(subtaskId: string) {
    if (!editName.trim()) return;
    setEditLoading(true);
    const token = await user!.getIdToken();
    const result = await updateTaskAction(token, {
      id: subtaskId,
      name: editName.trim(),
      effort: editEffort,
    });
    if (result.error) {
      alert(result.error);
    }
    setEditLoading(false);
    cancelEditing();
  }

  async function handleAdd() {
    if (!name.trim()) return;
    setLoading(true);
    const token = await user!.getIdToken();
    const result = await createTaskAction(token, {
      projectId,
      parentTaskId,
      name: name.trim(),
      effort,
    });
    if (result.error) {
      alert(result.error);
    }
    setName("");
    setEffort(null);
    setCustomEffort("");
    setAdding(false);
    setLoading(false);
  }

  function renderAllocationLine() {
    if (parentEffort != null) {
      const diff = subtaskTotal - parentEffort;
      if (diff > 0) {
        return (
          <span className="text-xs text-danger font-medium">
            {subtaskTotal} / {parentEffort} allocated — Over budget by {diff}
          </span>
        );
      }
      if (diff < 0) {
        return (
          <span className="text-xs text-text-tertiary">
            {subtaskTotal} / {parentEffort} allocated — Unallocated:{" "}
            {parentEffort - subtaskTotal}
          </span>
        );
      }
      return (
        <span className="text-xs text-sage font-medium">
          {subtaskTotal} / {parentEffort} allocated — Fully allocated
        </span>
      );
    }
    if (subtaskTotal > 0) {
      return (
        <span className="text-xs text-text-tertiary">
          {subtaskTotal} effort in subtasks
        </span>
      );
    }
    return null;
  }

  const allocationLine = renderAllocationLine();

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
          Subtasks
        </span>
        {!isDemo && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-xs text-gold hover:text-gold-hover transition-colors cursor-pointer"
          >
            + Add subtask
          </button>
        )}
      </div>

      {allocationLine && <div className="mb-2">{allocationLine}</div>}

      {subtasks.map((subtask) =>
        editingId === subtask.id ? (
          <div
            key={subtask.id}
            className="px-2 py-2 rounded-[var(--radius-button)] border border-gold/30 bg-gold-light/20 space-y-2"
          >
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-border rounded-[var(--radius-button)] bg-surface focus:outline-none focus:ring-2 focus:ring-gold/50"
              disabled={editLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit(subtask.id);
                if (e.key === "Escape") cancelEditing();
              }}
            />
            <div className="flex items-center gap-1 flex-wrap">
              {EFFORT_QUICK_PICKS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleEditEffortQuickPick(value)}
                  disabled={editLoading}
                  className={cn(
                    "px-1.5 py-0.5 text-xs rounded-full border transition-colors cursor-pointer",
                    editEffort === value
                      ? "bg-gold-light border-gold text-primary font-medium"
                      : "border-border text-text-tertiary hover:border-gold hover:text-text-primary",
                  )}
                >
                  {value}
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={100}
                value={editCustomEffort}
                onChange={(e) => handleEditCustomEffortChange(e.target.value)}
                placeholder="Custom"
                disabled={editLoading}
                className="w-16 px-2 py-0.5 text-xs border border-border rounded-[var(--radius-button)] bg-surface focus:outline-none focus:ring-2 focus:ring-gold/50 text-text-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveEdit(subtask.id)}
                disabled={editLoading || !editName.trim()}
                className="text-xs text-gold hover:text-gold-hover disabled:opacity-50 cursor-pointer"
              >
                {editLoading ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={editLoading}
                className="text-xs text-text-tertiary hover:text-text-primary cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            key={subtask.id}
            className="flex items-center gap-2 py-1 px-2 rounded-[var(--radius-button)] hover:bg-gold-light/50 group"
          >
            <button
              type="button"
              onClick={
                isDemo
                  ? undefined
                  : async () => {
                      const token = await user!.getIdToken();
                      await toggleTaskAction(token, subtask.id);
                    }
              }
              className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                isDemo ? "opacity-60 cursor-default" : "cursor-pointer",
                subtask.status === "COMPLETED"
                  ? "bg-sage border-sage text-white"
                  : "border-border hover:border-gold",
              )}
            >
              {subtask.status === "COMPLETED" && (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
            <span
              className={cn(
                "flex-1 text-sm",
                subtask.status === "COMPLETED"
                  ? "line-through text-text-tertiary"
                  : "text-text-primary",
              )}
            >
              {subtask.name}
            </span>
            {subtask.effort != null && (
              <span className="text-xs font-medium text-amber px-1.5 py-0.5 rounded-full bg-amber/10 border border-amber/20">
                {subtask.effort}
              </span>
            )}
            {!isDemo && (
              <>
                <button
                  type="button"
                  onClick={() => startEditing(subtask)}
                  className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-gold transition-all cursor-pointer"
                  title="Edit subtask"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const token = await user!.getIdToken();
                    await deleteTaskAction(token, subtask.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-danger transition-all cursor-pointer"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
          </div>
        ),
      )}

      {adding && (
        <div className="space-y-2 px-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Subtask name"
            autoFocus
            className="w-full px-2 py-1.5 text-sm border border-border rounded-[var(--radius-button)] bg-surface focus:outline-none focus:ring-2 focus:ring-gold/50"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setAdding(false);
            }}
            disabled={loading}
          />
          <div className="flex items-center gap-1 flex-wrap">
            {EFFORT_QUICK_PICKS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleEffortQuickPick(value)}
                disabled={loading}
                className={cn(
                  "px-1.5 py-0.5 text-xs rounded-full border transition-colors cursor-pointer",
                  effort === value
                    ? "bg-gold-light border-gold text-primary font-medium"
                    : "border-border text-text-tertiary hover:border-gold hover:text-text-primary",
                )}
              >
                {value}
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={100}
              value={customEffort}
              onChange={(e) => handleCustomEffortChange(e.target.value)}
              placeholder="Custom"
              disabled={loading}
              className="w-16 px-2 py-0.5 text-xs border border-border rounded-[var(--radius-button)] bg-surface focus:outline-none focus:ring-2 focus:ring-gold/50 text-text-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={loading}
              className="text-xs text-gold hover:text-gold-hover disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setName("");
                setEffort(null);
                setCustomEffort("");
              }}
              className="text-xs text-text-tertiary hover:text-text-primary cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
