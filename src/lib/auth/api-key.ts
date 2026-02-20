import { createHash, timingSafeEqual } from "node:crypto";

export type ApiKeyAuthResult =
  | { authorized: true }
  | { authorized: false; error: string; status: 401 | 503 };

/**
 * Verifies the request contains a valid X-API-Key header matching GSD_API_KEY.
 * Uses SHA-256 hash normalization + constant-time comparison to prevent timing attacks.
 */
export function verifyApiKey(request: Request): ApiKeyAuthResult {
  const expectedKey = process.env.GSD_API_KEY;

  if (!expectedKey) {
    return {
      authorized: false,
      error: "GSD capture not configured.",
      status: 503,
    };
  }

  const providedKey = request.headers.get("X-API-Key");

  if (!providedKey) {
    return {
      authorized: false,
      error: "Missing X-API-Key header.",
      status: 401,
    };
  }

  // Hash both keys to normalize buffer lengths (timingSafeEqual throws on length mismatch)
  const providedHash = createHash("sha256").update(providedKey).digest();
  const expectedHash = createHash("sha256").update(expectedKey).digest();

  if (!timingSafeEqual(providedHash, expectedHash)) {
    return {
      authorized: false,
      error: "Invalid API key.",
      status: 401,
    };
  }

  return { authorized: true };
}

/**
 * Helper to create a JSON error response for unauthorized API key requests.
 */
export function apiKeyUnauthorizedResponse(
  result: Extract<ApiKeyAuthResult, { authorized: false }>,
) {
  return Response.json({ error: result.error }, { status: result.status });
}
