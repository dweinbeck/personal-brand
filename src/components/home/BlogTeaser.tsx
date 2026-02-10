import { Button } from "@/components/ui/Button";

export function BlogTeaser() {
  return (
    <section className="py-16 motion-safe:animate-fade-in-up">
      <div className="relative rounded-2xl border border-border bg-gradient-to-r from-[rgba(27,42,74,0.03)] to-[rgba(200,165,90,0.04)] p-8 md:p-10 border-l-4 border-l-gold shadow-[var(--shadow-card)]">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary mb-4">
          Building Blocks
        </h2>
        <p className="text-text-secondary mb-6 max-w-lg leading-relaxed text-lg">
          Practical, step-by-step tutorials on common development tasks.
        </p>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" href="/building-blocks">
            Go to Building Blocks
          </Button>
          <Button variant="ghost" size="sm" href="/assistant">
            Ask Dan
          </Button>
        </div>
      </div>
    </section>
  );
}
