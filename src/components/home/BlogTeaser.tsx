import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function BlogTeaser() {
  return (
    <section className="py-16 motion-safe:animate-fade-in-up">
      <Card variant="featured">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-4">
          Writing
        </h2>
        <p className="text-gray-600 mb-6 max-w-lg">
          Coming soon -- thoughts on AI development, data science,
          experimentation, and building things that ship.
        </p>
        <div className="flex gap-3">
          <Button variant="primary" size="sm" href="/writing">
            Go to Writing
          </Button>
          <Button variant="ghost" size="sm" href="/assistant">
            Ask Dan
          </Button>
        </div>
      </Card>
    </section>
  );
}
