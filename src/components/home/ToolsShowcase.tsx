import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CardButtonLabel } from "@/components/ui/CardButtonLabel";
import { getTools } from "@/data/tools";

const tagColor = "bg-gold-light text-gold-hover border-gold";

export function ToolsShowcase() {
  const tools = getTools();

  return (
    <section className="py-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary text-center">
        Explore Development Tools
      </h2>
      <p className="text-text-secondary text-center mt-2 mb-10">
        Single-function AI Development Utilities
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <div className="mt-8 text-center">
        <Button variant="secondary" size="sm" href="/tools">
          View all tools
        </Button>
      </div>
    </section>
  );
}
