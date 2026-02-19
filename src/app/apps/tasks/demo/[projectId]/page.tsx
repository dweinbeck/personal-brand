"use client";

import { use } from "react";
import { useDemoContext } from "@/components/tasks/demo/DemoProvider";
import { DemoProjectView } from "./demo-project-view";

interface DemoProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default function DemoProjectPage({ params }: DemoProjectPageProps) {
  const { projectId } = use(params);
  const { projects, sidebarTags } = useDemoContext();
  const project = projects.get(projectId);

  if (!project) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">
          Project not found
        </h1>
        <p className="text-text-secondary mt-2">
          The demo project you are looking for does not exist.
        </p>
      </div>
    );
  }

  const allTags = sidebarTags;
  const sections = project.sections.map((s) => ({ id: s.id, name: s.name }));

  return (
    <DemoProjectView project={project} allTags={allTags} sections={sections} />
  );
}
