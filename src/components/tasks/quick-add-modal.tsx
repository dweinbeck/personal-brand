"use client";

import { useState } from "react";
import { createTaskAction } from "@/actions/tasks/task";
import { Button } from "@/components/tasks/ui/button";
import { Input } from "@/components/tasks/ui/input";
import { Modal } from "@/components/tasks/ui/modal";
import { useAuth } from "@/context/AuthContext";
import { EFFORT_VALUES } from "@/lib/tasks/effort";
import type { SidebarWorkspace } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  workspaces: SidebarWorkspace[];
  allTags: { id: string; name: string; color: string | null }[];
}

export function QuickAddModal({
  open,
  onClose,
  workspaces,
  allTags,
}: QuickAddModalProps) {
  const { user } = useAuth();
  const allProjects = workspaces.flatMap((w) =>
    w.projects.map((p) => ({ ...p, workspaceName: w.name })),
  );

  const [projectId, setProjectId] = useState(allProjects[0]?.id ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [effort, setEffort] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setName("");
    setDescription("");
    setDeadlineAt("");
    setSelectedTagIds([]);
    setEffort(null);
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !projectId) return;
    setLoading(true);
    setError(null);

    const token = await user!.getIdToken();
    const result = await createTaskAction(token, {
      projectId,
      name: name.trim(),
      description: description.trim() || undefined,
      deadlineAt: deadlineAt || null,
      effort,
      tagIds: selectedTagIds,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    handleClose();
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Quick Add Task">
      <form onSubmit={handleSubmit}>
        {error && <p className="text-sm text-danger mb-3">{error}</p>}

        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Task name"
          required
          autoFocus
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="mt-3 w-full px-3 py-2 text-sm border border-border rounded-[var(--radius-button)] bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
        />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-text-secondary mb-1 block">
              Project
            </span>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-border rounded-[var(--radius-button)] bg-surface focus:outline-none focus:ring-2 focus:ring-gold/50"
              required
            >
              {allProjects.length === 0 && (
                <option value="">No projects available</option>
              )}
              {workspaces.map((w) => (
                <optgroup key={w.id} label={w.name}>
                  {w.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-text-secondary mb-1 block">
              Deadline
            </span>
            <input
              type="datetime-local"
              value={deadlineAt}
              onChange={(e) => setDeadlineAt(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-border rounded-[var(--radius-button)] bg-surface focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </label>
        </div>

        {allTags.length > 0 && (
          <div className="mt-3">
            <span className="text-xs font-medium text-text-secondary mb-1.5 block">
              Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-2 py-0.5 text-xs rounded-full border transition-colors cursor-pointer ${
                    selectedTagIds.includes(tag.id)
                      ? "bg-gold-light border-gold text-primary font-medium"
                      : "border-border text-text-tertiary hover:border-gold hover:text-text-primary"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3">
          <span className="text-xs font-medium text-text-secondary mb-1.5 block">
            Effort
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EFFORT_VALUES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setEffort(effort === value ? null : value)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer",
                  effort === value
                    ? "bg-gold-light border-gold text-primary font-medium"
                    : "border-border text-text-tertiary hover:border-gold hover:text-text-primary",
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose} size="sm">
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={loading || !name.trim() || !projectId}
          >
            {loading ? "Adding..." : "Add task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
