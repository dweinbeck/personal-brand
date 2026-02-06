"use client";

import { useMemo, useState } from "react";
import type { EnrichedProject } from "@/types/project";
import { DetailedProjectCard } from "./DetailedProjectCard";

type SortOption = "newest" | "oldest" | "updated";

interface ProjectsFilterProps {
  projects: EnrichedProject[];
}

/** Parse ISO date string or "Mon YYYY" strings into comparable Date objects. */
function parseProjectDate(dateStr: string | null): Date {
  if (!dateStr) return new Date(0); // Epoch for unknown dates
  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  // Fallback: treat as beginning of month
  return new Date(`1 ${dateStr}`);
}

export function ProjectsFilter({ projects }: ProjectsFilterProps) {
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [sortBy, setSortBy] = useState<SortOption>("updated");

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const project of projects) {
      for (const tag of project.tags) {
        tagSet.add(tag);
      }
    }
    return ["All", ...Array.from(tagSet).sort()];
  }, [projects]);

  // Filter
  const filtered = useMemo(() => {
    if (selectedTag === "All") return projects;
    return projects.filter((p) => p.tags.includes(selectedTag));
  }, [projects, selectedTag]);

  // Sort
  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortBy) {
      case "newest":
        return list.sort(
          (a, b) =>
            parseProjectDate(b.createdAt).getTime() -
            parseProjectDate(a.createdAt).getTime(),
        );
      case "oldest":
        return list.sort(
          (a, b) =>
            parseProjectDate(a.createdAt).getTime() -
            parseProjectDate(b.createdAt).getTime(),
        );
      case "updated":
        return list.sort(
          (a, b) =>
            parseProjectDate(b.pushedAt).getTime() -
            parseProjectDate(a.pushedAt).getTime(),
        );
      default:
        return list;
    }
  }, [filtered, sortBy]);

  return (
    <>
      {/* Filter / Sort bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Tag filter chips */}
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${
                selectedTag === tag
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-text-secondary border-border hover:border-primary/40 hover:text-text-primary"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <label
            htmlFor="sort-projects"
            className="text-xs text-text-tertiary font-medium"
          >
            Sort by:
          </label>
          <select
            id="sort-projects"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-xs border border-border rounded-lg px-3 py-1.5 bg-surface text-text-primary focus:outline-2 focus:outline-offset-2 focus:outline-gold"
          >
            <option value="updated">Recently updated</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-text-tertiary mt-4">
        Showing {sorted.length} of {projects.length} projects
        {selectedTag !== "All" && (
          <>
            {" "}
            tagged{" "}
            <span className="font-medium text-text-secondary">
              {selectedTag}
            </span>
          </>
        )}
      </p>

      {/* Project grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sorted.map((project) => (
          <DetailedProjectCard key={project.slug} project={project} />
        ))}
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-secondary">
            No projects match the selected filter.
          </p>
          <button
            type="button"
            onClick={() => setSelectedTag("All")}
            className="mt-2 text-sm text-gold-hover hover:text-gold underline"
          >
            Clear filter
          </button>
        </div>
      )}
    </>
  );
}
