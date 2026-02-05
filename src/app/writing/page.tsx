import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Articles and thoughts on AI, data science, and software development.",
};

export default function WritingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-text-primary">
        Writing
      </h1>
      <p className="mt-4 text-text-secondary">
        Articles and thoughts on AI, data science, and software development.
      </p>

      <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-16 text-center">
        <h2 className="text-lg font-medium text-text-primary">
          Coming Soon
        </h2>
        <p className="mt-2 text-sm text-text-tertiary">
          New articles are on the way. Check back soon.
        </p>
      </div>
    </div>
  );
}
