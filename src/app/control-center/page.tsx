import { RepoCard } from "@/components/admin/RepoCard";
import { fetchAllGitHubRepos } from "@/lib/github-admin";

export const dynamic = "force-dynamic";

export default async function ControlCenterPage() {
  const repos = await fetchAllGitHubRepos();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Control Center</h1>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Projects ({repos.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <RepoCard key={repo.name} {...repo} />
          ))}
        </div>
      </section>
    </div>
  );
}
