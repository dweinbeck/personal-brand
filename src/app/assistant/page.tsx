import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Assistant",
  description:
    "An AI-powered assistant for exploring Dan's work and expertise.",
};

export default function AssistantPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        AI Assistant
      </h1>
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        An AI-powered assistant for exploring Dan's work and expertise.
      </p>

      <div className="mt-12 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-16 text-center dark:border-gray-600">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Coming Soon
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          An interactive AI assistant is in development. Stay tuned.
        </p>
      </div>
    </div>
  );
}
