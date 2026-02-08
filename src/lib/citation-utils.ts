/**
 * Utilities for parsing FastAPI citation source strings into GitHub permalink URLs
 * and display-friendly file paths.
 *
 * Citation source format: `owner/repo/path@sha:start_line-end_line`
 * Example: `dweinbeck/chatbot-assistant/app/main.py@abc123:1-10`
 */

/**
 * Builds a full GitHub permalink URL from a citation source string.
 *
 * @param source - Citation source in format `owner/repo/path@sha:start_line-end_line`
 * @returns GitHub permalink URL, e.g. `https://github.com/owner/repo/blob/sha/path#L1-L10`
 *
 * @example
 * buildGitHubPermalink("dweinbeck/chatbot-assistant/app/main.py@abc123:1-10")
 * // => "https://github.com/dweinbeck/chatbot-assistant/blob/abc123/app/main.py#L1-L10"
 */
export function buildGitHubPermalink(source: string): string {
  const atIndex = source.indexOf("@");
  if (atIndex === -1) {
    return `https://github.com/${source}`;
  }

  const pathPortion = source.slice(0, atIndex);
  const afterAt = source.slice(atIndex + 1);

  const parts = pathPortion.split("/");
  if (parts.length < 3) {
    return `https://github.com/${source}`;
  }

  const owner = parts[0];
  const repo = parts[1];
  const filePath = parts.slice(2).join("/");

  const colonIndex = afterAt.indexOf(":");
  if (colonIndex === -1) {
    // Has sha but no line numbers
    const sha = afterAt;
    return `https://github.com/${owner}/${repo}/blob/${sha}/${filePath}`;
  }

  const sha = afterAt.slice(0, colonIndex);
  const lineRange = afterAt.slice(colonIndex + 1);
  const [startLine, endLine] = lineRange.split("-");

  const lineFragment =
    endLine && endLine !== startLine
      ? `#L${startLine}-L${endLine}`
      : `#L${startLine}`;

  return `https://github.com/${owner}/${repo}/blob/${sha}/${filePath}${lineFragment}`;
}

/**
 * Extracts a display-friendly file path from a citation source string.
 *
 * @param source - Citation source in format `owner/repo/path@sha:start_line-end_line`
 * @returns Display path like `path:start_line-end_line`
 *
 * @example
 * extractFilePath("dweinbeck/chatbot-assistant/app/main.py@abc123:1-10")
 * // => "app/main.py:1-10"
 */
export function extractFilePath(source: string): string {
  const atIndex = source.indexOf("@");
  if (atIndex === -1) {
    return source;
  }

  const pathPortion = source.slice(0, atIndex);
  const afterAt = source.slice(atIndex + 1);

  const parts = pathPortion.split("/");
  if (parts.length < 3) {
    return source;
  }

  const filePath = parts.slice(2).join("/");

  const colonIndex = afterAt.indexOf(":");
  if (colonIndex === -1) {
    return filePath;
  }

  const lineRange = afterAt.slice(colonIndex + 1);
  return `${filePath}:${lineRange}`;
}
