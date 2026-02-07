# Infrastructure & SEO

System pages, SEO plumbing, and route handling for dan-weinbeck.com.

## Error Pages

### 404 — Not Found

**File:** `src/app/not-found.tsx`

Displays when a user visits a route that doesn't exist. Returns proper 404 HTTP status.

**Features:**
- Friendly messaging with navigation links
- Links to: Home, Projects, Building Blocks, Writing, Contact
- Uses site's design tokens and Button component
- `noindex` meta tag to prevent search indexing

**Trigger:** Visit any non-existent route (e.g., `/this-page-does-not-exist`)

### 500 — Server Error

**Files:**
- `src/app/error.tsx` — Handles errors within the root layout
- `src/app/global-error.tsx` — Handles errors in the root layout itself

**Features:**
- "Try Again" button to reset error boundary
- Links to Home and Contact
- Error logging placeholder (currently console.log)
- Error digest shown in development mode

**Error Logging:**

Both error boundaries log to console with this structure:

```javascript
{
  message: error.message,
  digest: error.digest,
  stack: error.stack,
  timestamp: new Date().toISOString(),
}
```

To integrate with an error reporting service (Sentry, LogRocket, etc.), replace the `console.error` call in the `useEffect` hook.

---

## SEO Files

### robots.txt

**File:** `src/app/robots.ts`

Generated at build time. Controls search engine crawling.

**Current rules:**
- Allow: `/` (all public pages)
- Disallow: `/control-center`, `/control-center/` (admin-only routes)
- Sitemap reference included

**Verify:** Visit `http://localhost:3000/robots.txt`

### sitemap.xml

**File:** `src/app/sitemap.ts`

Generated at build time. Lists all public pages for search engines.

**Included pages:**
- Static: `/`, `/about`, `/projects`, `/building-blocks`, `/writing`, `/assistant`, `/contact`
- Dynamic:
  - `/about/[slug]` — Accomplishment detail pages
  - `/building-blocks/[slug]` — Tutorial pages
  - `/projects/[slug]` — Project detail pages

**Excluded:**
- `/control-center` and all sub-routes (admin-only)

**Verify:** Visit `http://localhost:3000/sitemap.xml`

---

## Redirects

**File:** `next.config.ts` — `redirects()` function

### Current Redirects

| Source | Destination | Type |
|--------|-------------|------|
| `/tutorials` | `/building-blocks` | 301 (permanent) |
| `/tutorials/:slug` | `/building-blocks/:slug` | 301 (permanent) |

### Adding New Redirects

Edit `next.config.ts` and add to the `redirects()` return array:

```typescript
{
  source: "/old-path",
  destination: "/new-path",
  permanent: true, // 301 for permanent, false for 302 temporary
},
```

**For pattern matching:**

```typescript
{
  source: "/blog/:slug",
  destination: "/writing/:slug",
  permanent: true,
},
```

---

## Control Center Access

The `/control-center` route and all sub-routes are:

1. **Auth-gated:** Protected by `AdminGuard` component (checks `daniel.weinbeck@gmail.com`)
2. **Not indexed:** Disallowed in robots.txt
3. **Not in sitemap:** Excluded from sitemap.xml

**Files involved:**
- `src/app/control-center/layout.tsx` — Wraps with AdminGuard
- `src/components/admin/AdminGuard.tsx` — Auth check component

---

## Verification Checklist

Run locally with `npm run dev`, then verify:

| URL | Expected Result |
|-----|-----------------|
| `http://localhost:3000/this-does-not-exist` | 404 page with navigation links |
| `http://localhost:3000/robots.txt` | robots.txt with Disallow: /control-center |
| `http://localhost:3000/sitemap.xml` | XML sitemap with all public routes |
| `http://localhost:3000/tutorials` | Redirects to /building-blocks (301) |
| `http://localhost:3000/control-center` | Redirects to / if not signed in |

To test error pages in development, temporarily add to a page:

```typescript
throw new Error("Test error");
```

---

*Last updated: 2026-02-07*
