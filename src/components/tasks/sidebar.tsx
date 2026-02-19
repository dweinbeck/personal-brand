"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  createProjectAction,
  deleteProjectAction,
} from "@/actions/tasks/project";
import {
  createWorkspaceAction,
  deleteWorkspaceAction,
} from "@/actions/tasks/workspace";
import { QuickAddModal } from "@/components/tasks/quick-add-modal";
import { ConfirmDialog } from "@/components/tasks/ui/confirm-dialog";
import { HelpTip } from "@/components/tasks/ui/help-tip";
import { useAuth } from "@/context/AuthContext";
import type { SidebarWorkspace } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  workspaces: SidebarWorkspace[];
  allTags: { id: string; name: string; color: string | null }[];
}

const navItems = [
  { href: "/apps/tasks/today", label: "Today", icon: "sun" },
  { href: "/apps/tasks/completed", label: "Completed", icon: "check" },
  { href: "/apps/tasks/search", label: "Search", icon: "search" },
  { href: "/apps/tasks/tags", label: "Filters & Tags", icon: "tag" },
];

function NavIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "sun":
      return (
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
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      );
    case "check":
      return (
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
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "search":
      return (
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
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      );
    case "tag":
      return (
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
          <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
          <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

export function Sidebar({ workspaces, allTags }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [addingWorkspace, setAddingWorkspace] = useState(false);
  const [addingProjectFor, setAddingProjectFor] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "workspace" | "project";
    id: string;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  async function handleAddWorkspace(formData: FormData) {
    setLoading(true);
    const token = await user!.getIdToken();
    await createWorkspaceAction(token, formData);
    setAddingWorkspace(false);
    setLoading(false);
  }

  async function handleAddProject(formData: FormData) {
    setLoading(true);
    const token = await user!.getIdToken();
    await createProjectAction(token, formData);
    setAddingProjectFor(null);
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setLoading(true);
    const token = await user!.getIdToken();
    if (deleteTarget.type === "workspace") {
      await deleteWorkspaceAction(token, deleteTarget.id);
    } else {
      await deleteProjectAction(token, deleteTarget.id);
    }
    setDeleteTarget(null);
    setLoading(false);
  }

  return (
    <>
      <aside className="w-64 h-screen bg-surface border-r border-border flex flex-col overflow-y-auto shrink-0">
        <div className="px-3 pt-3 pb-1 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary rounded-[var(--radius-button)] hover:bg-primary/90 transition-colors cursor-pointer"
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
            Add Task
          </button>
          <HelpTip tipId="quick-add" />
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-button)] text-sm transition-colors duration-200",
                pathname === item.href
                  ? "bg-gold-light text-primary font-medium"
                  : "text-text-secondary hover:bg-gold-light hover:text-text-primary",
              )}
            >
              <NavIcon icon={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1 p-3 overflow-y-auto">
          <div className="flex items-center justify-between mb-2 px-3">
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              Workspaces
            </span>
            <button
              type="button"
              onClick={() => setAddingWorkspace(true)}
              className="text-text-tertiary hover:text-gold transition-colors cursor-pointer"
              title="Add workspace"
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
            </button>
          </div>

          {addingWorkspace && (
            <form action={handleAddWorkspace} className="px-3 mb-2">
              <input
                name="name"
                placeholder="Workspace name"
                autoFocus
                required
                className="w-full px-2 py-1.5 text-sm border border-border rounded-[var(--radius-button)] bg-surface focus:outline-none focus:ring-2 focus:ring-gold/50"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setAddingWorkspace(false);
                }}
              />
            </form>
          )}

          {workspaces.map((workspace) => (
            <div key={workspace.id} className="mb-3">
              <div className="flex items-center justify-between px-3 py-1.5 group">
                <span className="text-sm font-medium text-text-primary truncate">
                  {workspace.name}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setAddingProjectFor(workspace.id)}
                    className="text-text-tertiary hover:text-gold transition-colors cursor-pointer"
                    title="Add project"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget({
                        type: "workspace",
                        id: workspace.id,
                        name: workspace.name,
                      })
                    }
                    className="text-text-tertiary hover:text-danger transition-colors cursor-pointer"
                    title="Delete workspace"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              {addingProjectFor === workspace.id && (
                <form action={handleAddProject} className="px-5 mb-1">
                  <input
                    type="hidden"
                    name="workspaceId"
                    value={workspace.id}
                  />
                  <input
                    name="name"
                    placeholder="Project name"
                    autoFocus
                    required
                    className="w-full px-2 py-1.5 text-sm border border-border rounded-[var(--radius-button)] bg-surface focus:outline-none focus:ring-2 focus:ring-gold/50"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setAddingProjectFor(null);
                    }}
                  />
                </form>
              )}

              <div className="space-y-0.5">
                {workspace.projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center group/project"
                  >
                    <Link
                      href={`/apps/tasks/${project.id}`}
                      className={cn(
                        "flex-1 flex items-center justify-between px-5 py-1.5 text-sm rounded-[var(--radius-button)] transition-colors duration-200",
                        pathname === `/apps/tasks/${project.id}`
                          ? "bg-gold-light text-primary font-medium"
                          : "text-text-secondary hover:bg-gold-light hover:text-text-primary",
                      )}
                    >
                      <span className="truncate">{project.name}</span>
                      {project.openTaskCount > 0 && (
                        <span className="text-xs text-text-tertiary ml-2">
                          {project.openTaskCount}
                        </span>
                      )}
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          type: "project",
                          id: project.id,
                          name: project.name,
                        })
                      }
                      className="text-text-tertiary hover:text-danger transition-colors opacity-0 group-hover/project:opacity-100 mr-2 cursor-pointer"
                      title="Delete project"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.type ?? ""}`}
        message={`Are you sure you want to delete "${deleteTarget?.name ?? ""}"? This will permanently delete all its contents.`}
        loading={loading}
      />

      <QuickAddModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        workspaces={workspaces}
        allTags={allTags}
      />
    </>
  );
}
