import "@/lib/firebase"; // Ensure Firebase Admin SDK is initialized
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { ADMIN_EMAIL } from "@/lib/constants";

export type AdminAuthResult =
  | { authorized: true; email: string }
  | { authorized: false; error: string; status: 401 | 403 };

/**
 * Verifies a Firebase ID token belongs to the admin user.
 * Returns true if the token is valid and the email matches ADMIN_EMAIL.
 * Designed for Server Actions that receive a token directly (no Request object).
 */
export async function verifyAdminToken(idToken: string): Promise<boolean> {
  if (getApps().length === 0) return false;
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return decoded.email === ADMIN_EMAIL;
  } catch {
    return false;
  }
}

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
      error:
        "Firebase Admin SDK not initialized. Check server logs — FIREBASE_PRIVATE_KEY may be missing or invalid.",
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
