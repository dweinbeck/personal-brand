import { fetchAllGitHubRepos } from "@/lib/github-admin";
import { RepoCard } from "@/components/admin/RepoCard";
import { fetchTodoistProjects } from "@/lib/todoist";
import { fetchProjectTasks } from "@/lib/todoist";
import { TodoistProjectCard } from "@/components/admin/TodoistProjectCard";

export const dynamic = "force-dynamic";

export default async function ControlCenterPage() {
  const [repos, todoistProjects] = await Promise.all([
    fetchAllGitHubRepos(),
    fetchTodoistProjects(),
  ]);

  const projectsWithCounts = await Promise.all(
    todoistProjects.map(async (project) => {
      const tasks = await fetchProjectTasks(project.id);
      return { ...project, taskCount: tasks.length };
    }),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Control Center</h1>

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Projects ({repos.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <RepoCard key={repo.name} {...repo} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          To Do Lists ({projectsWithCounts.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectsWithCounts.map((project) => (
            <TodoistProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              taskCount={project.taskCount}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
