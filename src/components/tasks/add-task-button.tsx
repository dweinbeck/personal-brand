"use client";

import { useState } from "react";
import { TaskForm } from "./task-form";

interface AddTaskButtonProps {
  projectId: string;
  sectionId?: string | null;
  allTags: { id: string; name: string; color: string | null }[];
  sections: { id: string; name: string }[];
}

export function AddTaskButton({
  projectId,
  sectionId,
  allTags,
  sections,
}: AddTaskButtonProps) {
  const [adding, setAdding] = useState(false);

  if (adding) {
    return (
      <TaskForm
        mode="create"
        projectId={projectId}
        sectionId={sectionId}
        allTags={allTags}
        sections={sections}
        onClose={() => setAdding(false)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setAdding(true)}
      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-tertiary hover:text-gold border border-dashed border-border rounded-[var(--radius-card)] hover:border-gold transition-colors cursor-pointer"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      Add task
    </button>
  );
}
