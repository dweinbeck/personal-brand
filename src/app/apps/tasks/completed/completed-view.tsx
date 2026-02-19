"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TaskCard } from "@/components/tasks/task-card";
import type { TaskWithRelations } from "@/lib/tasks/types";

interface CompletedViewProps {
  tasks: TaskWithRelations[];
  projects: { id: string; name: string }[];
  selectedProjectId: string | null;
}

export function CompletedView({
  tasks,
  projects,
  selectedProjectId,
}: CompletedViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleFilterChange(projectId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (projectId) {
      params.set("project", projectId);
    } else {
      params.delete("project");
    }
    router.push(`/apps/tasks/completed?${params.toString()}`);
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <select
          value={selectedProjectId ?? ""}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-border rounded-[var(--radius-button)] bg-surface focus:outline-none focus:ring-2 focus:ring-gold/50"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-text-tertiary">
          {tasks.length} completed task{tasks.length !== 1 ? "s" : ""}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-text-tertiary">No completed tasks yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              projectId={task.projectId}
              allTags={[]}
              sections={[]}
            />
          ))}
        </div>
      )}
    </>
  );
}
