"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDemoContext } from "@/components/tasks/demo/DemoProvider";
import { cn } from "@/lib/utils";

export function DemoSidebar() {
  const pathname = usePathname();
  const { workspaces } = useDemoContext();

  return (
    <aside className="w-64 h-screen bg-surface border-r border-border flex flex-col overflow-y-auto shrink-0">
      <div className="p-4 border-b border-border">
        <Link href="/apps/tasks/demo" className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary font-[family-name:var(--font-display)]">
            Tasks
          </span>
          <span className="text-xs font-medium text-text-tertiary bg-gold-light px-1.5 py-0.5 rounded">
            Demo
          </span>
        </Link>
      </div>

      <div className="flex-1 p-3 overflow-y-auto">
        <div className="flex items-center mb-2 px-3">
          <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            Workspaces
          </span>
        </div>

        {workspaces.map((workspace) => (
          <div key={workspace.id} className="mb-3">
            <div className="flex items-center px-3 py-1.5">
              <span className="text-sm font-medium text-text-primary truncate">
                {workspace.name}
              </span>
            </div>

            <div className="space-y-0.5">
              {workspace.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/apps/tasks/demo/${project.id}`}
                  className={cn(
                    "flex items-center justify-between px-5 py-1.5 text-sm rounded-[var(--radius-button)] transition-colors duration-200",
                    pathname === `/apps/tasks/demo/${project.id}`
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
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
