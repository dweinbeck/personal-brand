import { Octokit } from "@octokit/rest";
import { serverEnv } from "@/lib/env";
import type { RoutingOutput } from "../schemas";

/**
 * Create a GitHub issue from a routing result.
 * Returns the issue HTML URL.
 */
export async function routeToGitHub(routing: RoutingOutput): Promise<string> {
  const token = serverEnv().GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN not configured. Cannot create GitHub issues.",
    );
  }

  const repo = serverEnv().GSD_GITHUB_REPO;
  if (!repo) {
    throw new Error(
      "GSD_GITHUB_REPO not configured. Set to 'owner/repo' format.",
    );
  }

  const [owner, repoName] = repo.split("/");

  const octokit = new Octokit({ auth: token });

  // Build labels
  const labels: string[] = [`priority:${routing.priority}`];

  const bugKeywords = /\b(bug|fix|broken|error|crash|fail|500|404|issue)\b/i;
  if (bugKeywords.test(routing.title) || bugKeywords.test(routing.summary)) {
    labels.push("bug");
  } else {
    labels.push("enhancement");
  }

  labels.push("gsd-capture");

  const body = [
    routing.summary,
    "",
    "---",
    "*Auto-created by GSD Builder OS capture pipeline*",
    "",
    "| Field | Value |",
    "|-------|-------|",
    `| Priority | ${routing.priority} |`,
    `| Confidence | ${(routing.confidence * 100).toFixed(0)}% |`,
    `| Category | ${routing.category} |`,
  ].join("\n");

  const { data: issue } = await octokit.issues.create({
    owner,
    repo: repoName,
    title: routing.title,
    body,
    labels,
  });

  return issue.html_url;
}
