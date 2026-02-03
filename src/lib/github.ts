import type { Project } from "@/types/project";

const GITHUB_API_URL =
  "https://api.github.com/users/dweinbeck/repos?per_page=100&sort=pushed&direction=desc";

interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  homepage: string | null;
  fork: boolean;
  topics: string[];
}

export async function fetchGitHubProjects(): Promise<Project[]> {
  const res = await fetch(GITHUB_API_URL, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    console.error(`GitHub API error: ${res.status}`);
    return [];
  }

  const repos: GitHubRepo[] = await res.json();

  return repos
    .filter((repo) => !repo.fork)
    .map((repo) => ({
      name: repo.name,
      description: repo.description ?? "No description provided",
      homepage: repo.homepage?.trim() || null,
      language: repo.language,
      stars: repo.stargazers_count,
      topics: repo.topics ?? [],
      url: repo.html_url,
    }));
}
