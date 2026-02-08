import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { ADMIN_EMAIL } from "@/lib/constants";

export type AdminAuthResult =
  | { authorized: true; email: string }
  | { authorized: false; error: string; status: 401 | 403 };

/**
 * Verifies the request is from an authenticated admin user.
 * Expects Authorization header with Bearer token (Firebase ID token).
 */
export async function verifyAdmin(request: Request): Promise<AdminAuthResult> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      authorized: false,
      error: "Missing or invalid Authorization header.",
      status: 401,
    };
  }

  const idToken = authHeader.slice(7);

  if (getApps().length === 0) {
    return {
      authorized: false,
      error: "Firebase not configured.",
      status: 401,
    };
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);

    if (decodedToken.email !== ADMIN_EMAIL) {
      return {
        authorized: false,
        error: "Forbidden.",
        status: 403,
      };
    }

    return { authorized: true, email: decodedToken.email };
  } catch {
    return {
      authorized: false,
      error: "Invalid or expired token.",
      status: 401,
    };
  }
}

/**
 * Helper to create an error response for unauthorized requests.
 */
export function unauthorizedResponse(
  result: Extract<AdminAuthResult, { authorized: false }>,
) {
  return new Response(JSON.stringify({ error: result.error }), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
}
