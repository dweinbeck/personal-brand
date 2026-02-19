"use client";

import { useState } from "react";
import {
  deleteSectionAction,
  updateSectionAction,
} from "@/actions/tasks/section";
import { ConfirmDialog } from "@/components/tasks/ui/confirm-dialog";
import { useAuth } from "@/context/AuthContext";
import { useDemoMode } from "@/lib/tasks/demo";

interface SectionHeaderProps {
  section: { id: string; name: string };
  taskCount: number;
  effortSum: number;
}

export function SectionHeader({
  section,
  taskCount,
  effortSum,
}: SectionHeaderProps) {
  const { user } = useAuth();
  const isDemo = useDemoMode();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(section.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRename() {
    if (!name.trim() || name === section.name) {
      setEditing(false);
      setName(section.name);
      return;
    }
    const token = await user!.getIdToken();
    const formData = new FormData();
    formData.set("id", section.id);
    formData.set("name", name.trim());
    await updateSectionAction(token, formData);
    setEditing(false);
  }

  async function handleDelete() {
    setLoading(true);
    const token = await user!.getIdToken();
    await deleteSectionAction(token, section.id);
    setConfirmDelete(false);
    setLoading(false);
  }

  return (
    <>
      <div className="flex items-center justify-between py-2 group">
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setName(section.name);
                setEditing(false);
              }
            }}
            autoFocus
            className="text-sm font-semibold text-text-primary px-1 py-0.5 border border-border rounded-[var(--radius-button)] bg-surface focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
        ) : (
          <div className="flex items-center">
            {isDemo ? (
              <span className="text-sm font-semibold text-text-primary">
                {section.name}
                <span className="ml-2 text-xs font-normal text-text-tertiary">
                  {taskCount}
                </span>
                {effortSum > 0 && (
                  <span className="ml-1 text-xs font-normal text-amber">
                    ({effortSum})
                  </span>
                )}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-sm font-semibold text-text-primary hover:text-gold transition-colors cursor-pointer"
              >
                {section.name}
                <span className="ml-2 text-xs font-normal text-text-tertiary">
                  {taskCount}
                </span>
                {effortSum > 0 && (
                  <span className="ml-1 text-xs font-normal text-amber">
                    ({effortSum})
                  </span>
                )}
              </button>
            )}
          </div>
        )}
        {!isDemo && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-danger transition-all cursor-pointer"
            title="Delete section"
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
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete section"
        message={`Are you sure you want to delete "${section.name}"? Tasks in this section will be moved to unsectioned.`}
        loading={loading}
      />
    </>
  );
}
