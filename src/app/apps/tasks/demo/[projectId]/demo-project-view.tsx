"use client";

import { useState } from "react";
import { Badge } from "@/components/tasks/ui/badge";
import { computeEffortSum } from "@/lib/tasks/effort";
import type { ProjectWithSections, TaskWithRelations } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

interface DemoProjectViewProps {
  project: ProjectWithSections;
  allTags: { id: string; name: string; color: string | null }[];
  sections: { id: string; name: string }[];
}

type ViewMode = "list" | "board";

// ---------------------------------------------------------------------------
// Read-only task card (no mutations, no edit/delete, no toggle)
// ---------------------------------------------------------------------------
function DemoTaskCard({ task }: { task: TaskWithRelations }) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = task.status === "COMPLETED";

  const deadlineStr = task.deadlineAt
    ? new Date(task.deadlineAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const isOverdue =
    task.deadlineAt && new Date(task.deadlineAt) < new Date() && !isCompleted;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] motion-safe:hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
            isCompleted ? "bg-sage border-sage text-white" : "border-border",
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
              aria-hidden="true"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </div>

        <button
          type="button"
          className="flex-1 min-w-0 cursor-pointer text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-medium truncate",
                isCompleted
                  ? "line-through text-text-tertiary"
                  : "text-text-primary",
              )}
            >
              {task.name}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {deadlineStr && (
              <span
                className={cn(
                  "text-xs",
                  isOverdue ? "text-danger font-medium" : "text-text-tertiary",
                )}
              >
                {deadlineStr}
              </span>
            )}
            {task.effort != null && (
              <span className="text-xs font-medium text-amber px-1.5 py-0.5 rounded-full bg-amber/10 border border-amber/20">
                {task.effort}
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
                {task.subtasks.filter((s) => s.status === "COMPLETED").length}/
                {task.subtasks.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border">
          {task.description && (
            <p className="text-sm text-text-secondary mb-3">
              {task.description}
            </p>
          )}
          {task.subtasks.length > 0 && (
            <div className="space-y-1.5">
              {task.subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 pl-1">
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                      sub.status === "COMPLETED"
                        ? "bg-sage border-sage text-white"
                        : "border-border",
                    )}
                  >
                    {sub.status === "COMPLETED" && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        aria-hidden="true"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm",
                      sub.status === "COMPLETED"
                        ? "line-through text-text-tertiary"
                        : "text-text-secondary",
                    )}
                  >
                    {sub.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Read-only section header (no rename, no delete)
// ---------------------------------------------------------------------------
function DemoSectionHeader({
  section,
  taskCount,
  effortSum,
}: {
  section: { id: string; name: string };
  taskCount: number;
  effortSum: number;
}) {
  return (
    <div className="flex items-center py-2">
      <span className="text-sm font-semibold text-text-primary">
        {section.name}
        <span className="ml-2 text-xs font-normal text-text-tertiary">
          {taskCount}
        </span>
        {effortSum > 0 && (
          <span className="ml-1 text-xs font-normal text-amber">
            ({effortSum})
          </span>
        )}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Read-only board view (no add task / add section buttons)
// ---------------------------------------------------------------------------
function DemoBoardView({ project }: { project: ProjectWithSections }) {
  const columns = [
    { id: null, name: "No Section", tasks: project.tasks },
    ...project.sections.map((section) => ({
      id: section.id,
      name: section.name,
      tasks: section.tasks,
    })),
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-8rem)]">
      {columns.map((col) => (
        <div
          key={col.id ?? "unsectioned"}
          className="flex flex-col w-72 shrink-0"
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              {col.name}
            </h3>
            <div className="flex items-center gap-1">
              <span className="text-xs text-text-tertiary">
                {col.tasks.length}
              </span>
              {computeEffortSum(col.tasks) > 0 && (
                <span className="text-xs text-amber">
                  ({computeEffortSum(col.tasks)})
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {col.tasks.map((task) => (
              <DemoTaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main demo project view
// ---------------------------------------------------------------------------
export function DemoProjectView({
  project,
  allTags: _allTags,
  sections: _sections,
}: DemoProjectViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const allTopLevelTasks = [
    ...project.tasks,
    ...project.sections.flatMap((s) => s.tasks),
  ];
  const projectEffortSum = computeEffortSum(allTopLevelTasks);

  return (
    <div className={viewMode === "board" ? "p-8" : "p-8 max-w-3xl mx-auto"}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)] inline">
            {project.name}
          </h1>
          {projectEffortSum > 0 && (
            <span className="ml-3 text-base font-normal text-amber">
              {projectEffortSum} effort
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 ml-4 rounded-[var(--radius-button)] border border-border p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-[var(--radius-button)] transition-colors cursor-pointer ${
              viewMode === "list"
                ? "bg-gold-light text-primary"
                : "text-text-tertiary hover:text-text-primary"
            }`}
            title="List view"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("board")}
            className={`p-1.5 rounded-[var(--radius-button)] transition-colors cursor-pointer ${
              viewMode === "board"
                ? "bg-gold-light text-primary"
                : "text-text-tertiary hover:text-text-primary"
            }`}
            title="Board view"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="18" rx="1" />
              <rect x="14" y="3" width="7" height="12" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {viewMode === "board" ? (
        <DemoBoardView project={project} />
      ) : (
        <>
          {/* Unsectioned tasks */}
          {project.tasks.length > 0 && (
            <div className="mb-6">
              {computeEffortSum(project.tasks) > 0 && (
                <div className="text-xs text-amber mb-2">
                  {computeEffortSum(project.tasks)} effort
                </div>
              )}
              <div className="space-y-2">
                {project.tasks.map((task) => (
                  <DemoTaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Sections */}
          {project.sections.map((section) => (
            <div key={section.id} className="mb-6">
              <DemoSectionHeader
                section={section}
                taskCount={section.tasks.length}
                effortSum={computeEffortSum(section.tasks)}
              />
              <div className="space-y-2">
                {section.tasks.map((task) => (
                  <DemoTaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
