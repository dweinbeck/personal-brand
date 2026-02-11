"use client";

import { useMemo } from "react";
import type { ProgressEvent } from "@/lib/brand-scraper/types";

type PageEntry = {
  url: string;
  status: "scraping" | "done" | "failed";
  isHomepage: boolean;
};

type FileEntry = {
  filename: string;
  sizeBytes: number;
};

type ScrapeProgressPanelProps = {
  events: ProgressEvent[];
};

function formatUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const path =
      u.pathname.length > 30 ? `${u.pathname.slice(0, 27)}...` : u.pathname;
    return `${u.hostname}${path === "/" ? "" : path}`;
  } catch {
    return raw.length > 40 ? `${raw.slice(0, 37)}...` : raw;
  }
}

function formatSize(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function ScrapeProgressPanel({ events }: ScrapeProgressPanelProps) {
  const { pages, files } = useMemo(() => {
    const pageMap = new Map<string, PageEntry>();
    const fileList: FileEntry[] = [];

    for (const event of events) {
      const detail = event.detail ?? {};

      if (event.type === "page_started") {
        const url = String(detail.url ?? "");
        if (url) {
          pageMap.set(url, {
            url,
            status: "scraping",
            isHomepage: Boolean(detail.isHomepage),
          });
        }
      }

      if (event.type === "page_done") {
        const url = String(detail.url ?? "");
        if (url) {
          pageMap.set(url, {
            url,
            status: detail.failed ? "failed" : "done",
            isHomepage:
              pageMap.get(url)?.isHomepage ?? Boolean(detail.isHomepage),
          });
        }
      }

      if (event.type === "asset_saved") {
        fileList.push({
          filename: String(detail.filename ?? "unknown"),
          sizeBytes: Number(detail.sizeBytes ?? detail.size_bytes ?? 0),
        });
      }
    }

    return { pages: Array.from(pageMap.values()), files: fileList };
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-text-tertiary">
        Waiting for progress data...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
      {/* Pages section */}
      {pages.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Pages being scraped
          </h4>
          <ul className="space-y-1">
            {pages.map((page) => (
              <li key={page.url} className="flex items-center gap-2 text-sm">
                {page.status === "scraping" && (
                  <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                )}
                {page.status === "done" && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                )}
                {page.status === "failed" && (
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                )}
                <span className="text-text-primary truncate">
                  {formatUrl(page.url)}
                </span>
                {page.isHomepage && (
                  <span className="text-[10px] font-medium text-gold bg-gold-light px-1.5 py-0.5 rounded">
                    homepage
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Files section */}
      {files.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Files saved
          </h4>
          <ul className="space-y-1">
            {files.map((file, i) => (
              <li
                key={`${file.filename}-${i}`}
                className="flex items-center gap-2 text-sm"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  role="img"
                  aria-label="File"
                >
                  <title>File</title>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="text-text-primary truncate">
                  {file.filename}
                </span>
                {file.sizeBytes > 0 && (
                  <span className="text-text-tertiary text-xs ml-auto shrink-0">
                    {formatSize(file.sizeBytes)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
