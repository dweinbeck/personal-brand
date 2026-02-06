import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReadmeRendererProps {
  content: string;
}

export function ReadmeRenderer({ content }: ReadmeRendererProps) {
  return (
    <div className="prose prose-neutral max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-a:text-gold prose-a:no-underline hover:prose-a:underline prose-strong:text-text-primary prose-code:text-gold-hover prose-code:bg-gold-light/30 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-primary/5 prose-pre:border prose-pre:border-border">
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
}
