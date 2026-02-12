# Phase 33: Multi-User + Auth - Research

**Researched:** 2026-02-11
**Domain:** Firebase Authentication + Prisma multi-tenant data isolation in Next.js 16
**Confidence:** HIGH

## Summary

Phase 33 adds Firebase Authentication (Google Sign-In) to the todoist app and enforces per-user data isolation across all Prisma queries. The todoist app is a Next.js 16 + Prisma 6 + PostgreSQL task manager that currently has zero auth -- all data is globally visible. The personal-brand project (same Firebase project) already has a mature Firebase Auth implementation with `AuthContext`, `AuthGuard`, `firebase-client.ts`, and server-side token verification via `firebase-admin`. We will replicate those exact patterns.

The todoist app architecture poses a specific challenge: it uses **Server Components** (pages) that directly call Prisma service functions, and **Server Actions** that call the same services. Server Components can't access client-side Firebase state directly. The recommended approach is a **cookie-based session pattern**: after client-side Firebase sign-in, write the Firebase ID token to an httpOnly cookie; Server Components read and verify this cookie to extract the userId. Server Actions receive the ID token as an explicit parameter (matching the personal-brand `saveTutorial` pattern).

The schema migration adds `userId` to three models (Workspace, Tag, Task) that are queried directly, while Project and Section inherit scoping through their parent chain. All existing data gets backfilled to a single default user. The Tag model's unique constraint changes from `@unique` on `name` to `@@unique([userId, name])`.

**Primary recommendation:** Replicate the personal-brand Firebase Auth patterns exactly (AuthContext, firebase-client.ts, firebase-admin verification), add cookie-based session for Server Component auth, add userId to Workspace/Tag/Task models, and audit every service function for userId filtering.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `firebase` | ^12.8.0 | Client-side auth (Google Sign-In popup) | Same version as personal-brand, same Firebase project |
| `firebase-admin` | ^13.6.0 | Server-side token verification via `verifyIdToken()` | Same version as personal-brand, proven pattern |
| `@prisma/client` | ^6.19.2 | ORM with userId-scoped queries | Already in use |
| `prisma` | ^6.19.2 | Schema migrations and `db push` | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | ^4.3.6 | Schema validation (already present) | Validate auth inputs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cookie-based server component auth | `next-firebase-auth-edge` | Adds dependency; our cookie approach is simpler for this use case |
| Firebase session cookies (`createSessionCookie`) | Raw ID token in cookie | Session cookies last up to 2 weeks but add complexity; ID token + refresh is simpler for a single-user-at-a-time app |
| Middleware auth check | Server Component cookie read | Middleware adds redirect complexity; not needed since we use AuthGuard on client |

**Installation:**
```bash
cd /Users/dweinbeck/Documents/todoist
npm install firebase firebase-admin
```

## Architecture Patterns

### Recommended Project Structure (new files)
```
src/
├── context/
│   └── AuthContext.tsx          # Client-side auth state (copy from personal-brand)
├── components/
│   └── auth/
│       └── AuthGuard.tsx        # Sign-in gate component
├── lib/
│   ├── firebase-client.ts       # Client-side Firebase init (copy from personal-brand)
│   ├── firebase-admin.ts        # Server-side Firebase Admin init
│   └── auth.ts                  # verifyUser(), getUserIdFromCookie()
├── actions/                     # All actions gain userId parameter
├── services/                    # All services gain userId parameter
└── app/
    └── layout.tsx               # Wrap with AuthProvider
```

### Pattern 1: Cookie-Based Session for Server Components
**What:** After Firebase client-side sign-in, write the ID token to an httpOnly cookie. Server Components read this cookie and verify it with firebase-admin to get the userId.
**When to use:** Every Server Component page that needs to fetch user-scoped data.
**Why:** Server Components run on the server before any client JavaScript. They cannot access React context or client-side auth state. Cookies are the only mechanism to pass auth state to Server Components in Next.js.

```typescript
// src/lib/auth.ts
import "server-only";
import { cookies } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import "./firebase-admin"; // ensure initialized

export async function getUserIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("__session")?.value;
  if (!token) return null;

  try {
    const decoded = await getAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}
```

```typescript
// Client-side: set cookie on auth state change
// src/context/AuthContext.tsx (addition to personal-brand pattern)
useEffect(() => {
  const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (u) => {
    setUser(u);
    setLoading(false);
    if (u) {
      const token = await u.getIdToken();
      document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Lax`;
    } else {
      document.cookie = "__session=; path=/; max-age=0";
    }
  });
  return unsubscribe;
}, []);
```

### Pattern 2: Token-Passing for Server Actions
**What:** Client components get the ID token via `user.getIdToken()` and pass it as the first argument to server actions. Server actions verify with firebase-admin before proceeding.
**When to use:** Every server action that reads or writes user data.
**Why:** Server Actions are called from client components that have access to the AuthContext user object. Passing the token explicitly is the simplest and most secure pattern (matches personal-brand's `saveTutorial` pattern).

```typescript
// src/actions/workspace.ts
"use server";
import { verifyUser } from "@/lib/auth";

export async function createWorkspaceAction(idToken: string, formData: FormData) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  const parsed = createWorkspaceSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await createWorkspaceSvc(userId, parsed.data);
  revalidatePath("/tasks");
  return { success: true };
}
```

### Pattern 3: Service Layer userId Enforcement
**What:** Every service function accepts `userId` as its first parameter. All Prisma queries include `userId` in their `where` clause.
**When to use:** Every service function, no exceptions.
**Why:** This is the defense-in-depth layer. Even if a bug in the action layer passes the wrong userId, the service layer ensures queries are scoped.

```typescript
// src/services/workspace.service.ts
export async function getWorkspaces(userId: string) {
  return prisma.workspace.findMany({
    where: { userId },  // CRITICAL: always filter by userId
    include: { projects: { ... } },
    orderBy: { createdAt: "asc" },
  });
}
```

### Pattern 4: Ownership Verification for Entity Updates
**What:** For update/delete operations on entities that don't have a direct userId column (Project, Section), verify ownership by checking the parent entity.
**When to use:** All mutations on Project (check workspace.userId), Section (check project.workspace.userId).

```typescript
// src/services/project.service.ts
export async function deleteProject(userId: string, id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: { workspace: { select: { userId: true } } },
  });
  if (!project || project.workspace.userId !== userId) {
    throw new Error("Not found");
  }
  return prisma.project.delete({ where: { id } });
}
```

### Anti-Patterns to Avoid
- **Trusting client-provided userId:** NEVER accept userId from form data, URL params, or request body. Always derive from verified Firebase token.
- **Forgetting userId in new queries:** Every new Prisma query must include userId filter. Missing it creates a data leak.
- **Using `findUnique` without userId check:** `prisma.task.findUnique({ where: { id } })` returns any user's task. Always verify ownership after the query or include userId in a compound where.
- **Token in localStorage:** Never store Firebase tokens in localStorage. Use httpOnly cookies for server access, Firebase SDK handles client-side token management.
- **Skipping cookie refresh:** Firebase ID tokens expire after 1 hour. The `onAuthStateChanged` listener fires on token refresh, so the cookie update in Pattern 1 handles this. But if the token expires mid-session without a state change, server reads will fail. Include `onIdTokenChanged` instead of `onAuthStateChanged` to catch silent refreshes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token verification | Custom JWT parsing | `firebase-admin` `getAuth().verifyIdToken()` | Handles key rotation, expiry, revocation |
| Client auth state | Custom auth state manager | `onIdTokenChanged` + React context | Firebase SDK handles token refresh, persistence |
| Google Sign-In flow | Custom OAuth implementation | `signInWithPopup(auth, new GoogleAuthProvider())` | Handles all redirect/popup edge cases |
| Cookie security | Manual cookie encryption | httpOnly + SameSite=Lax + Secure (in production) | Standard web security best practices |
| Schema migrations | Raw SQL | Prisma migrate or `db push` | Tracks migration history, generates client types |

**Key insight:** Firebase Auth handles all the complexity of token lifecycle (issue, refresh, revoke, verify). The application layer just needs to: (1) trigger sign-in, (2) pass tokens to the server, and (3) call `verifyIdToken()`. Everything else is handled by the SDKs.

## Common Pitfalls

### Pitfall 1: Firebase ID Token Expiry in Cookies
**What goes wrong:** Firebase ID tokens expire after 1 hour. If the cookie isn't refreshed, Server Components get stale tokens and verification fails.
**Why it happens:** `onAuthStateChanged` only fires on sign-in/sign-out, not on silent token refreshes.
**How to avoid:** Use `onIdTokenChanged` instead, which fires every time the SDK refreshes the token (approximately every hour). Update the cookie in the callback.
**Warning signs:** Intermittent "unauthorized" errors after the app has been open for 60+ minutes.

### Pitfall 2: Missing userId on Direct Task Queries
**What goes wrong:** `getTasksForToday()`, `searchTasks()`, and `getCompletedTasks()` query the Task table directly (not through Workspace). Without userId on the Task model, these queries can't be scoped without an expensive join.
**Why it happens:** Developers assume workspace ownership cascades to all child entities in queries.
**How to avoid:** Add `userId` column to the Task model (denormalized for query efficiency). Set it during task creation from the verified token.
**Warning signs:** Task queries require multi-table joins to reach Workspace.userId.

### Pitfall 3: Tag Uniqueness Constraint Change
**What goes wrong:** The current schema has `Tag.name @unique` globally. With multi-user, two users can't have tags with the same name.
**Why it happens:** The original schema was single-user.
**How to avoid:** Change to `@@unique([userId, name])` on the Tag model. This allows different users to have tags with the same name.
**Warning signs:** "Unique constraint violation" errors when a second user creates a tag.

### Pitfall 4: Missing userId in Backfill
**What goes wrong:** Adding a required `userId` column fails because existing rows have no value.
**Why it happens:** Prisma can't add a NOT NULL column to a table with existing data without a default.
**How to avoid:** Expand-and-contract pattern: (1) Add column as nullable, (2) backfill existing data with a default userId, (3) make column required. Since we use `db push` (not migrations), do this in two pushes with a script in between.
**Warning signs:** `db push` fails with "cannot add NOT NULL column with no default".

### Pitfall 5: Server Actions Signature Change Breaking Client Components
**What goes wrong:** Every server action now takes `idToken` as first parameter. Every client component that calls a server action needs to be updated to pass the token.
**Why it happens:** The original actions took only form data or simple arguments.
**How to avoid:** Plan a systematic audit. Use TypeScript -- the compiler will flag every call site where the signature changed.
**Warning signs:** Runtime errors from missing first argument, or auth failures from passing form data as the token.

### Pitfall 6: Firebase Admin SDK Initialization on Serverless
**What goes wrong:** Multiple Firebase Admin SDK initialization attempts throw "app already exists" errors.
**Why it happens:** Serverless environments may reuse execution contexts.
**How to avoid:** Use the `getApps().length > 0 ? getApps()[0] : initializeApp(...)` pattern (same as personal-brand).
**Warning signs:** "Firebase app named '[DEFAULT]' already exists" errors.

## Code Examples

### Firebase Client Setup (copy from personal-brand)
```typescript
// src/lib/firebase-client.ts
import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";

function getFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!apiKey || !authDomain || !projectId) {
    throw new Error(
      "Firebase config missing. Set NEXT_PUBLIC_FIREBASE_API_KEY, " +
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID."
    );
  }
  return { apiKey, authDomain, projectId };
}

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;

function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length ? getApp() : initializeApp(getFirebaseConfig());
  }
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
}
```

### Firebase Admin Setup
```typescript
// src/lib/firebase-admin.ts
import { applicationDefault, cert, getApps, initializeApp, type Credential } from "firebase-admin/app";

function getCredential(): Credential | undefined {
  if (process.env.K_SERVICE) return applicationDefault();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    try {
      return cert({ projectId, clientEmail, privateKey });
    } catch {
      return undefined;
    }
  }
  return undefined;
}

const credential = getCredential();
if (getApps().length === 0 && credential) {
  initializeApp({ credential });
}
```

### Auth Verification (Server-Side)
```typescript
// src/lib/auth.ts
import "server-only";
import { cookies } from "next/headers";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import "./firebase-admin";

/** Verify ID token string, return userId or null */
export async function verifyUser(idToken: string): Promise<string | null> {
  if (getApps().length === 0) return null;
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    return null;
  }
}

/** Read userId from session cookie (for Server Components) */
export async function getUserIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("__session")?.value;
  if (!token) return null;
  return verifyUser(token);
}
```

### AuthContext with Cookie Sync
```typescript
// src/context/AuthContext.tsx
"use client";
import { onIdTokenChanged, type User } from "firebase/auth";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase-client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(getFirebaseAuth(), async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        const token = await u.getIdToken();
        document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Lax`;
      } else {
        document.cookie = "__session=; path=/; max-age=0";
      }
    });
    return unsubscribe;
  }, []);

  return <AuthContext value={{ user, loading }}>{children}</AuthContext>;
}

export function useAuth() {
  return useContext(AuthContext);
}
```

### Schema Changes (Prisma)
```prisma
model Workspace {
  id        String    @id @default(cuid())
  userId    String
  name      String
  projects  Project[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([userId])
}

model Task {
  id           String    @id @default(cuid())
  userId       String
  projectId    String
  // ... rest unchanged

  @@index([userId, status])
  @@index([userId, deadlineAt])
}

model Tag {
  id    String    @id @default(cuid())
  userId String
  name  String
  color String?
  tasks TaskTag[]

  @@unique([userId, name])
  @@index([userId])
}
```

### Server Component Page with Auth
```typescript
// src/app/tasks/page.tsx
import { redirect } from "next/navigation";
import { getUserIdFromCookie } from "@/lib/auth";
import { getWorkspaces } from "@/services/workspace.service";

export default async function TasksPage() {
  const userId = await getUserIdFromCookie();
  if (!userId) redirect("/"); // AuthGuard handles sign-in on client

  const workspaces = await getWorkspaces(userId);
  // ... render
}
```

### Server Action with Auth
```typescript
// src/actions/workspace.ts
"use server";
import { revalidatePath } from "next/cache";
import { verifyUser } from "@/lib/auth";
import { createWorkspaceSchema } from "@/lib/schemas/workspace";
import { createWorkspace as createWorkspaceSvc } from "@/services/workspace.service";

export async function createWorkspaceAction(idToken: string, formData: FormData) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  const parsed = createWorkspaceSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await createWorkspaceSvc(userId, parsed.data);
  revalidatePath("/tasks");
  return { success: true };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `onAuthStateChanged` | `onIdTokenChanged` | Firebase JS SDK 9+ | Catches silent token refreshes, critical for cookie sync |
| API routes for all mutations | Server Actions | Next.js 14+ | Simpler code, but requires explicit token passing |
| Prisma Migrate | `prisma db push` (this project) | N/A | No migration history, but simpler for dev; can use `db push` in two steps for expand/contract |
| `firebase-admin` v12 | v13.6.x | 2024 | Same `verifyIdToken()` API, modular imports |

**Deprecated/outdated:**
- `onAuthStateChanged` for cookie sync: Does not fire on silent token refreshes. Use `onIdTokenChanged` instead.
- `toDataStreamResponse()`: Vercel AI SDK v5+ uses `toUIMessageStreamResponse()` (not relevant to this phase but noted in project memory).

## Open Questions

1. **Cookie security in development vs production**
   - What we know: In production (HTTPS), cookies should be `Secure; HttpOnly; SameSite=Lax`. In development (HTTP), `Secure` flag prevents cookie transmission.
   - What's unclear: Whether to set `Secure` conditionally or omit it entirely for simplicity.
   - Recommendation: Set `Secure` only when `location.protocol === 'https:'`. The cookie is not httpOnly (client JS needs to write it), but it contains a Firebase ID token that's verified server-side, so the risk is limited.

2. **Backfill strategy for existing data**
   - What we know: Existing data has no userId. Need to assign it to a default user.
   - What's unclear: Whether the developer will be the only user initially, and what their Firebase UID is.
   - Recommendation: Create a backfill script that prompts for a Firebase UID (or reads from env) and updates all rows. Run between the two `db push` steps.

3. **Should Project and Section also get userId columns?**
   - What we know: Project and Section are always accessed through Workspace. Direct userId on them would be denormalized but would simplify ownership checks.
   - What's unclear: Whether the extra denormalization is worth it.
   - Recommendation: Do NOT add userId to Project/Section. Verify ownership through the parent chain. This keeps the schema normalized and avoids sync bugs. Task and Tag get userId because they are queried directly without going through Workspace.

## Sources

### Primary (HIGH confidence)
- Personal-brand codebase: `src/lib/firebase-client.ts`, `src/lib/firebase.ts`, `src/lib/auth/user.ts`, `src/lib/auth/admin.ts`, `src/context/AuthContext.tsx`, `src/components/auth/AuthGuard.tsx` -- verified working Firebase Auth implementation
- Personal-brand `src/lib/actions/content.ts` -- verified pattern for passing idToken to server actions
- Todoist codebase: Full schema, services, actions, pages audited in this research

### Secondary (MEDIUM confidence)
- [Firebase: Verify ID Tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens) -- official docs for `verifyIdToken()` API
- [Firebase: Google Sign-In for Web](https://firebase.google.com/docs/auth/web/google-signin) -- official docs for `signInWithPopup`
- [firebase-admin npm](https://www.npmjs.com/package/firebase-admin) -- v13.6.1 confirmed
- [Prisma: Expand and Contract Pattern](https://www.prisma.io/dataguide/types/relational/expand-and-contract-pattern) -- official guide for adding columns with backfill
- [Prisma: Customizing Migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations) -- official migration workflow docs
- [Next.js Firebase Auth](https://colinhacks.com/essays/nextjs-firebase-authentication) -- cookie-based pattern reference

### Tertiary (LOW confidence)
- None -- all findings verified against primary or official sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- using same libraries as proven personal-brand implementation
- Architecture: HIGH -- patterns directly copied from working personal-brand codebase, adapted for Server Components
- Pitfalls: HIGH -- derived from direct codebase audit identifying all query paths and their scoping needs
- Schema migration: HIGH -- Prisma expand/contract is well-documented official pattern

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (stable domain, Firebase/Prisma APIs unlikely to change)

---

## Appendix: Complete Query Audit

Every Prisma query in the codebase and its required auth modification:

### workspace.service.ts
| Function | Current Query | Auth Change |
|----------|--------------|-------------|
| `getWorkspaces()` | `findMany()` (no filter) | Add `where: { userId }` |
| `getWorkspace(id)` | `findUnique({ where: { id } })` | Add `where: { id, userId }` |
| `createWorkspace(input)` | `create({ data: { name } })` | Add `data: { userId, name }` |
| `updateWorkspace(input)` | `update({ where: { id } })` | Add `where: { id, userId }` |
| `deleteWorkspace(id)` | `delete({ where: { id } })` | Add `where: { id, userId }` |

### project.service.ts
| Function | Current Query | Auth Change |
|----------|--------------|-------------|
| `getAllProjects()` | `findMany()` (no filter) | Join through workspace: `where: { workspace: { userId } }` |
| `getProject(id)` | `findUnique({ where: { id } })` | Verify ownership: check `workspace.userId === userId` |
| `createProject(input)` | `create({ data: { workspaceId, name } })` | Verify workspace ownership first |
| `updateProject(input)` | `update({ where: { id } })` | Verify ownership through workspace |
| `deleteProject(id)` | `delete({ where: { id } })` | Verify ownership through workspace |

### section.service.ts
| Function | Current Query | Auth Change |
|----------|--------------|-------------|
| `createSection(input)` | Uses `projectId` | Verify project ownership through workspace |
| `updateSection(input)` | `update({ where: { id } })` | Verify ownership through project->workspace |
| `deleteSection(id)` | `delete({ where: { id } })` | Verify ownership through project->workspace |
| `reorderSection(input)` | `update({ where: { id } })` | Verify ownership through project->workspace |

### task.service.ts
| Function | Current Query | Auth Change |
|----------|--------------|-------------|
| `createTask(input)` | Uses `projectId` | Add `userId` to data, verify project ownership |
| `updateTask(input)` | `update({ where: { id } })` | Add `where: { id, userId }` |
| `deleteTask(id)` | `delete({ where: { id } })` | Add `where: { id, userId }` |
| `toggleTaskStatus(id)` | `findUnique + update` | Add `userId` to both queries |
| `assignTaskToSection(taskId, sectionId)` | `update({ where: { id } })` | Add `userId`, verify section ownership |
| `reorderTask(input)` | `update({ where: { id } })` | Add `where: { id, userId }` |
| `getTasksForToday()` | `findMany({ where: { deadlineAt, status } })` | Add `userId` to where |
| `getCompletedTasks(projectId?)` | `findMany({ where: { status } })` | Add `userId` to where |
| `searchTasks(query)` | `findMany({ where: { OR: [...] } })` | Add `userId` to where |

### tag.service.ts
| Function | Current Query | Auth Change |
|----------|--------------|-------------|
| `getTags()` | `findMany()` (no filter) | Add `where: { userId }` |
| `createTag(input)` | `create({ data: { name, color } })` | Add `userId` to data |
| `updateTag(input)` | `update({ where: { id } })` | Add `where: { id, userId }` |
| `deleteTag(id)` | `delete({ where: { id } })` | Add `where: { id, userId }` |
| `getTasksByTag(tagId)` | `findMany({ where: { tags: { some: { tagId } } } })` | Add `userId` to where, verify tag ownership |

### Server Component Pages (data fetching)
| Page | Service Calls | Auth Change |
|------|--------------|-------------|
| `tasks/layout.tsx` | `getWorkspaces()`, `getTags()` | Pass userId from cookie |
| `tasks/page.tsx` | `getWorkspaces()` | Pass userId from cookie |
| `tasks/[projectId]/page.tsx` | `getProject(id)`, `getTags()` | Pass userId from cookie, verify ownership |
| `tasks/today/page.tsx` | `getTasksForToday()`, `getTags()` | Pass userId from cookie |
| `tasks/completed/page.tsx` | `getCompletedTasks()`, `getAllProjects()` | Pass userId from cookie |
| `tasks/search/page.tsx` | `searchTasks()`, `getTags()` | Pass userId from cookie |
| `tasks/tags/page.tsx` | `getTags()` | Pass userId from cookie |
| `tasks/tags/[tagId]/page.tsx` | `getTasksByTag()`, `getTags()` | Pass userId from cookie |
