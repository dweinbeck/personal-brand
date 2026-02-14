"use client";

// ── Types ───────────────────────────────────────────────────────

interface ExportTurn {
  prompt: string;
  geminiResponse: string;
  openaiResponse: string;
  geminiReconsider?: string;
  openaiReconsider?: string;
}

interface ExportConversation {
  title: string;
  tier: string;
  turns: ExportTurn[];
}

// ── Markdown conversion ─────────────────────────────────────────

export function conversationToMarkdown(
  conversation: ExportConversation,
): string {
  const lines: string[] = [];

  lines.push(`# ${conversation.title}`);
  lines.push("");
  lines.push(`**Tier:** ${conversation.tier}`);
  lines.push(`**Exported:** ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");

  for (let i = 0; i < conversation.turns.length; i++) {
    const turn = conversation.turns[i];

    if (i > 0) {
      lines.push("---");
      lines.push("");
    }

    lines.push(`## Turn ${i + 1}`);
    lines.push("");
    lines.push("### Prompt");
    lines.push("");
    lines.push(turn.prompt);
    lines.push("");
    lines.push("### Gemini Response");
    lines.push("");
    lines.push(turn.geminiResponse);
    lines.push("");
    lines.push("### OpenAI Response");
    lines.push("");
    lines.push(turn.openaiResponse);
    lines.push("");

    if (turn.geminiReconsider) {
      lines.push("#### Gemini (Reconsidered)");
      lines.push("");
      lines.push(turn.geminiReconsider);
      lines.push("");
    }

    if (turn.openaiReconsider) {
      lines.push("#### OpenAI (Reconsidered)");
      lines.push("");
      lines.push(turn.openaiReconsider);
      lines.push("");
    }
  }

  return lines.join("\n");
}

// ── Download helper ─────────────────────────────────────────────

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Component ───────────────────────────────────────────────────

interface ExportButtonProps {
  conversation: ExportConversation;
}

export function ExportButton({ conversation }: ExportButtonProps) {
  function handleExport() {
    const markdown = conversationToMarkdown(conversation);
    const slug = conversation.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(markdown, `research-${slug}-${date}.md`);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14H2.75Z" />
        <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z" />
      </svg>
      Export Markdown
    </button>
  );
}
