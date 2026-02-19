import { redirect } from "next/navigation";
import { getUserIdFromCookie } from "@/lib/tasks/auth";
import { getAllProjects } from "@/services/tasks/project.service";
import { getCompletedTasks } from "@/services/tasks/task.service";
import { CompletedView } from "./completed-view";

export const metadata = { title: "Completed" };

interface CompletedPageProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function CompletedPage({
  searchParams,
}: CompletedPageProps) {
  const userId = await getUserIdFromCookie();
  if (!userId) redirect("/");

  const { project: projectId } = await searchParams;
  const [tasks, projects] = await Promise.all([
    getCompletedTasks(userId, projectId),
    getAllProjects(userId),
  ]);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)] mb-6">
        Completed
      </h1>

      <CompletedView
        tasks={tasks}
        projects={projects}
        selectedProjectId={projectId ?? null}
      />
    </div>
  );
}
