import Link from "next/link";

export function BlogTeaser() {
  return (
    <section className="py-16 border-t border-gray-200 motion-safe:animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Writing</h2>
      <p className="text-gray-600 mb-6 max-w-lg">
        Coming soon -- thoughts on AI development, data science,
        experimentation, and building things that ship.
      </p>
      <div className="flex gap-4">
        <Link
          href="/writing"
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Go to Writing
        </Link>
        <Link
          href="/assistant"
          className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          Ask Dan
        </Link>
      </div>
    </section>
  );
}
