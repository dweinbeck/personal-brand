"use client";

import { AddSectionButton } from "@/components/tasks/add-section-button";
import { AddTaskButton } from "@/components/tasks/add-task-button";
import { TaskCard } from "@/components/tasks/task-card";
import { computeEffortSum } from "@/lib/tasks/effort";
import type { ProjectWithSections } from "@/lib/tasks/types";

interface BoardViewProps {
  project: ProjectWithSections;
  allTags: { id: string; name: string; color: string | null }[];
  sections: { id: string; name: string }[];
}

export function BoardView({ project, allTags, sections }: BoardViewProps) {
  const columns = [
    {
      id: null,
      name: "No Section",
      tasks: project.tasks.filter((t) => t.status !== "COMPLETED"),
    },
    ...project.sections.map((section) => ({
      id: section.id,
      name: section.name,
      tasks: section.tasks.filter((t) => t.status !== "COMPLETED"),
    })),
  ];

  // Auto-archive: only show completed tasks from today or yesterday
  const archiveCutoff = new Date();
  archiveCutoff.setHours(0, 0, 0, 0);
  archiveCutoff.setDate(archiveCutoff.getDate() - 1);

  const allCompletedTasks = [
    ...project.tasks.filter((t) => t.status === "COMPLETED"),
    ...project.sections.flatMap((s) =>
      s.tasks.filter((t) => t.status === "COMPLETED"),
    ),
  ];

  const completedTasks = allCompletedTasks.filter(
    (t) => new Date(t.updatedAt) >= archiveCutoff,
  );
  const archivedCount = allCompletedTasks.length - completedTasks.length;

  const completedEffortSum = completedTasks
    .filter((t) => t.effort != null)
    .reduce((sum, t) => sum + (t.effort as number), 0);

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
              <TaskCard
                key={task.id}
                task={task}
                projectId={project.id}
                allTags={allTags}
                sections={sections}
              />
            ))}
          </div>

          <div className="mt-2">
            <AddTaskButton
              projectId={project.id}
              sectionId={col.id}
              allTags={allTags}
              sections={sections}
            />
          </div>
        </div>
      ))}

      <div className="flex items-start w-72 shrink-0">
        <div className="w-full pt-0.5">
          <AddSectionButton projectId={project.id} />
        </div>
      </div>

      {(completedTasks.length > 0 || archivedCount > 0) && (
        <div className="flex flex-col w-72 shrink-0">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-sage"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Completed
            </h3>
            <div className="flex items-center gap-1">
              <span className="text-xs text-text-tertiary">
                {completedTasks.length}
              </span>
              {completedEffortSum > 0 && (
                <span className="text-xs text-amber">
                  ({completedEffortSum})
                </span>
              )}
              {archivedCount > 0 && (
                <span className="text-[10px] text-text-tertiary ml-1">
                  +{archivedCount} archived
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                projectId={project.id}
                allTags={allTags}
                sections={sections}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
