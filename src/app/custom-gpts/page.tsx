import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { getCustomGpts } from "@/lib/custom-gpts";

export const metadata: Metadata = {
  title: "Custom GPTs",
  description:
    "Discover Dan's custom-built GPTs for code review, data storytelling, SQL generation, and career coaching.",
};

export default function CustomGptsPage() {
  const gpts = getCustomGpts();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-text-primary">Custom GPTs</h1>
      <p className="mt-2 text-text-secondary">
        Purpose-built GPTs for analytics, development, and career growth.
      </p>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        {gpts.map((gpt) => (
          <Card
            key={gpt.slug}
            variant="clickable"
            href={gpt.url}
            className="group"
          >
            <h3 className="text-lg font-bold text-text-primary group-hover:text-gold transition-colors duration-200">
              {gpt.name}
            </h3>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed line-clamp-3">
              {gpt.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {gpt.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 font-mono text-xs text-text-tertiary bg-[rgba(27,42,74,0.04)] rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            <span className="mt-5 inline-block text-sm font-medium text-gold group-hover:text-gold-hover transition-colors duration-200">
              Open GPT &rarr;
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
