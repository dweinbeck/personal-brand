import { Button } from "@/components/ui/Button";

export function BlogTeaser() {
  return (
    <section className="py-16 motion-safe:animate-fade-in-up">
      <div className="relative rounded-2xl border border-white/10 bg-white/5 p-8 md:p-10 border-l-4 border-l-gold shadow-[var(--shadow-card)]">
        <h2 className="text-2xl font-semibold tracking-tight text-white mb-4">
          Writing
        </h2>
        <p className="text-white/60 mb-6 max-w-lg leading-relaxed text-lg">
          Coming soon -- thoughts on AI development, data science,
          experimentation, and building things that ship.
        </p>
        <div className="flex gap-3">
          <Button
            variant="primary"
            size="sm"
            href="/writing"
            className="bg-gradient-to-b from-gold to-gold-hover text-primary border-gold/60"
          >
            Go to Writing
          </Button>
          <Button
            variant="ghost"
            size="sm"
            href="/assistant"
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            Ask Dan
          </Button>
        </div>
      </div>
    </section>
  );
}
