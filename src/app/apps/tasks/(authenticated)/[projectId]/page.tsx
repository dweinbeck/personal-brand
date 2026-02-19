import { notFound, redirect } from "next/navigation";
import { getUserIdFromCookie } from "@/lib/tasks/auth";
import { getProject } from "@/services/tasks/project.service";
import { getTags } from "@/services/tasks/tag.service";
import { ProjectView } from "./project-view";

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const userId = await getUserIdFromCookie();
  if (!userId) redirect("/");

  const { projectId } = await params;
  const [project, tags] = await Promise.all([
    getProject(userId, projectId),
    getTags(userId),
  ]);

  if (!project) {
    notFound();
  }

  const allTags = tags.map((t) => ({ id: t.id, name: t.name, color: t.color }));
  const sections = project.sections.map((s) => ({ id: s.id, name: s.name }));

  return (
    <ProjectView project={project} allTags={allTags} sections={sections} />
  );
}
