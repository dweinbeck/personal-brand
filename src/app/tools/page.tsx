import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { CardButtonLabel } from "@/components/ui/CardButtonLabel";
import { getTools } from "@/data/tools";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Single-function development utilities and AI-powered tools built by Dan Weinbeck.",
};

const tagColor = "bg-gold-light text-gold-hover border-gold";

export default function ToolsPage() {
  const tools = getTools();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-text-primary">Tools</h1>
      <p className="mt-2 text-text-secondary">
        Single-function dev utilities and AI-powered tools for analytics,
        development, and planning.
      </p>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <Card
            key={tool.slug}
            variant="clickable"
            href={tool.href}
            className="group flex h-full flex-col p-8"
          >
            {/* Topic badge */}
            <span
              className={`self-start px-2.5 py-0.5 text-xs font-medium rounded-full border mb-3 ${tagColor}`}
            >
              {tool.tag}
            </span>

            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary group-hover:text-gold transition-colors duration-200">
              {tool.title}
            </h3>

            <p className="mt-1 text-sm text-text-secondary">{tool.subtitle}</p>

            <p className="mt-3 flex-1 text-sm text-text-secondary leading-relaxed line-clamp-3">
              {tool.description}
            </p>

            <div className="mt-auto pt-5">
              <CardButtonLabel>
                {tool.external ? "Open Tool" : "Enter App"}
              </CardButtonLabel>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
