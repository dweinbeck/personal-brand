"use client";

import { useState } from "react";
import { createTaskAction, updateTaskAction } from "@/actions/tasks/task";
import { Button } from "@/components/tasks/ui/button";
import { Input } from "@/components/tasks/ui/input";
import { useAuth } from "@/context/AuthContext";
import { EFFORT_VALUES } from "@/lib/tasks/effort";
import type { TaskWithRelations } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

interface TaskFormProps {
  mode: "create" | "edit";
  projectId: string;
  sectionId?: string | null;
  task?: TaskWithRelations;
  allTags: { id: string; name: string; color: string | null }[];
  sections: { id: string; name: string }[];
  onClose: () => void;
}

export function TaskForm({
  mode,
  projectId,
  sectionId,
  task,
  allTags,
  sections,
  onClose,
}: TaskFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState(task?.name ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [deadlineAt, setDeadlineAt] = useState(
    task?.deadlineAt
      ? new Date(task.deadlineAt).toISOString().slice(0, 16)
      : "",
  );
  const [selectedSection, setSelectedSection] = useState(
    task?.sectionId ?? sectionId ?? "",
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    task?.tags.map((t) => t.tag.id) ?? [],
  );
  const [effort, setEffort] = useState<number | null>(task?.effort ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = await user!.getIdToken();

    const result =
      mode === "create"
        ? await createTaskAction(token, {
            projectId,
            sectionId: selectedSection || null,
            name: name.trim(),
            description: description.trim() || undefined,
            deadlineAt: deadlineAt || null,
            effort,
            tagIds: selectedTagIds,
          })
        : await updateTaskAction(token, {
            id: task?.id ?? "",
            name: name.trim(),
            description: description.trim() || null,
            deadlineAt: deadlineAt || null,
            sectionId: selectedSection || null,
            effort,
            tagIds: selectedTagIds,
          });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    onClose();
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
    >
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
            Deadline
          </span>
          <input
            type="datetime-local"
            value={deadlineAt}
            onChange={(e) => setDeadlineAt(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-border rounded-[var(--radius-button)] bg-surface focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-text-secondary mb-1 block">
            Section
          </span>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-border rounded-[var(--radius-button)] bg-surface focus:outline-none focus:ring-2 focus:ring-gold/50"
          >
            <option value="">No section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
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
        <Button type="button" variant="ghost" onClick={onClose} size="sm">
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={loading || !name.trim()}>
          {loading
            ? mode === "create"
              ? "Adding..."
              : "Saving..."
            : mode === "create"
              ? "Add task"
              : "Save"}
        </Button>
      </div>
    </form>
  );
}
