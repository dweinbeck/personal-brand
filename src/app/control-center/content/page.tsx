import Link from "next/link";
import { getAllTutorials } from "@/lib/tutorials";

export default async function ContentPage() {
  const tutorials = await getAllTutorials();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Building Blocks</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your Building Blocks tutorials. {tutorials.length}{" "}
            tutorial(s) published.
          </p>
        </div>
        <Link
          href="/control-center/content/new"
          className="inline-flex items-center rounded-lg bg-gold px-4 py-2 text-sm font-medium text-navy-dark hover:bg-gold/90 transition-colors"
        >
          + New Tutorial
        </Link>
      </div>

      {tutorials.length === 0 ? (
        <div className="rounded-lg bg-gray-50 px-6 py-12 text-center text-sm text-gray-500">
          No tutorials found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tutorials.map((tutorial) => (
                <tr key={tutorial.slug} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {tutorial.metadata.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                    {tutorial.slug}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {tutorial.metadata.publishedAt}
                  </td>
                  <td className="px-4 py-3">
                    {tutorial.metadata.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 mr-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
