import { notFound, redirect } from "next/navigation";
import { TaskCard } from "@/components/tasks/task-card";
import { getUserIdFromCookie } from "@/lib/tasks/auth";
import { getTags, getTasksByTag } from "@/services/tasks/tag.service";

interface TagDetailPageProps {
  params: Promise<{ tagId: string }>;
}

export default async function TagDetailPage({ params }: TagDetailPageProps) {
  const userId = await getUserIdFromCookie();
  if (!userId) redirect("/");

  const { tagId } = await params;
  const [tasks, tags] = await Promise.all([
    getTasksByTag(userId, tagId),
    getTags(userId),
  ]);

  const tag = tags.find((t) => t.id === tagId);
  if (!tag) {
    notFound();
  }

  const allTags = tags.map((t) => ({ id: t.id, name: t.name, color: t.color }));

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: tag.color ?? "#8a94a6" }}
        />
        <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">
          {tag.name}
        </h1>
        <span className="text-sm text-text-tertiary">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-text-tertiary">
            No tasks with this tag yet.
          </p>
        </div>
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
  );
}
