"use client";

import { useState } from "react";
import {
  updateProjectAction,
  updateProjectViewModeAction,
} from "@/actions/tasks/project";
import { assignTaskToSectionAction } from "@/actions/tasks/task";
import { AddSectionButton } from "@/components/tasks/add-section-button";
import { AddTaskButton } from "@/components/tasks/add-task-button";
import { BoardView } from "@/components/tasks/board-view";
import { SectionHeader } from "@/components/tasks/section-header";
import { TaskCard } from "@/components/tasks/task-card";
import { useAuth } from "@/context/AuthContext";
import { computeEffortSum } from "@/lib/tasks/effort";
import type { ProjectWithSections } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

interface ProjectViewProps {
  project: ProjectWithSections;
  allTags: { id: string; name: string; color: string | null }[];
  sections: { id: string; name: string }[];
}

type ViewMode = "list" | "board";

export function ProjectView({ project, allTags, sections }: ProjectViewProps) {
  const { user } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(project.name);
  const initialViewMode: ViewMode =
    project.viewMode === "board" ? "board" : "list";
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<
    string | "unsectioned" | null
  >(null);

  async function handleDrop(e: React.DragEvent, sectionId: string | null) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      const token = await user!.getIdToken();
      await assignTaskToSectionAction(token, taskId, sectionId);
    }
    setDraggingTaskId(null);
    setDragOverSection(null);
  }

  async function handleViewModeToggle(mode: ViewMode) {
    setViewMode(mode);
    const token = await user!.getIdToken();
    await updateProjectViewModeAction(token, project.id, mode);
  }

  const allTopLevelTasks = [
    ...project.tasks,
    ...project.sections.flatMap((s) => s.tasks),
  ];
  const projectEffortSum = computeEffortSum(allTopLevelTasks);

  async function handleRename() {
    if (!name.trim() || name === project.name) {
      setEditingName(false);
      setName(project.name);
      return;
    }
    const token = await user!.getIdToken();
    const formData = new FormData();
    formData.set("id", project.id);
    formData.set("name", name.trim());
    await updateProjectAction(token, formData);
    setEditingName(false);
  }

  return (
    <div className={viewMode === "board" ? "p-8" : "p-8 max-w-3xl mx-auto"}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1">
          {editingName ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setName(project.name);
                  setEditingName(false);
                }
              }}
              autoFocus
              className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)] bg-transparent border-b-2 border-gold focus:outline-none w-full"
            />
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)] hover:text-gold transition-colors cursor-pointer text-left"
              >
                {project.name}
              </button>
              {projectEffortSum > 0 && (
                <span className="ml-3 text-base font-normal text-amber">
                  {projectEffortSum} effort
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <div className="flex items-center gap-1 rounded-[var(--radius-button)] border border-border p-0.5">
            <button
              type="button"
              onClick={() => handleViewModeToggle("list")}
              className={`p-1.5 rounded-[var(--radius-button)] transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-gold-light text-primary"
                  : "text-text-tertiary hover:text-text-primary"
              }`}
              title="List view"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeToggle("board")}
              className={`p-1.5 rounded-[var(--radius-button)] transition-colors cursor-pointer ${
                viewMode === "board"
                  ? "bg-gold-light text-primary"
                  : "text-text-tertiary hover:text-text-primary"
              }`}
              title="Board view"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="12" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {viewMode === "board" ? (
        <BoardView project={project} allTags={allTags} sections={sections} />
      ) : (
        <>
          {/* Unsectioned tasks */}
          <section
            aria-label="Unsectioned tasks"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDragOverSection("unsectioned");
            }}
            onDragLeave={() => setDragOverSection(null)}
            onDrop={(e) => handleDrop(e, null)}
            className={cn(
              "mb-6 min-h-[40px] rounded-lg transition-colors",
              dragOverSection === "unsectioned" &&
                draggingTaskId &&
                "bg-gold-light/30 ring-2 ring-gold/30 ring-dashed",
            )}
          >
            {project.tasks.length > 0 && (
              <>
                {computeEffortSum(project.tasks) > 0 && (
                  <div className="text-xs text-amber mb-2">
                    {computeEffortSum(project.tasks)} effort
                  </div>
                )}
                <ul className="space-y-2 list-none p-0 m-0">
                  {project.tasks.map((task) => (
                    <li
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggingTaskId(task.id);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", task.id);
                      }}
                      onDragEnd={() => {
                        setDraggingTaskId(null);
                        setDragOverSection(null);
                      }}
                      className={cn(
                        "transition-opacity flex items-stretch group/drag",
                        draggingTaskId === task.id && "opacity-50",
                      )}
                    >
                      <div className="flex items-center pr-1 cursor-grab active:cursor-grabbing opacity-0 group-hover/drag:opacity-100 transition-opacity text-text-tertiary hover:text-gold">
                        <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
                          <circle cx="3" cy="4" r="1.5" />
                          <circle cx="9" cy="4" r="1.5" />
                          <circle cx="3" cy="10" r="1.5" />
                          <circle cx="9" cy="10" r="1.5" />
                          <circle cx="3" cy="16" r="1.5" />
                          <circle cx="9" cy="16" r="1.5" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                      <TaskCard
                        task={task}
                        projectId={project.id}
                        allTags={allTags}
                        sections={sections}
                      />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <div className="mb-4">
            <AddTaskButton
              projectId={project.id}
              allTags={allTags}
              sections={sections}
            />
          </div>

          {/* Sections */}
          {project.sections.map((section) => (
            <div key={section.id} className="mb-6">
              <SectionHeader
                section={section}
                taskCount={section.tasks.length}
                effortSum={computeEffortSum(section.tasks)}
              />
              <ul
                aria-label={`${section.name} tasks`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOverSection(section.id);
                }}
                onDragLeave={() => setDragOverSection(null)}
                onDrop={(e) => handleDrop(e, section.id)}
                className={cn(
                  "space-y-2 min-h-[40px] rounded-lg transition-colors list-none p-0 m-0",
                  dragOverSection === section.id &&
                    draggingTaskId &&
                    "bg-gold-light/30 ring-2 ring-gold/30 ring-dashed",
                )}
              >
                {section.tasks.map((task) => (
                  <li
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggingTaskId(task.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", task.id);
                    }}
                    onDragEnd={() => {
                      setDraggingTaskId(null);
                      setDragOverSection(null);
                    }}
                    className={cn(
                      "transition-opacity flex items-stretch group/drag",
                      draggingTaskId === task.id && "opacity-50",
                    )}
                  >
                    <div className="flex items-center pr-1 cursor-grab active:cursor-grabbing opacity-0 group-hover/drag:opacity-100 transition-opacity text-text-tertiary hover:text-gold">
                      <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
                        <circle cx="3" cy="4" r="1.5" />
                        <circle cx="9" cy="4" r="1.5" />
                        <circle cx="3" cy="10" r="1.5" />
                        <circle cx="9" cy="10" r="1.5" />
                        <circle cx="3" cy="16" r="1.5" />
                        <circle cx="9" cy="16" r="1.5" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                    <TaskCard
                      task={task}
                      projectId={project.id}
                      allTags={allTags}
                      sections={sections}
                    />
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-2">
                <AddTaskButton
                  projectId={project.id}
                  sectionId={section.id}
                  allTags={allTags}
                  sections={sections}
                />
              </div>
            </div>
          ))}

          <div className="mt-6">
            <AddSectionButton projectId={project.id} />
          </div>
        </>
      )}
    </div>
  );
}
