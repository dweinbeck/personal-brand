import type { Tutorial } from "@/lib/tutorials";
import { Card } from "@/components/ui/Card";

interface TutorialCardProps {
  tutorial: Tutorial;
}

export function TutorialCard({ tutorial }: TutorialCardProps) {
  return (
    <Card variant="clickable" href={`/building-blocks/${tutorial.slug}`}>
      <h2 className="font-semibold text-text-primary">{tutorial.metadata.title}</h2>
      <p className="mt-2 text-sm text-text-secondary">
        {tutorial.metadata.description}
      </p>
      {tutorial.metadata.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tutorial.metadata.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full bg-gold-light px-2.5 py-0.5 text-xs font-medium text-text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
