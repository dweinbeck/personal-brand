"use client";

import { useState } from "react";
import {
  deleteTaskAction,
  toggleTaskAction,
  updateTaskAction,
} from "@/actions/tasks/task";
import { Badge } from "@/components/tasks/ui/badge";
import { ConfirmDialog } from "@/components/tasks/ui/confirm-dialog";
import { useAuth } from "@/context/AuthContext";
import { useDemoMode } from "@/lib/tasks/demo";
import type { TaskWithRelations } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { SubtaskList } from "./subtask-list";
import { TaskForm } from "./task-form";

interface TaskCardProps {
  task: TaskWithRelations;
  projectId: string;
  allTags: { id: string; name: string; color: string | null }[];
  sections: { id: string; name: string }[];
}

export function TaskCard({
  task,
  projectId,
  allTags,
  sections,
}: TaskCardProps) {
  const { user } = useAuth();
  const isDemo = useDemoMode();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [overBudgetDismissed, setOverBudgetDismissed] = useState(false);
  const isCompleted = task.status === "COMPLETED";

  const subtaskEffortTotal = task.subtasks
    .filter((s) => s.effort != null)
    .reduce((sum, s) => sum + (s.effort as number), 0);
  const isOverBudget =
    task.effort != null &&
    task.subtasks.length > 0 &&
    subtaskEffortTotal > task.effort;

  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    const token = await user!.getIdToken();
    await toggleTaskAction(token, task.id);
  }

  async function handleDelete() {
    setLoading(true);
    const token = await user!.getIdToken();
    await deleteTaskAction(token, task.id);
    setConfirmDelete(false);
    setLoading(false);
  }

  const deadlineStr = task.deadlineAt
    ? new Date(task.deadlineAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const isOverdue =
    task.deadlineAt && new Date(task.deadlineAt) < new Date() && !isCompleted;

  if (editing) {
    return (
      <>
        <TaskForm
          mode="edit"
          task={task}
          projectId={projectId}
          allTags={allTags}
          sections={sections}
          onClose={() => setEditing(false)}
        />
        {task.subtasks.length > 0 && (
          <div className="mt-2 ml-8 pl-4 border-l-2 border-border">
            <SubtaskList
              subtasks={task.subtasks}
              parentTaskId={task.id}
              projectId={projectId}
              parentEffort={task.effort}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] motion-safe:hover:-translate-y-0.5 group">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={isDemo ? undefined : handleToggle}
            className={cn(
              "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
              isDemo ? "opacity-60 cursor-default" : "cursor-pointer",
              isCompleted
                ? "bg-sage border-sage text-white"
                : "border-border hover:border-gold",
            )}
          >
            {isCompleted && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className={cn(
              "flex-1 min-w-0 cursor-pointer text-left relative",
              task.effort != null && "pb-5",
            )}
            onClick={() => setExpanded(!expanded)}
          >
            <span
              className={cn(
                "text-sm font-medium line-clamp-2",
                isCompleted
                  ? "line-through text-text-tertiary"
                  : "text-text-primary",
              )}
            >
              {task.name}
            </span>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {deadlineStr && (
                <span
                  className={cn(
                    "text-xs",
                    isOverdue
                      ? "text-danger font-medium"
                      : "text-text-tertiary",
                  )}
                >
                  {deadlineStr}
                </span>
              )}
              {task.tags.map(({ tag }) => (
                <Badge
                  key={tag.id}
                  color={tag.color ?? "#8a94a6"}
                  className="text-[10px]"
                >
                  {tag.name}
                </Badge>
              ))}
              {task.subtasks.length > 0 && (
                <span className="text-xs text-text-tertiary">
                  {task.effort != null
                    ? `${task.subtasks.length} subtasks - ${subtaskEffortTotal}/${task.effort} allocated`
                    : `${task.subtasks.filter((s) => s.status === "COMPLETED").length}/${task.subtasks.length}`}
                </span>
              )}
            </div>
            {task.effort != null && (
              <span className="absolute bottom-0 right-0 text-xs font-medium text-amber px-1.5 py-0.5 rounded-full bg-amber/10 border border-amber/20">
                {task.effort}
              </span>
            )}
          </button>

          {!isDemo && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing(true);
                }}
                className="p-1 text-text-tertiary hover:text-gold transition-colors cursor-pointer"
                title="Edit task"
              >
                <svg
                  width="14"
                  height="14"
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
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(true);
                }}
                className="p-1 text-text-tertiary hover:text-danger transition-colors cursor-pointer"
                title="Delete task"
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
          )}
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border">
            <p
              className={cn(
                "text-sm font-medium mb-2",
                isCompleted
                  ? "line-through text-text-tertiary"
                  : "text-text-primary",
              )}
            >
              {task.name}
            </p>
            {task.description && (
              <p className="text-sm text-text-secondary mb-3">
                {task.description}
              </p>
            )}
            {task.effort != null && (
              <span className="inline-block text-xs font-medium text-amber px-2 py-0.5 rounded-full bg-amber/10 border border-amber/20 mb-2">
                Task budget: {task.effort}
              </span>
            )}
            {isOverBudget && !overBudgetDismissed && !isDemo && (
              <div className="flex items-center gap-2 mb-2 p-2 rounded-[var(--radius-button)] bg-danger/5 border border-danger/20">
                <span className="text-xs text-danger font-medium flex-1">
                  Over budget by {subtaskEffortTotal - (task.effort ?? 0)}
                </span>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const token = await user!.getIdToken();
                    await updateTaskAction(token, {
                      id: task.id,
                      effort: subtaskEffortTotal,
                    });
                  }}
                  className="text-xs text-gold hover:text-gold-hover cursor-pointer whitespace-nowrap"
                >
                  Update to {subtaskEffortTotal}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOverBudgetDismissed(true);
                  }}
                  className="text-xs text-text-tertiary hover:text-text-primary cursor-pointer whitespace-nowrap"
                >
                  Keep at {task.effort}
                </button>
              </div>
            )}
            <SubtaskList
              subtasks={task.subtasks}
              parentTaskId={task.id}
              projectId={projectId}
              parentEffort={task.effort}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete task"
        message={`Are you sure you want to delete "${task.name}"? This will also delete all subtasks.`}
        loading={loading}
      />
    </>
  );
}
