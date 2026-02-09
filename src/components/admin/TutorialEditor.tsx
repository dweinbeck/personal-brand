"use client";

import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/context/AuthContext";
import { saveTutorial } from "@/lib/actions/content";

type MessageState = { type: "success" | "error"; text: string } | null;

const inputBase =
  "mt-1 block w-full rounded-lg border border-border px-3 py-2 shadow-sm transition-colors focus:border-gold focus:ring-1 focus:ring-gold min-h-[44px]";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function TutorialEditor() {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [publishedAt, setPublishedAt] = useState(todayISO);
  const [tagsInput, setTagsInput] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("");
  const [includeFast, setIncludeFast] = useState(false);
  const [fastBody, setFastBody] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  const slugManuallyEdited = useRef(false);

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value);
    setIsDirty(true);
    if (!slugManuallyEdited.current) {
      setSlug(generateSlug(value));
    }
  }, []);

  const handleSlugChange = useCallback((value: string) => {
    slugManuallyEdited.current = true;
    setSlug(value);
    setIsDirty(true);
  }, []);

  // beforeunload warning for unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const token = await user?.getIdToken();
      if (!token) {
        setMessage({ type: "error", text: "Not authenticated." });
        return;
      }
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const result = await saveTutorial(token, {
        slug,
        metadata: { title, description, publishedAt, tags },
        body,
        fastBody: includeFast && fastBody ? fastBody : undefined,
      });
      if (result.success) {
        setIsDirty(false);
        setMessage({
          type: "success",
          text: `Tutorial "${result.slug}" saved!`,
        });
      } else {
        setMessage({ type: "error", text: result.error });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Tutorial</h1>

      {/* Tab navigation */}
      <nav className="flex items-center gap-3 text-sm mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("edit")}
          className={
            activeTab === "edit"
              ? "font-semibold text-text-primary cursor-default"
              : "text-text-tertiary hover:text-gold transition-colors cursor-pointer"
          }
        >
          Edit
        </button>
        <span className="text-border select-none">|</span>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={
            activeTab === "preview"
              ? "font-semibold text-text-primary cursor-default"
              : "text-text-tertiary hover:text-gold transition-colors cursor-pointer"
          }
        >
          Preview
        </button>
      </nav>

      {/* Edit tab */}
      <div className={activeTab === "edit" ? "" : "hidden"}>
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="tutorial-title"
              className="block text-sm font-medium text-text-secondary"
            >
              Title
            </label>
            <input
              type="text"
              id="tutorial-title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className={inputBase}
            />
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor="tutorial-slug"
              className="block text-sm font-medium text-text-secondary"
            >
              Slug
            </label>
            <input
              type="text"
              id="tutorial-slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className={clsx(inputBase, "font-mono")}
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="tutorial-description"
              className="block text-sm font-medium text-text-secondary"
            >
              Description
            </label>
            <textarea
              id="tutorial-description"
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setIsDirty(true);
              }}
              className={inputBase}
            />
          </div>

          {/* Published Date */}
          <div>
            <label
              htmlFor="tutorial-date"
              className="block text-sm font-medium text-text-secondary"
            >
              Published Date
            </label>
            <input
              type="date"
              id="tutorial-date"
              value={publishedAt}
              onChange={(e) => {
                setPublishedAt(e.target.value);
                setIsDirty(true);
              }}
              className={inputBase}
            />
          </div>

          {/* Tags */}
          <div>
            <label
              htmlFor="tutorial-tags"
              className="block text-sm font-medium text-text-secondary"
            >
              Tags
            </label>
            <input
              type="text"
              id="tutorial-tags"
              value={tagsInput}
              placeholder="Separate tags with commas"
              onChange={(e) => {
                setTagsInput(e.target.value);
                setIsDirty(true);
              }}
              className={inputBase}
            />
          </div>

          {/* Body */}
          <div>
            <label
              htmlFor="tutorial-body"
              className="block text-sm font-medium text-text-secondary"
            >
              Body
            </label>
            <textarea
              id="tutorial-body"
              rows={20}
              value={body}
              placeholder="Write your markdown content here..."
              onChange={(e) => {
                setBody(e.target.value);
                setIsDirty(true);
              }}
              className={clsx(inputBase, "font-mono")}
            />
          </div>

          {/* Fast companion toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="include-fast"
              checked={includeFast}
              onChange={(e) => {
                setIncludeFast(e.target.checked);
                setIsDirty(true);
              }}
              className="h-4 w-4 rounded border-border text-gold focus:ring-gold"
            />
            <label
              htmlFor="include-fast"
              className="text-sm font-medium text-text-secondary"
            >
              Include fast companion
            </label>
          </div>

          {/* Fast companion body */}
          {includeFast && (
            <div>
              <label
                htmlFor="tutorial-fast-body"
                className="block text-sm font-medium text-text-secondary"
              >
                Fast Companion Body
              </label>
              <textarea
                id="tutorial-fast-body"
                rows={10}
                value={fastBody}
                placeholder="Write the fast companion content..."
                onChange={(e) => {
                  setFastBody(e.target.value);
                  setIsDirty(true);
                }}
                className={clsx(inputBase, "font-mono")}
              />
            </div>
          )}
        </div>

        {/* Save button */}
        <div className="mt-6">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center rounded-lg bg-gold px-6 py-2 text-sm font-medium text-navy-dark hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Tutorial"}
          </button>
        </div>

        {/* Message display */}
        {message && (
          <p
            className={clsx(
              "mt-4 text-sm",
              message.type === "success" ? "text-green-600" : "text-red-600",
            )}
          >
            {message.text}
          </p>
        )}
      </div>

      {/* Preview tab */}
      <div className={activeTab === "preview" ? "" : "hidden"}>
        {body ? (
          <div className="prose prose-neutral max-w-none">
            <Markdown remarkPlugins={[remarkGfm]}>{body}</Markdown>
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">
            Nothing to preview yet. Switch to the Edit tab and write some
            content.
          </p>
        )}
      </div>
    </div>
  );
}
