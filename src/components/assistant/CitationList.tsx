type Citation = {
  sourceId: string;
  url: string;
  title?: string;
};

type CitationListProps = {
  citations: Citation[];
};

export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <details className="mt-2 rounded-lg border border-border bg-surface/50 text-sm">
      <summary className="cursor-pointer px-3 py-2 text-text-secondary hover:text-text-primary transition-colors">
        Sources ({citations.length})
      </summary>
      <ul className="border-t border-border px-3 py-2 space-y-1">
        {citations.map((cite) => (
          <li key={cite.sourceId} className="flex items-center gap-1.5">
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-3 w-3 flex-shrink-0 text-text-tertiary"
              aria-hidden="true"
            >
              <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" />
            </svg>
            <a
              href={cite.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-primary hover:text-gold transition-colors underline decoration-border hover:decoration-gold"
            >
              {cite.title ?? cite.url}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
