import { redirect } from "next/navigation";
import { getUserIdFromCookie } from "@/lib/tasks/auth";
import { getWorkspaces } from "@/services/tasks/workspace.service";

export default async function TasksPage() {
  const userId = await getUserIdFromCookie();
  if (!userId) redirect("/");

  const workspaces = await getWorkspaces(userId);
  const hasWorkspaces = workspaces.length > 0;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)] mb-2">
        Welcome to Tasks
      </h1>
      <p className="text-text-secondary mb-8">
        {hasWorkspaces
          ? "Select a project from the sidebar to get started, or create a new one."
          : "Create a workspace in the sidebar to get started."}
      </p>

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
