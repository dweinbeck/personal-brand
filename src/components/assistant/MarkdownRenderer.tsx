import type { ReactNode } from "react";

type MarkdownRendererProps = {
  content: string;
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm max-w-none text-text-primary prose-headings:text-text-primary prose-p:text-text-primary prose-strong:text-text-primary prose-a:text-primary prose-a:underline hover:prose-a:text-gold prose-li:text-text-primary prose-code:text-primary prose-code:bg-gold-light prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-xs">
      {parseMarkdown(content)}
    </div>
  );
}

function parseMarkdown(text: string): ReactNode[] {
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let listItems: ReactNode[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Unordered list item
    if (/^[-*]\s+/.test(line)) {
      if (!inList) inList = true;
      listItems.push(
        <li key={`li-${i}`}>{parseInline(line.replace(/^[-*]\s+/, ""))}</li>,
      );
      continue;
    }

    // End of list
    if (inList) {
      elements.push(
        <ul key={`ul-${i}`} className="my-2 list-disc pl-4">
          {listItems}
        </ul>,
      );
      listItems = [];
      inList = false;
    }

    // Heading
    if (/^###\s+/.test(line)) {
      elements.push(
        <h3 key={`h3-${i}`} className="mt-3 mb-1 text-sm font-semibold">
          {parseInline(line.replace(/^###\s+/, ""))}
        </h3>,
      );
      continue;
    }
    if (/^##\s+/.test(line)) {
      elements.push(
        <h2 key={`h2-${i}`} className="mt-3 mb-1 text-base font-semibold">
          {parseInline(line.replace(/^##\s+/, ""))}
        </h2>,
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="mb-2 last:mb-0">
        {parseInline(line)}
      </p>,
    );
  }

  // Flush remaining list
  if (inList && listItems.length > 0) {
    elements.push(
      <ul key="ul-final" className="my-2 list-disc pl-4">
        {listItems}
      </ul>,
    );
  }

  return elements;
}

function parseInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  // Match bold, links, and inline code
  const regex = /(\*\*(.+?)\*\*)|(\[([^\]]+)\]\(([^)]+)\))|(`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Bold
      parts.push(<strong key={`b-${match.index}`}>{match[2]}</strong>);
    } else if (match[3]) {
      // Link
      const href = match[5];
      const isExternal = href.startsWith("http");
      parts.push(
        <a
          key={`a-${match.index}`}
          href={href}
          {...(isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {match[4]}
        </a>,
      );
    } else if (match[6]) {
      // Inline code
      parts.push(<code key={`c-${match.index}`}>{match[7]}</code>);
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
