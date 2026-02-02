# Pitfalls Research: Next.js Portfolio on GCP Cloud Run

## 1. Cloud Run Cold Starts

**The problem:** Cloud Run scales to zero. First visitor after idle period gets a 3-10 second cold start — terrible for a portfolio where first impressions matter.

**Warning signs:** Slow initial page load after periods of no traffic.

**Prevention:**
- Use Next.js `output: 'standalone'` for minimal container (faster startup)
- Set Cloud Run minimum instances to 1 (costs ~$5/month but eliminates cold starts)
- Or: Use SSG for most pages so they're served as static files (no server rendering needed)
- Phase: Deployment phase

## 2. Next.js on Cloud Run — SSR vs SSG Mismatch

**The problem:** Next.js defaults to SSR, but Cloud Run charges per-request CPU time. If all pages are SSR, you're paying for server rendering on every visit to static content.

**Warning signs:** High Cloud Run costs, slow page loads for content that doesn't change.

**Prevention:**
- Use Static Generation (SSG) for Home, Projects, Writing, Assistant pages
- Use ISR (Incremental Static Regeneration) for GitHub data (revalidate every hour)
- Only use SSR for the contact form API route
- Phase: Project scaffold / deployment

## 3. GitHub API Rate Limits

**The problem:** Unauthenticated GitHub API requests are limited to 60/hour. If you fetch on every page load, you'll hit limits quickly.

**Warning signs:** 403 errors from GitHub API, empty project cards.

**Prevention:**
- Use ISR with `revalidate: 3600` (fetch once per hour, serve cached)
- Or: Fetch at build time only (SSG) and rebuild on schedule
- Add a personal access token for 5,000 requests/hour (if needed)
- Handle API errors gracefully — show cached/fallback data
- Phase: GitHub integration phase

## 4. Firebase Admin SDK Credential Exposure

**The problem:** Firebase Admin SDK uses service account credentials. If these leak to the client bundle, anyone can access your Firestore with admin privileges.

**Warning signs:** Service account JSON in client-side code, `NEXT_PUBLIC_` prefix on admin credentials.

**Prevention:**
- NEVER prefix admin credentials with `NEXT_PUBLIC_`
- Use Cloud Run environment variables or Secret Manager for credentials
- Only use `firebase-admin` in API routes and server components
- The client Firebase SDK (if used) only needs public config
- Phase: Contact form / deployment phase

## 5. Contact Form Spam

**The problem:** Public contact forms get hammered by bots. Without protection, Firestore fills with spam.

**Warning signs:** Hundreds of junk submissions, increased Firestore costs.

**Prevention:**
- Add honeypot field (hidden field that bots fill but humans don't)
- Rate limit the API endpoint (by IP, e.g., 5 submissions/hour)
- Consider reCAPTCHA v3 (invisible, score-based) as fallback
- Validate server-side (email format, message length limits)
- Phase: Contact form phase

## 6. Image Optimization Neglected

**The problem:** Unoptimized headshot/project images tank Lighthouse scores and mobile experience.

**Warning signs:** Lighthouse performance < 90, large image files in network tab.

**Prevention:**
- Use Next.js `<Image>` component for automatic optimization (WebP, sizing)
- Set explicit width/height to prevent layout shift
- Use `priority` prop for above-the-fold hero image
- Store original in Cloud Storage, let Next.js handle optimization
- Phase: Home page / hero phase

## 7. Missing SEO Fundamentals

**The problem:** Personal site doesn't rank for "Dan Weinbeck" or related terms because meta tags, structured data, and sitemap are missing.

**Warning signs:** Site doesn't appear in Google search results after weeks.

**Prevention:**
- Use Next.js Metadata API in each page's layout/page file
- Generate `sitemap.xml` and `robots.txt`
- Add JSON-LD structured data (Person schema)
- Set Open Graph tags for social sharing previews
- Phase: SEO/polish phase

## 8. Accessibility Afterthought

**The problem:** Adding accessibility retroactively is painful. Lighthouse a11y score drops below 90.

**Warning signs:** Missing alt text, poor color contrast, non-keyboard-navigable elements.

**Prevention:**
- Use semantic HTML from the start (`nav`, `main`, `article`, `section`)
- Ensure all interactive elements are keyboard-accessible
- Maintain color contrast ratio >= 4.5:1 (especially with light theme)
- Add `aria-labels` to icon-only buttons
- Test with keyboard navigation during development
- Phase: Every phase (bake in, don't bolt on)

## 9. Over-Engineering the Scaffold

**The problem:** Spending days on perfect project structure, design system, component library before any visible output exists.

**Warning signs:** Complex folder structures with no actual pages, abstract component wrappers.

**Prevention:**
- Start with pages, not abstractions
- Build the simplest working version of each page first
- Extract shared components only when duplication appears
- Phase: Phase 1 (scaffold should be minimal)

## 10. Docker Image Too Large

**The problem:** Default Next.js Docker builds include all of `node_modules`, resulting in 1GB+ images that are slow to deploy and expensive on Cloud Run.

**Warning signs:** Slow deployments, high container startup time.

**Prevention:**
- Use `output: 'standalone'` in `next.config.js`
- Multi-stage Dockerfile: build stage → production stage with only standalone output
- Target image size: ~100-150MB
- Phase: Deployment phase
