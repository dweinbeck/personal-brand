import { auth } from "@/lib/firebase";

export type UserAuthResult =
  | { authorized: true; uid: string; email: string }
  | { authorized: false; error: string; status: 401 };

/**
 * Verifies the request is from any authenticated Firebase user.
 * Expects Authorization header with Bearer token (Firebase ID token).
 */
export async function verifyUser(request: Request): Promise<UserAuthResult> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      authorized: false,
      error: "Missing or invalid Authorization header.",
      status: 401,
    };
  }

  const idToken = authHeader.slice(7);

  if (!auth) {
    return {
      authorized: false,
      error: "Firebase Admin SDK not initialized.",
      status: 401,
    };
  }

  try {
    const decoded = await auth.verifyIdToken(idToken);

    if (!decoded.email) {
      return {
        authorized: false,
        error: "Token missing email claim.",
        status: 401,
      };
    }

    return { authorized: true, uid: decoded.uid, email: decoded.email };
  } catch (err) {
    console.error(
      "verifyIdToken failed:",
      err instanceof Error ? err.message : err,
    );
    return {
      authorized: false,
      error: "Invalid or expired token.",
      status: 401,
    };
  }
}

export function unauthorizedResponse(
  result: Extract<UserAuthResult, { authorized: false }>,
) {
  return new Response(JSON.stringify({ error: result.error }), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
}
