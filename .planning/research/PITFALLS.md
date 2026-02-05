# Domain Pitfalls: v1.1 Feature Additions

**Domain:** Adding enhanced pages and branding assets to an existing Next.js personal site
**Researched:** 2026-02-04
**Confidence:** HIGH (based on direct codebase analysis + known Next.js patterns)

---

## Critical Pitfalls

Mistakes that cause broken pages, regressions, or require rework.

### Pitfall 1: Dual Project Data Sources Drifting Apart

**What goes wrong:** The projects page currently uses hardcoded `PlaceholderProject[]` data (in both `FeaturedProjects.tsx` and `projects/page.tsx`), while `fetchGitHubProjects()` in `src/lib/github.ts` returns a completely different `Project` type. Enhancing the projects page to use GitHub API data means two data models must be reconciled -- `PlaceholderProject` (name, description, tags, status) vs `Project` (name, description, language, stars, url, homepage, topics). If both sources continue to exist, the homepage featured projects and the projects page will show inconsistent information.

**Why it happens:** The v1.0 hardcoded data was a shortcut. The GitHub API fetch exists but is unused by the current projects page. It is easy to enhance the projects page with API data while forgetting to update the homepage `FeaturedProjects` component, or vice versa.

**Consequences:** Homepage shows stale hardcoded data while /projects shows live GitHub data. Users see different project names, descriptions, and counts on different pages.

**Warning signs:**
- Two different project type interfaces coexisting (`PlaceholderProject` vs `Project`)
- Homepage and /projects showing different project counts or names
- Hardcoded project data that is never updated

**Prevention:**
- Decide upfront: single source of truth. Either GitHub API feeds both pages (with curated filtering/ordering), or a single config file maps project metadata that augments API data.
- Unify the type: create one `ProjectDisplay` type that both the homepage teaser and the full projects page consume.
- The homepage `FeaturedProjects` should select from the same data source as /projects, not maintain its own array.

**Phase:** Projects page phase. Must be resolved before shipping.

---

### Pitfall 2: GitHub API Data Gaps for Enhanced Cards

**What goes wrong:** The requirements call for enhanced project cards with: one-paragraph description, topic/platform tags, date initiated, last commit date, and public/private designation. The current `fetchGitHubProjects()` only fetches `name`, `description`, `language`, `stargazers_count`, `html_url`, `homepage`, `fork`, and `topics`. Missing fields include: `created_at`, `pushed_at` (or `updated_at`), and `visibility`. Attempting to display "Date initiated - Last commit" without fetching these fields produces empty UI.

**Why it happens:** The original API call was designed for v1.0's minimal cards. Developers forget to update the fetch function and type definition when the card requirements expand.

**Consequences:** Empty date fields, missing visibility badges, or runtime errors from accessing undefined properties.

**Warning signs:**
- Card mockups showing data that is not in the `GitHubRepo` interface
- TypeScript not catching the issue because fields are optional/nullable

**Prevention:**
- Before building the UI, audit the GitHub repos API response fields against every piece of data the enhanced card needs.
- Add `created_at`, `pushed_at`, and `visibility` to the `GitHubRepo` interface and map them to the `Project` type.
- The GitHub `/users/:user/repos` endpoint already returns these fields -- they just need to be extracted.
- Note: `description` from GitHub is often one line, not a paragraph. For projects needing richer descriptions, plan a local metadata override mechanism.

**Phase:** Projects page phase. Resolve during data layer work before UI.

---

### Pitfall 3: Contact Redesign Breaking Existing Server Action

**What goes wrong:** The contact page redesign adds new UI sections (hero, CTAs, form states, privacy disclosure) around the existing `ContactForm` component. The `ContactForm` uses `useActionState` tied to the `submitContact` server action. Restructuring the page layout can accidentally:
1. Move the form into a different component boundary that breaks the server action binding.
2. Duplicate the form across mobile/desktop layouts, creating double-submission risk.
3. Lose the honeypot field if the form is rebuilt from scratch rather than enhanced.

**Why it happens:** Redesigns often involve rewriting JSX from scratch to match a new layout. The existing anti-spam protections (honeypot, rate limiting) are easy to drop when rebuilding.

**Consequences:** Form submissions silently fail, spam protection disappears, or rate limiting breaks.

**Warning signs:**
- Contact form rebuilt from scratch instead of wrapped/enhanced
- Honeypot field missing from new form markup
- Server action not imported or not connected to new form

**Prevention:**
- Treat `ContactForm.tsx` and `submitContact` server action as the core -- wrap them in new layout, do not rewrite them.
- Add the new features (mailto button, copy email, LinkedIn link, privacy note, JS fallback) as sibling components around the existing form.
- Test the full form submission flow after every layout change.
- Verify honeypot field is present in the rendered HTML.

**Phase:** Contact redesign phase. Test submission immediately after layout changes.

---

### Pitfall 4: OG Image Not Propagating After Replacement

**What goes wrong:** The current OG image is at `src/app/opengraph-image.png` (Next.js file-based metadata convention). Replacing this file with a new image seems simple, but:
1. Social platforms aggressively cache OG images. LinkedIn, Twitter/X, and Facebook will show the old image for days/weeks after replacement.
2. If the new image has different dimensions than 1200x630, social cards will crop badly.
3. The `layout.tsx` metadata explicitly references `/opengraph-image.png` with hardcoded width/height (1200x630). If the new file is placed elsewhere or named differently, the metadata and the file-based convention will conflict.

**Why it happens:** Developers verify OG images by viewing their own site, not by testing with social platform debuggers. Cache invalidation is invisible.

**Consequences:** Sharing the site on LinkedIn/Twitter shows the old placeholder image for weeks. New image looks cropped or distorted on some platforms.

**Warning signs:**
- OG image replaced but not tested with platform debugging tools
- New image not exactly 1200x630 pixels
- File renamed or moved from the `src/app/` convention path

**Prevention:**
- Keep the file at `src/app/opengraph-image.png` (same name, same location) so both the file convention and the explicit metadata in `layout.tsx` resolve correctly.
- New image MUST be exactly 1200x630px.
- After deploying, immediately test with:
  - https://cards-dev.twitter.com/validator (or the X equivalent)
  - https://developers.facebook.com/tools/debug/
  - https://www.linkedin.com/post-inspector/
- These tools also force a cache refresh on the respective platforms.
- Consider adding a cache-busting query parameter to the OG URL during the transition period (remove it once caches are refreshed).

**Phase:** Branding assets phase. Must validate with external tools post-deploy, not just visually.

---

## Moderate Pitfalls

Mistakes that cause delays, visual bugs, or technical debt.

### Pitfall 5: Favicon Missing Multiple Required Formats

**What goes wrong:** Dropping a single `favicon.ico` into `src/app/` works for browser tabs, but modern devices need multiple icon formats: Apple Touch Icon (180x180 PNG), Android Chrome icons (192x192, 512x512), and a `manifest.json`/`site.webmanifest` referencing them. A single `.ico` file results in blurry or missing icons on mobile home screens, PWA installs, and some browsers.

**Why it happens:** The existing site has `src/app/favicon.ico` and nothing else. Developers replace it and think they are done.

**Consequences:** Blurry favicon on high-DPI screens, missing icon when someone adds the site to their phone home screen, generic icon in bookmark managers.

**Warning signs:**
- Only a single `.ico` file in the app directory
- No `apple-icon.png` or `icon.png` in `src/app/`
- No web manifest file

**Prevention:**
- Generate a full icon set from the source design: `favicon.ico` (multi-size), `icon.png` (32x32), `apple-icon.png` (180x180).
- Next.js file-based metadata convention: place `icon.png` and `apple-icon.png` in `src/app/` and they are automatically picked up.
- Optionally add `manifest.ts` or `manifest.json` for PWA-grade icon support.
- Test with Chrome DevTools > Application > Manifest panel.

**Phase:** Branding assets phase.

---

### Pitfall 6: Writing Page Without Content Strategy

**What goes wrong:** Building the writing page with article cards but having no articles ready. The page ships as a styled "Coming Soon" (same as current) or with placeholder content that looks unprofessional. Worse: building a full MDX blog infrastructure for zero articles is wasted effort.

**Why it happens:** The writing page is in the requirements, so it gets built. But the actual blog content pipeline (where articles live, how they are authored, frontmatter schema) is not planned.

**Consequences:** Shipping a beautiful empty page that adds no value. Or: building MDX infrastructure that gets reworked when actual content needs differ from assumptions.

**Warning signs:**
- Writing page in the sprint but no articles drafted or planned
- Blog card component built without knowing what metadata articles will have
- MDX already configured (it is -- `@next/mdx` is in the stack) but no content directory structure

**Prevention:**
- The site already has MDX configured and a `building-blocks` content section with tutorials. Use that same pattern for writing/articles.
- Define the frontmatter schema first (title, publishDate, tags, excerpt) before building cards.
- Ship the writing page with at least one real article, even if short. A styled empty state is acceptable only if there is a concrete timeline for first content.
- Card component should match the defined frontmatter schema, not be designed speculatively.

**Phase:** Writing page phase. Define content schema before building UI.

---

### Pitfall 7: Copy Email Button Without Fallback and Analytics Gap

**What goes wrong:** The existing `CopyEmailButton` uses `navigator.clipboard.writeText()`, which:
1. Requires HTTPS (works on Cloud Run, but not localhost without flags in some browsers).
2. Can fail silently -- the current catch block swallows errors with no user feedback.
3. The requirements call for analytics events on copy/click, but the current component has none.

Adding a `mailto:` button alongside is straightforward, but forgetting the analytics instrumentation means the success metrics (email clicks + copy events) cannot be measured.

**Why it happens:** The existing component "works" so developers add the mailto button and move on, forgetting the analytics requirements.

**Consequences:** Cannot measure whether the contact redesign is effective. Copy failures on older browsers go unnoticed.

**Warning signs:**
- Contact redesign shipped without analytics event calls
- CopyEmailButton error handling unchanged from v1.0
- No analytics library or event tracking in the codebase

**Prevention:**
- Decide on an analytics approach before building the contact redesign (lightweight options: Plausible, Umami, or simple custom event logging to Firestore).
- Add event tracking to: mailto click, email copy, form start, form submit, form error.
- Improve copy fallback: on failure, show a toast with the email address as selectable text.
- The `mailto:` link works with JS disabled, satisfying the JS-fallback requirement.

**Phase:** Contact redesign phase. Analytics decision must happen before implementation.

---

### Pitfall 8: ISR Revalidation Conflicts with Standalone Docker Build

**What goes wrong:** The GitHub fetch uses `next: { revalidate: 3600 }` for ISR. On Cloud Run with `output: 'standalone'`, ISR works but has a subtle issue: the standalone server writes revalidation cache to the filesystem. On Cloud Run, container instances can be replaced at any time, losing the cache. This means:
1. After a new container starts, the first request always triggers a fresh GitHub API call.
2. With multiple container instances (if min instances > 1 or during scaling), each instance maintains its own cache -- no shared state.

**Why it happens:** ISR is designed for persistent server environments. Cloud Run's ephemeral filesystem and horizontal scaling break the cache sharing assumption.

**Consequences:** More GitHub API calls than expected (though with the 60/hr unauthenticated limit and 1-hour revalidation, this is unlikely to be a real problem at portfolio traffic levels). Slight latency spike on first request after container restart.

**Prevention:**
- At current traffic levels, this is a non-issue. The 1-hour revalidation + low traffic means API limits will not be hit.
- If traffic grows: add a GitHub personal access token (5,000 req/hr) as an environment variable.
- Do NOT over-engineer: skip Redis/external cache layers. ISR on Cloud Run is fine for this use case.
- Monitor: if you see 403s from GitHub in Cloud Run logs, add the token.

**Phase:** Projects page phase. Monitor, do not preemptively solve.

---

### Pitfall 9: Tailwind v4 Theme Tokens and New Component Styles

**What goes wrong:** The site uses Tailwind v4 with a custom `@theme inline` block defining design tokens (colors, fonts). New components (enhanced project cards, writing cards, contact hero) might use hardcoded color values instead of the theme tokens, creating visual inconsistency and maintenance debt.

**Why it happens:** Developers copy color values from a design tool (`#C8A55A`) instead of using the token (`text-gold`). Tailwind v4's `@theme` syntax is newer and less familiar, so developers may not know which tokens are available.

**Consequences:** Slight color mismatches, inability to do future theme changes in one place, inconsistent hover/focus states.

**Warning signs:**
- Arbitrary color values in new component classes (e.g., `text-[#C8A55A]` instead of `text-gold`)
- New components not using `border-border`, `bg-surface`, `text-text-primary` etc.
- Shadow values hardcoded instead of using `shadow-[var(--shadow-card)]`

**Prevention:**
- Document the available theme tokens from `globals.css` as a reference for all new component work.
- Available color tokens: `primary`, `primary-hover`, `gold`, `gold-hover`, `gold-light`, `surface`, `border`, `text-primary`, `text-secondary`, `text-tertiary`, `sage`, `amber`.
- Available shadow tokens: `--shadow-card`, `--shadow-card-hover`, `--shadow-button`.
- Available font tokens: `font-sans` (Inter), `font-mono` (JetBrains), `font-display` (Playfair Display).
- Lint rule: no arbitrary color values except for one-off accent needs.

**Phase:** All phases. Enforce from the start.

---

### Pitfall 10: Logo Accent CSS Change Cascading Unintentionally

**What goes wrong:** The "logo accent" requirement is a CSS change. If the logo uses a shared color token (e.g., `text-gold` or `text-primary`), changing that token affects every element using it site-wide. Alternatively, adding a new CSS class for the logo accent might conflict with existing navbar styles.

**Why it happens:** CSS changes feel safe but have global scope. A token change in `globals.css` affects dozens of elements.

**Consequences:** Navbar, buttons, headings, or card accents unexpectedly change color. Visual regression across the site.

**Warning signs:**
- Modifying `:root` CSS custom properties to change logo color
- Not checking which components use the changed token

**Prevention:**
- Do NOT modify existing theme tokens to achieve the logo accent. Create a new, scoped class or use an inline style/arbitrary value specifically on the logo element.
- If the accent is a new color, add it as a new token (e.g., `--color-logo-accent`) rather than repurposing `--color-gold`.
- Visually review the homepage, projects, writing, and contact pages after any CSS token change.
- This is a small change; keep it small. One class on one element.

**Phase:** Branding assets phase. Lowest risk, but test all pages after.

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

### Pitfall 11: Sitemap Not Updated for New Pages

**What goes wrong:** The sitemap at `src/app/sitemap.ts` currently lists all routes. If new pages are added or existing page priorities/frequencies change, the sitemap is forgotten.

**Prevention:** After adding/modifying any page, update `sitemap.ts`. The writing page priority should increase from 0.5 if it now has real content.

**Phase:** Final polish, but check after each page phase.

---

### Pitfall 12: metadataBase Mismatch

**What goes wrong:** The `layout.tsx` sets `metadataBase` to `https://dweinbeck.com`, but the site is described as live at `dan-weinbeck.com` in the project context. If these are different domains or if one redirects to the other, OG images and canonical URLs will point to the wrong domain.

**Warning signs:** OG image URLs in HTML source pointing to wrong domain.

**Prevention:** Verify which domain is canonical. Update `metadataBase` and all hardcoded URLs in `sitemap.ts` and `page.tsx` (Person schema) to match.

**Phase:** Branding assets phase (when touching OG image).

---

### Pitfall 13: Form JS-Disabled Fallback Not Tested

**What goes wrong:** The requirements call for a JS-disabled fallback for the contact form. The current `ContactForm` is a `"use client"` component using `useActionState` -- it requires JavaScript. Without JS, the form does not render at all (it is a client component). A `<noscript>` fallback showing just the email address is needed, but is easy to forget.

**Prevention:**
- Add a `<noscript>` block in the contact page showing the email address directly with a mailto link.
- Test by disabling JavaScript in Chrome DevTools > Settings.
- The mailto link and copy button (which also requires JS) should have the email visible as plain text regardless.

**Phase:** Contact redesign phase.

---

## Phase-Specific Warnings Summary

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Projects page | #1 Dual data sources, #2 Missing API fields | Unify type system first, audit API response |
| Writing page | #6 No content strategy | Define frontmatter schema before UI |
| Contact redesign | #3 Breaking server action, #7 Missing analytics, #13 No JS fallback | Wrap existing form, decide analytics early, add noscript |
| OG image | #4 Cache not invalidated, #12 Domain mismatch | Test with platform debuggers, verify metadataBase |
| Favicon | #5 Missing formats | Generate full icon set |
| Logo accent | #10 CSS cascade | Scope to single element, do not modify global tokens |
| All phases | #9 Theme token misuse | Reference token list, avoid arbitrary values |

---

## Sources

- Direct codebase analysis (HIGH confidence -- all findings based on reading the actual source files)
- Next.js file-based metadata conventions (HIGH confidence -- well-documented in Next.js docs)
- GitHub REST API `/users/:user/repos` response schema (HIGH confidence -- stable API)
- Social platform OG cache behavior (MEDIUM confidence -- based on known platform behavior patterns)
