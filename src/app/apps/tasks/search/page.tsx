import { redirect } from "next/navigation";
import { TaskCard } from "@/components/tasks/task-card";
import { getUserIdFromCookie } from "@/lib/tasks/auth";
import { getTags } from "@/services/tasks/tag.service";
import { searchTasks } from "@/services/tasks/task.service";
import { SearchInput } from "./search-input";

export const metadata = { title: "Search" };

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const userId = await getUserIdFromCookie();
  if (!userId) redirect("/");

  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const [tasks, tags] = await Promise.all([
    query ? searchTasks(userId, query) : Promise.resolve([]),
    getTags(userId),
  ]);
  const allTags = tags.map((t) => ({ id: t.id, name: t.name, color: t.color }));

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)] mb-6">
        Search
      </h1>

      <SearchInput initialQuery={query} />

      {query && (
        <div className="mt-6">
          {tasks.length === 0 ? (
            <p className="text-sm text-text-tertiary">
              No tasks found for &quot;{query}&quot;.
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectId={task.projectId}
                  allTags={allTags}
                  sections={[]}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
