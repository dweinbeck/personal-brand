import { TasksKpiCard } from "@/components/tasks/TasksKpiCard";
import { getUserIdFromCookie } from "@/lib/tasks/auth";
import {
  getCompletedYesterdayCount,
  getMitTask,
  getNextTasks,
  getTotalTaskCount,
} from "@/services/tasks/task.service";
import { getWorkspaces } from "@/services/tasks/workspace.service";
import { ImportButton } from "./import-button";

export default async function TasksPage() {
  const userId = await getUserIdFromCookie();

  let hasWorkspaces = false;
  let kpiData: {
    completedYesterday: number;
    totalTasks: number;
    mitTask: { id: string; name: string; projectName: string | null } | null;
    nextTasks: { id: string; name: string; projectName: string | null }[];
  } | null = null;

  if (userId) {
    const [completedYesterday, totalTasks, mitTask, nextTasks, workspaces] =
      await Promise.all([
        getCompletedYesterdayCount(userId),
        getTotalTaskCount(userId),
        getMitTask(userId),
        getNextTasks(userId),
        getWorkspaces(userId),
      ]);

    kpiData = { completedYesterday, totalTasks, mitTask, nextTasks };
    hasWorkspaces = workspaces.length > 0;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-primary font-display mb-2">
        Welcome to Tasks
      </h1>
      <p className="text-text-secondary mb-8">
        {hasWorkspaces
          ? "Select a project from the sidebar to get started, or create a new one."
          : "Create a workspace in the sidebar to get started."}
      </p>

      {kpiData && (
        <>
          <TasksKpiCard
            completedYesterday={kpiData.completedYesterday}
            totalTasks={kpiData.totalTasks}
            mitTask={kpiData.mitTask}
            nextTasks={kpiData.nextTasks}
          />
          <ImportButton />
        </>
      )}

      {!hasWorkspaces && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <div className="text-text-tertiary mb-4">
            <svg
              className="mx-auto"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <p className="text-sm text-text-tertiary">
            Click the + button next to &quot;Workspaces&quot; in the sidebar to
            create your first workspace.
          </p>
        </div>
      )}
    </div>
  );
}
