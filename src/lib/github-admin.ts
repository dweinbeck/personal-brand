interface GitHubRepoAdmin {
  name: string;
  html_url: string;
  private: boolean;
  pushed_at: string;
  description: string | null;
}

interface AdminRepo {
  name: string;
  url: string;
  isPrivate: boolean;
  lastCommit: string;
  purpose: string;
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function githubFetch(url: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }
  return fetch(url, { headers, next: { revalidate: 3600 } });
}

function extractPurpose(readmeContent: string): string {
  const lines = readmeContent.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines, headings, badges, and HTML tags
    if (
      !trimmed ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("![") ||
      trimmed.startsWith("<") ||
      trimmed.startsWith("[!")
    ) {
      continue;
    }
    // Return first meaningful paragraph, truncated
    return trimmed.length > 150 ? `${trimmed.slice(0, 147)}...` : trimmed;
  }
  return "No description available";
}

async function fetchReadmePurpose(repoName: string): Promise<string> {
  try {
    const res = await githubFetch(
      `https://api.github.com/repos/dweinbeck/${repoName}/readme`,
    );
    if (!res.ok) return "No README found";
    const data = await res.json();
    const content = atob(data.content);
    return extractPurpose(content);
  } catch {
    return "Unable to fetch README";
  }
}

export async function fetchAllGitHubRepos(): Promise<AdminRepo[]> {
  const repos: GitHubRepoAdmin[] = [];
  let page = 1;

  while (true) {
    const res = await githubFetch(
      `https://api.github.com/user/repos?per_page=100&sort=pushed&direction=desc&page=${page}`,
    );
    if (!res.ok) {
      console.error(`GitHub API error: ${res.status}`);
      break;
    }
    const batch: GitHubRepoAdmin[] = await res.json();
    if (batch.length === 0) break;
    repos.push(...batch);
    if (batch.length < 100) break;
    page++;
  }

  const results = await Promise.all(
    repos.map(async (repo) => ({
      name: repo.name,
      url: repo.html_url,
      isPrivate: repo.private,
      lastCommit: repo.pushed_at,
      purpose: repo.description ?? (await fetchReadmePurpose(repo.name)),
    })),
  );

  return results;
}
