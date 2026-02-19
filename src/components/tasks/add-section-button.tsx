"use client";

import { useState } from "react";
import { createSectionAction } from "@/actions/tasks/section";
import { useAuth } from "@/context/AuthContext";

interface AddSectionButtonProps {
  projectId: string;
}

export function AddSectionButton({ projectId }: AddSectionButtonProps) {
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  async function handleAdd() {
    if (!name.trim()) return;
    const token = await user!.getIdToken();
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("name", name.trim());
    await createSectionAction(token, formData);
    setName("");
    setAdding(false);
  }

  if (adding) {
    return (
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Section name"
          autoFocus
          className="flex-1 px-3 py-2 text-sm border border-border rounded-[var(--radius-button)] bg-surface focus:outline-none focus:ring-2 focus:ring-gold/50"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
            if (e.key === "Escape") {
              setAdding(false);
              setName("");
            }
          }}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="text-sm text-gold hover:text-gold-hover transition-colors cursor-pointer"
        >
          Add
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setAdding(true)}
      className="flex items-center gap-2 text-sm text-text-tertiary hover:text-gold transition-colors cursor-pointer"
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
      Add section
    </button>
  );
}
