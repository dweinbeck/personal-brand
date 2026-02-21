"use client";

type BrandCardHeaderProps = {
  favicon?: string;
  hostname: string;
  displayName?: string;
};

export function BrandCardHeader({
  favicon,
  hostname,
  displayName,
}: BrandCardHeaderProps) {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 border-b border-border px-3 py-2 flex items-center gap-3">
      {/* Traffic-light dots */}
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-amber-400" />
        <span className="w-3 h-3 rounded-full bg-emerald-400" />
      </div>

      {/* Browser tab */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-t-lg border border-b-0 border-border px-3 py-1 max-w-xs">
        {favicon ? (
          // biome-ignore lint/performance/noImgElement: GCS signed URLs have dynamic hostnames incompatible with next/image
          <img
            src={favicon}
            alt=""
            className="w-4 h-4 shrink-0"
            loading="lazy"
          />
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-text-tertiary"
            role="img"
            aria-label="Website"
          >
            <title>Website</title>
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        )}
        <span className="text-sm text-text-secondary truncate">
          {displayName ?? hostname}
        </span>
      </div>
    </div>
  );
}
