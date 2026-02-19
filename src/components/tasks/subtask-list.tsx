"use client";

import { useState } from "react";
import {
  createTaskAction,
  deleteTaskAction,
  toggleTaskAction,
} from "@/actions/tasks/task";
import { useAuth } from "@/context/AuthContext";
import type { Task } from "@/generated/prisma/client";
import { useDemoMode } from "@/lib/tasks/demo";
import { EFFORT_VALUES } from "@/lib/tasks/effort";
import { cn } from "@/lib/utils";

interface SubtaskListProps {
  subtasks: Task[];
  parentTaskId: string;
  projectId: string;
}

export function SubtaskList({
  subtasks,
  parentTaskId,
  projectId,
}: SubtaskListProps) {
  const { user } = useAuth();
  const isDemo = useDemoMode();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [effort, setEffort] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

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
    setAdding(false);
    setLoading(false);
  }

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

      {subtasks.map((subtask) => (
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
          )}
        </div>
      ))}

      {adding && (
        <div className="flex items-center gap-2 px-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Subtask name"
            autoFocus
            className="flex-1 px-2 py-1.5 text-sm border border-border rounded-[var(--radius-button)] bg-surface focus:outline-none focus:ring-2 focus:ring-gold/50"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setAdding(false);
            }}
            disabled={loading}
          />
          <select
            value={effort ?? ""}
            onChange={(e) =>
              setEffort(e.target.value ? Number(e.target.value) : null)
            }
            disabled={loading}
            className="px-1.5 py-1.5 text-xs border border-border rounded-[var(--radius-button)] bg-surface focus:outline-none focus:ring-2 focus:ring-gold/50 text-text-secondary"
          >
            <option value="">Effort</option>
            {EFFORT_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAdd}
            disabled={loading}
            className="text-xs text-gold hover:text-gold-hover disabled:opacity-50 cursor-pointer"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
