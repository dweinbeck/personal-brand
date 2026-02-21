import type { BrandTaxonomy } from "./types";

/**
 * Extract a human-friendly display name from brand taxonomy data.
 * Fallback chain: company_name > site_name > cleaned hostname.
 */
export function getBrandDisplayName(
  identity: BrandTaxonomy["identity"],
  siteUrl: string,
): string {
  if (identity?.company_name) return identity.company_name;
  if (identity?.site_name) return identity.site_name;
  return formatHostname(siteUrl);
}

/**
 * Convert a URL to a clean display name.
 * - Strips protocol, www. prefix, and TLD
 * - Title-cases the result
 * - Handles edge cases: "3m.com" -> "3m", "transparent.partners" -> "Transparent Partners"
 */
function formatHostname(urlStr: string): string {
  try {
    const hostname = new URL(urlStr).hostname.replace(/^www\./, "");
    // Split on dots - domain could be "transparent.partners" (2 parts) or "3m.com" (2 parts)
    const parts = hostname.split(".");
    // Common TLDs to strip
    const commonTLDs = new Set([
      "com",
      "org",
      "net",
      "io",
      "co",
      "dev",
      "app",
      "ai",
    ]);
    // If last part is a common TLD, use only the name part(s) before it
    // If not (e.g., "partners"), keep all parts as they form the brand name
    let nameParts: string[];
    if (parts.length >= 2 && commonTLDs.has(parts[parts.length - 1])) {
      nameParts = parts.slice(0, -1);
    } else if (parts.length >= 3 && commonTLDs.has(parts[parts.length - 1])) {
      // e.g., "brand.co.uk" -> ["brand"]
      nameParts = parts.slice(0, -2);
    } else {
      // Non-standard TLD like "transparent.partners" -> use all parts
      nameParts = parts;
    }
    // Title-case each part: "transparent" -> "Transparent", but keep short names as-is
    return nameParts
      .map((p) => (p.length <= 3 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
      .join(" ");
  } catch {
    return urlStr;
  }
}
