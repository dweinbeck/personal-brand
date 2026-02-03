# Phase 4: Contact - Research

**Researched:** 2026-02-02
**Domain:** Contact form, server-side validation, Firestore storage, clipboard API
**Confidence:** HIGH

## Summary

Phase 4 implements a contact page with a working form (name, email, message), server-side validation with spam protection, Firestore storage for submissions, click-to-copy email, and social links. The stack is well-established: a Server Action handles form submission with Zod validation, `useActionState` (React 19) manages form state in a client component, and `firebase-admin` writes to Firestore.

The prior decision says "SSR only for contact API route," which was about rendering strategy (SSG vs SSR), not the specific mechanism. Server Actions are the modern Next.js recommended approach for form mutations and run server-side, satisfying this requirement. They eliminate boilerplate compared to a Route Handler (no fetch call, no API route file, progressive enhancement built in).

The contact page itself is a server component. Only the form component and the click-to-copy email button need `"use client"` -- consistent with the project's pattern of minimizing client components.

**Primary recommendation:** Use a Server Action with Zod validation and `useActionState` for form handling, `firebase-admin` for Firestore writes, and a small client component for clipboard copy.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | 4.x (latest 4.3.5) | Schema validation for form data | TypeScript-first, standard in Next.js ecosystem, 6.5x faster than v3 |
| firebase-admin | 13.x (latest 13.6.0) | Firestore writes from server | Already decided in roadmap; modular v10+ API |
| React 19 `useActionState` | built-in | Form state management | Native React 19 hook, replaces useFormState |
| React DOM `useFormStatus` | built-in | Pending state for submit button | Native React 19, works with Server Actions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.x (already installed) | Conditional classes on form fields | Error state styling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server Action | Route Handler (POST /api/contact) | More boilerplate, no progressive enhancement, but prior architecture docs mention API route |
| Zod | Manual validation | Zod gives type inference, reusable schema, better error messages |
| react-hook-form | Native form + useActionState | RHF adds complexity; native approach is simpler for 3 fields |

**Installation:**
```bash
npm install zod firebase-admin
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── contact/
│       └── page.tsx              # Server component, imports ContactForm
├── components/
│   └── contact/
│       ├── ContactForm.tsx       # "use client" - form with useActionState
│       ├── CopyEmailButton.tsx   # "use client" - clipboard copy
│       └── SubmitButton.tsx      # "use client" - useFormStatus for pending
├── lib/
│   ├── actions/
│   │   └── contact.ts           # "use server" - Server Action
│   ├── firebase.ts              # firebase-admin singleton initialization
│   └── schemas/
│       └── contact.ts           # Zod schema (shared between action and client)
```

### Pattern 1: Server Action with Zod Validation
**What:** Server Action receives FormData, validates with Zod, writes to Firestore, returns state
**When to use:** All form submissions in this project
**Example:**
```typescript
// src/lib/actions/contact.ts
"use server";

import { contactSchema } from "@/lib/schemas/contact";
import { saveContactSubmission } from "@/lib/firebase";

export type ContactState = {
  errors?: {
    name?: string[];
    email?: string[];
    message?: string[];
  };
  message?: string;
  success?: boolean;
};

export async function submitContact(
  prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // 1. Honeypot check
  const honeypot = formData.get("company_website");
  if (honeypot) {
    // Silently "succeed" to not tip off bots
    return { success: true, message: "Thank you for your message!" };
  }

  // 2. Validate with Zod
  const validatedFields = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  // 3. Store in Firestore
  try {
    await saveContactSubmission(validatedFields.data);
    return { success: true, message: "Thank you for your message!" };
  } catch {
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
```

### Pattern 2: Form Component with useActionState
**What:** Client component wraps the form, manages state via useActionState
**When to use:** The contact form UI
**Example:**
```typescript
// src/components/contact/ContactForm.tsx
"use client";

import { useActionState } from "react";
import { submitContact } from "@/lib/actions/contact";
import type { ContactState } from "@/lib/actions/contact";
import { SubmitButton } from "./SubmitButton";

const initialState: ContactState = {};

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContact, initialState);

  if (state.success) {
    return (
      <div className="rounded-lg bg-green-50 p-6 text-green-800">
        <p className="font-medium">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Honeypot - hidden from users, visible to bots */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company_website">Company Website</label>
        <input
          type="text"
          id="company_website"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
        {state.errors?.name && (
          <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      {/* ... email and message fields follow same pattern */}

      {state.message && !state.success && (
        <p className="text-sm text-red-600" aria-live="polite">{state.message}</p>
      )}

      <SubmitButton />
    </form>
  );
}
```

### Pattern 3: Firebase Admin Singleton
**What:** Initialize firebase-admin once, export Firestore instance
**When to use:** Any server-side Firebase access
**Example:**
```typescript
// src/lib/firebase.ts
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

getFirebaseAdmin();

export const db = getFirestore();

export async function saveContactSubmission(data: {
  name: string;
  email: string;
  message: string;
}) {
  await db.collection("contact_submissions").add({
    ...data,
    createdAt: new Date().toISOString(),
  });
}
```

### Pattern 4: Click-to-Copy Email
**What:** Client component using navigator.clipboard.writeText with visual feedback
**When to use:** The email display on contact page
**Example:**
```typescript
// src/components/contact/CopyEmailButton.tsx
"use client";

import { useState } from "react";

export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing, the email is visible as text
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
      aria-label={copied ? "Email copied" : `Copy ${email} to clipboard`}
    >
      <span>{email}</span>
      <span className="text-sm text-gray-500">
        {copied ? "Copied!" : "Click to copy"}
      </span>
    </button>
  );
}
```

### Anti-Patterns to Avoid
- **Making the entire contact page a client component:** Only the form and copy button need `"use client"`. The page layout, heading, social links section stay as server components.
- **Using Route Handler when Server Action suffices:** Route Handlers add boilerplate (separate file, fetch call, JSON parsing) with no benefit for same-origin form submissions.
- **Client-side-only validation:** Always validate server-side with Zod. Client `required` attributes are UX sugar, not security.
- **Storing firebase-admin credentials in code:** Use environment variables exclusively.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom regex/if-else chains | Zod schema with `safeParse` | Type inference, reusable, standard error format |
| Form state management | Custom useState + fetch | `useActionState` from React 19 | Handles pending, errors, success automatically |
| Pending button state | Manual loading state | `useFormStatus` from react-dom | Automatically tracks form submission state |
| Firebase init boilerplate | Manual conditional init | `getApps().length` check pattern | Prevents duplicate initialization in dev/hot-reload |
| Clipboard copy | Custom DOM manipulation | `navigator.clipboard.writeText` | Modern, async, well-supported API |

**Key insight:** React 19 + Next.js Server Actions have eliminated most of the form handling boilerplate that used to justify heavy libraries like react-hook-form for simple forms.

## Common Pitfalls

### Pitfall 1: Firebase Admin Private Key Newlines
**What goes wrong:** `firebase-admin` throws credential errors in production because the private key has literal `\n` instead of actual newlines.
**Why it happens:** Environment variables in `.env` files and hosting platforms escape newlines differently.
**How to avoid:** Always apply `.replace(/\\n/g, "\n")` to `FIREBASE_PRIVATE_KEY` when reading from env.
**Warning signs:** "Error: Firebase app not initialized" or credential parsing errors in production logs.

### Pitfall 2: Honeypot Field Naming
**What goes wrong:** Bots detect and skip the honeypot because it has an obvious name like "honeypot" or "bot_trap."
**Why it happens:** Sophisticated bots check for common honeypot field names.
**How to avoid:** Name the field something plausible like "company_website" or "phone_number" -- fields a bot would want to fill but a human would not see.
**Warning signs:** Spam still getting through despite honeypot.

### Pitfall 3: useFormStatus in Wrong Component
**What goes wrong:** `useFormStatus` returns `{ pending: false }` always.
**Why it happens:** `useFormStatus` must be used in a child component of the `<form>`, not in the same component that renders the form.
**How to avoid:** Extract the submit button into a separate `SubmitButton` component that uses `useFormStatus` internally.
**Warning signs:** Submit button never shows loading state.

### Pitfall 4: Missing aria-hidden on Honeypot
**What goes wrong:** Screen readers announce the honeypot field to visually impaired users.
**Why it happens:** Using only `display: none` or CSS `hidden` without proper ARIA attributes.
**How to avoid:** Add `aria-hidden="true"` and `tabIndex={-1}` to the honeypot container. Use a wrapping `<div className="hidden" aria-hidden="true">`.
**Warning signs:** Accessibility audit flags hidden form fields.

### Pitfall 5: Firebase Admin in Client Bundle
**What goes wrong:** Build fails or credential leak when firebase-admin is imported in a client component.
**Why it happens:** `firebase-admin` is a Node.js-only package. If imported in a `"use client"` file, Next.js tries to bundle it for the browser.
**How to avoid:** Only import `firebase-admin` in Server Actions (`"use server"` files) or `src/lib/` files that are never imported by client components.
**Warning signs:** Build errors mentioning "Module not found: Can't resolve 'fs'" or similar Node.js built-in errors.

## Code Examples

### Zod Contact Schema
```typescript
// src/lib/schemas/contact.ts
import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message is too long"),
});

export type ContactFormData = z.infer<typeof contactSchema>;
```

### SubmitButton with useFormStatus
```typescript
// src/components/contact/SubmitButton.tsx
"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? "Sending..." : "Send Message"}
    </button>
  );
}
```

### Contact Page Layout (Server Component)
```typescript
// src/app/contact/page.tsx
import { ContactForm } from "@/components/contact/ContactForm";
import { CopyEmailButton } from "@/components/contact/CopyEmailButton";

const SOCIAL_LINKS = [
  { name: "LinkedIn", href: "https://linkedin.com/in/dweinbeck", label: "LinkedIn profile" },
  { name: "Instagram", href: "https://instagram.com/dweinbeck", label: "Instagram profile" },
  { name: "GitHub", href: "https://github.com/dweinbeck", label: "GitHub profile" },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold">Contact</h1>
      <p className="mt-4 text-gray-600">Get in touch -- I'd love to hear from you.</p>

      <div className="mt-12 grid gap-12 md:grid-cols-2">
        {/* Left: Contact Form */}
        <ContactForm />

        {/* Right: Direct Contact + Social Links */}
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold">Email</h2>
            <CopyEmailButton email="dan@example.com" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">Social</h2>
            <ul className="mt-3 space-y-2">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Environment Variables
```bash
# .env.local (not committed)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useFormState` (react-dom) | `useActionState` (react) | React 19 | Hook moved from react-dom to react package |
| API Route + fetch for forms | Server Actions + useActionState | Next.js 14+ | Less boilerplate, progressive enhancement |
| Zod v3 `z.string().email()` | Zod v4 `z.email()` top-level | Zod 4.0 | More tree-shakable, but method syntax still works |
| `initializeApp()` guard with `getApps()` | `initializeApp()` is now idempotent | firebase-admin 13.6.0 | Simpler init, but `getApps()` pattern still works |

**Deprecated/outdated:**
- `useFormState` from `react-dom`: renamed to `useActionState` in `react` package (React 19)
- `z.string().email()`: still works in Zod 4 but deprecated in favor of `z.email()`
- `document.execCommand('copy')`: deprecated, use `navigator.clipboard.writeText()`

## Open Questions

1. **Dan's actual email address**
   - What we know: Needs to be displayed on the contact page
   - What's unclear: The actual email to use
   - Recommendation: Use a placeholder in code, update before deployment

2. **Dan's social media usernames**
   - What we know: LinkedIn, Instagram, GitHub links needed
   - What's unclear: Exact profile URLs (GitHub is likely `dweinbeck` based on existing code)
   - Recommendation: Use `dweinbeck` as username for all three, adjust if different

3. **Rate limiting implementation**
   - What we know: Requirement CONT-02 specifies rate limiting
   - What's unclear: Whether to use in-memory rate limiting (simple but resets on deploy) or Firestore-based (persistent but adds reads)
   - Recommendation: Use simple in-memory Map-based rate limiting (IP + timestamp) since this is a personal site with low traffic. Reset on deploy is acceptable.

4. **Firebase project setup**
   - What we know: firebase-admin needs credentials in env vars
   - What's unclear: Whether the Firebase project already exists
   - Recommendation: Document the setup steps but don't block on it. Code works with env vars; if vars are missing, the form can gracefully degrade.

## Sources

### Primary (HIGH confidence)
- [Next.js Forms Guide](https://nextjs.org/docs/app/guides/forms) - useActionState pattern, Zod validation, Server Action structure
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) - Route handler API (for reference, not recommended here)
- [Next.js Updating Data](https://nextjs.org/docs/app/getting-started/updating-data) - Server Actions definition and usage
- [Firebase Admin Setup](https://firebase.google.com/docs/admin/setup) - Modular initialization, credential patterns
- [Firebase Add Data](https://firebase.google.com/docs/firestore/manage-data/add-data) - Firestore write patterns
- [React useActionState](https://react.dev/reference/react/useActionState) - Hook API and behavior

### Secondary (MEDIUM confidence)
- [Zod npm](https://www.npmjs.com/package/zod) - Version 4.3.5 confirmed current
- [firebase-admin npm](https://www.npmjs.com/package/firebase-admin) - Version 13.6.0 confirmed current
- [Server Actions vs Route Handlers](https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers) - Community consensus on when to use each
- [Clipboard API](https://web.dev/patterns/clipboard/copy-text) - Modern clipboard usage patterns

### Tertiary (LOW confidence)
- [Honeypot implementation](https://medium.com/@zainshahza/honey-potting-in-next-js-acfd80eb8010) - Naming best practices for honeypot fields
- [Building Secure Contact Forms](https://arnab-k.medium.com/building-secure-and-resilient-contact-forms-in-next-js-450cbb437e68) - Combined spam protection strategies

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified with official sources and npm
- Architecture: HIGH - Patterns verified with Next.js official docs and React 19 docs
- Pitfalls: HIGH - Firebase credential issues and useFormStatus placement are well-documented
- Spam protection: MEDIUM - Honeypot + rate limiting is standard but exact implementation varies

**Research date:** 2026-02-02
**Valid until:** 2026-03-04 (30 days - stable domain, mature libraries)
