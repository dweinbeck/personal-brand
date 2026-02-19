import { redirect } from "next/navigation";
import { getUserIdFromCookie } from "@/lib/tasks/auth";
import { getTags } from "@/services/tasks/tag.service";
import { TagList } from "./tag-list";

export const metadata = { title: "Filters & Tags" };

export default async function TagsPage() {
  const userId = await getUserIdFromCookie();
  if (!userId) redirect("/");

  const tags = await getTags(userId);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)] mb-6">
        Filters & Tags
      </h1>

      <TagList
        tags={tags.map((t) => ({
          id: t.id,
          name: t.name,
          color: t.color,
          taskCount: t._count.tasks,
        }))}
      />
    </div>
  );
}
