import { fetchProjectSections, fetchProjectTasks, fetchTodoistProjects } from "@/lib/todoist";
import { TodoistBoard } from "@/components/admin/TodoistBoard";
import Link from "next/link";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function TodoistProjectPage({ params }: Props) {
  const { projectId } = await params;

  const [sections, tasks, projects] = await Promise.all([
    fetchProjectSections(projectId),
    fetchProjectTasks(projectId),
    fetchTodoistProjects(),
  ]);

  const project = projects.find((p) => p.id === projectId);
  const projectName = project?.name ?? "Project";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link
          href="/control-center"
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          &larr; Back to Control Center
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{projectName}</h1>
      <TodoistBoard sections={sections} tasks={tasks} />
    </div>
  );
}
