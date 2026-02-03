import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Articles and thoughts on AI, data science, and software development.",
};

export default function WritingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Writing
      </h1>
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        Articles and thoughts on AI, data science, and software development.
      </p>

      <div className="mt-12 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-16 text-center dark:border-gray-600">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Coming Soon
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          New articles are on the way. Check back soon.
        </p>
      </div>
    </div>
  );
}
