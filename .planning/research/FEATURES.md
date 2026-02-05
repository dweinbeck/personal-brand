# Feature Landscape

**Domain:** Personal brand / developer portfolio site (v1.1 page buildout)
**Researched:** 2026-02-04
**Overall confidence:** HIGH (well-established domain patterns; verified against current codebase)

---

## Current State Summary

The site already has a solid v1.0 foundation: home page with hero + featured projects grid, basic projects page (3-col, hardcoded data), writing stub (placeholder), contact form with Firestore/honeypot/rate-limiting, tutorials section, full SEO (meta, JSON-LD, sitemap), OG image (static PNG), and favicon (default .ico). The v1.1 goal is to upgrade these pages from "scaffolded" to "polished and complete."

---

## 1. Projects Page (Detailed Portfolio Cards)

### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|-------------|------------|--------------|
| 2-column card grid on desktop, 1-col mobile | Standard portfolio layout; 3-col is too cramped for detail cards | Low | Existing grid, just change breakpoints |
| Project name + multi-sentence description | Visitors need context on what each project does and why | Low | Existing `PlaceholderProject` type needs expansion |
| Technology/topic tags per card | Recruiters and collaborators scan for specific tech | Low | Already implemented in current cards |
| Status badge (Live / In Development / Planning) | Sets expectations; already present in current cards | Low | Already implemented |
| Public vs. Private designation | Shows breadth of work without exposing private repos | Low | New field on project data |
| Date range (initiated - last commit) | Demonstrates recency and sustained effort | Low | New fields on project data |
| Consistent card height with content truncation | Uneven cards look broken; `line-clamp` on description | Low | Already using `line-clamp-3` |
| Hover interaction (subtle lift + gold accent) | Signals interactivity; already in current cards | Low | Already implemented |

### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| "View Project" CTA button per card | Clear next action; link to future project detail page | Low | Route placeholder needed |
| Animated card entrance (staggered fade-in) | Polished feel; uses existing `fade-in-up` animation | Low | Existing CSS animation |
| Filter/sort by status or tag | Lets visitors find relevant work fast; rare on personal sites | Medium | Client-side state, URL params optional |
| GitHub star count or commit activity sparkline | Social proof + recency signal without leaving page | Medium | GitHub API integration (already have `github.ts`) |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Live GitHub API fetch for all project data | Hardcoded projects include private + non-GitHub work; GitHub API only covers public repos | Keep curated project data; optionally enrich with GitHub stats for public repos |
| Masonry / Pinterest layout | Unpredictable visual hierarchy; harder to scan | Use consistent 2-col grid with equal card heights |
| Modal/lightbox project detail | Breaks back button, bad for SEO, feels claustrophobic | Link to dedicated project page (future milestone) |
| Pagination for 6 projects | Unnecessary friction; all cards fit on one screen | Show all projects; add pagination only if count exceeds ~12 |

---

## 2. Writing Page (Blog/Article Listing)

### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|-------------|------------|--------------|
| Article cards with title, publish date, topic tag | Minimum viable blog listing; matches requirements | Low | New component, similar to ProjectCard |
| 2-column card grid matching Projects page | Visual consistency across site | Low | Reuse grid layout |
| Clickable cards linking to article pages | Blog listing without links is useless | Low | Route to individual articles needed |
| Empty state for zero articles | Current "Coming Soon" is fine for MVP but needs path to real content | Low | Already implemented |
| Chronological ordering (newest first) | Standard blog convention | Low | Sort at data layer |
| Consistent card styling with Projects page | Same site, same design language | Low | Shared Card component or consistent patterns |

### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Reading time estimate | Sets expectations; signals professionalism | Low | Calculate from word count at build time |
| Article excerpt / first paragraph preview | Helps visitors decide which article to read | Low | Pull from MDX frontmatter or content |
| Category/tag filtering | Useful once there are 5+ articles | Medium | Client-side filter state |
| Featured/pinned article at top | Highlight best work; editorial control | Low | Boolean in frontmatter |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full articles rendered on listing page | Slow, overwhelming, bad UX | Show card with excerpt; link to full article |
| Infinite scroll | Overkill for personal blog; breaks "sense of place" | Simple card grid; paginate only if needed |
| Comments system | Maintenance burden, spam magnet, low value for personal brand | Use Twitter/LinkedIn share links for discussion |
| RSS feed (v1.1) | Nice-to-have but not needed until content exists | Defer to v1.2+ when there are actual articles |

---

## 3. Contact Page Redesign

### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|-------------|------------|--------------|
| Hero section with headline + subhead | Sets tone; "Contact Dan" + guidance copy | Low | Replace current layout |
| Primary mailto CTA button | 84% of users don't use native mail clients, but mailto is still expected as an option | Low | Simple `<a href="mailto:">` |
| Copy email button with confirmation feedback | Already exists; needs prominence upgrade to primary CTA | Low | Existing `CopyEmailButton` component |
| LinkedIn link as CTA | Professional networking channel; already in social links | Low | Already implemented |
| Inline form validation (email format, message min length) | 31% of sites lack this; it reduces form abandonment significantly | Medium | Enhance existing `ContactForm` with client-side validation |
| Success state with clear confirmation | Already implemented ("Sent" output) but needs design polish | Low | Existing success state |
| Failure state with email fallback | Critical: if form breaks, visitor must still be able to reach you | Low | New error message with email link |
| Loading state with disabled submit | Prevents double-submission; standard UX | Low | Already have `SubmitButton` with pending state |
| Response time expectation copy | "Typical reply: 1-2 business days" reduces spam, increases trust | Low | Static copy |
| Privacy/retention disclosure | Brief note on data handling; builds trust | Low | Static copy block |
| Mobile-friendly layout (single-col, large tap targets) | Non-negotiable for any contact page | Low | Responsive grid already in place |

### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Analytics events (copy, mailto click, form start, submit, error) | Measurable contact funnel; required by success metrics | Medium | Event tracking layer (custom events or analytics library) |
| Positive validation feedback (green check on valid fields) | Goes beyond error-only validation; feels polished | Low | CSS + validation state |
| Urgency guidance ("Put URGENT in subject") | Practical; shows you're responsive | Low | Static copy |
| Graceful JS-disabled fallback | Email-only view when JS fails; accessibility win | Low | `<noscript>` block or server-rendered fallback |
| Character count on message field | Helps users gauge appropriate message length | Low | Client-side counter |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| CAPTCHA (reCAPTCHA, hCaptcha) | Terrible UX; honeypot + rate limiting is sufficient for personal site | Keep existing honeypot + server-side rate limiting |
| Required phone number field | Privacy-invasive; unnecessary for email-based contact | Name, email, message only |
| Multi-step form wizard | Overkill for 3 fields; adds friction | Single-page form |
| Auto-reply email system | Complexity and deliverability headaches for marginal value | Clear on-page confirmation is sufficient |
| Social media feed embeds | Slow, visually inconsistent, privacy concerns | Simple icon links to profiles |

---

## 4. OG Image (Branded Social Sharing)

### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|-------------|------------|--------------|
| Branded static OG image at 1200x630px | Standard dimensions for Twitter/LinkedIn/Slack previews | Low | Already have `/app/opengraph-image.png`; needs redesign |
| Navy background + gold accent + "DW" or name | Matches site branding; recognizable in feeds | Low | Design asset |
| Title + subtitle text (name + role) | Context for what the link is about | Low | Baked into image |
| Applied to all pages via root-level file | Next.js convention: `app/opengraph-image.png` applies globally | Low | Already in place |

### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Dynamic OG via `opengraph-image.tsx` using `next/og` ImageResponse | Per-page OG images (blog posts, project pages) with dynamic titles | Medium | Only valuable when blog/project detail pages exist |
| Twitter-specific image (`twitter-image.png`) | Optimized for Twitter card rendering | Low | Same design, different file convention |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Dynamic OG generation for v1.1 | No per-page content yet to differentiate; premature optimization | Single branded static image; add dynamic when blog posts ship |
| Third-party OG image services | Unnecessary dependency for a static image | Use Next.js built-in or static PNG |

---

## 5. Favicon (Custom Tab Icon)

### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|-------------|------------|--------------|
| Custom favicon replacing Next.js default | Default favicon signals "unfinished site" | Low | Replace `src/app/favicon.ico` |
| "DW" or monogram design in navy/gold | Brand consistency across tab, bookmarks | Low | Design asset |
| ICO format for universal browser support | Safari and older browsers need .ico | Low | Standard |

### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| SVG favicon with dark mode support | Adapts to OS theme; looks crisp at any size; ~300-800 bytes | Low | SVG file + `<link>` tag with `type="image/svg+xml"` in layout |
| Apple touch icon (180x180 PNG) | Clean icon on iOS home screen / bookmarks | Low | Static PNG in `app/` directory |
| Multiple sizes (16, 32, 180, 512) | Covers all contexts: tabs, bookmarks, PWA, shortcuts | Low | Asset generation from single source |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Animated favicon | Distracting, poor browser support, unprofessional | Static branded icon |
| Complex detailed image as favicon | Illegible at 16x16; must be simple and bold | Simple "DW" monogram or abstract mark |

---

## 6. Logo Accent (Gold Underline on Navbar "DW")

### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|-------------|------------|--------------|
| Gold underline or accent on "DW" wordmark | Adds brand polish; currently plain text with hover-only gold | Low | CSS pseudo-element or border on existing Navbar `<span>` |
| Consistent with site gold (#C8A55A) | Must match design system | Low | Existing CSS variable `--color-gold` |
| Doesn't shift layout on hover/interaction | Layout shifts are jarring | Low | Use `border-bottom` or `::after` with fixed height |

### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Subtle animation on accent (fade-in on load, or hover width transition) | Micro-interaction polish | Low | CSS transition on `::after` width |
| Accent doubles as active-page indicator | Navigation clarity without extra UI | Low | Conditional class based on route |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full logo image/SVG replacing text | Slower to load, harder to maintain, text "DW" is the brand | Keep text-based wordmark with CSS accent |
| Animated logo on every page load | Distracting after first visit | Animate once on initial load or not at all |

---

## Feature Dependencies

```
Logo Accent ──────────────────────── (independent, CSS only)
Favicon ──────────────────────────── (independent, asset swap)
OG Image ─────────────────────────── (independent, asset swap)
Contact Redesign ─────────────────── (depends on existing ContactForm, CopyEmailButton)
   └── Analytics events ──────────── (depends on event tracking setup)
Projects Page ────────────────────── (depends on expanded project data model)
   └── GitHub enrichment (optional)── (depends on existing github.ts)
Writing Page ─────────────────────── (depends on content source: MDX or data)
   └── Individual article pages ──── (future milestone, but route stubs needed)
```

**No circular dependencies.** All six features can be built in parallel, though Contact and Projects have the most internal complexity.

---

## MVP Recommendation

**Priority 1 (brand foundation -- do first, they are fast):**
1. Favicon -- eliminates "unfinished" signal; 30 minutes of work
2. Logo accent -- one CSS rule; immediate brand polish
3. OG image -- static redesign; ensures every share looks professional

**Priority 2 (page upgrades -- core of v1.1):**
4. Projects page -- expand data model, 2-col layout, new fields (dates, public/private, CTA)
5. Contact redesign -- hero + CTAs + inline validation + privacy note + analytics events
6. Writing page -- card listing matching Projects style; depends on having content or good empty state

**Defer to v1.2+:**
- Dynamic per-page OG images (no per-page content yet)
- Tag filtering on Projects/Writing (not enough items yet)
- RSS feed (no blog content yet)
- GitHub star counts / activity sparklines (nice-to-have, API complexity)

---

## Sources

- [Webflow: 23 Portfolio Website Examples](https://webflow.com/blog/design-portfolio-examples) -- card design patterns
- [Baymard Institute: Inline Form Validation](https://baymard.com/blog/inline-form-validation) -- 31% of sites lack inline validation
- [Juan Garcia: Click to Copy Email Pattern](https://www.juangarcia.design/blog/ditching-the-mailto-link:-click-to-copy-email-pattern/) -- 84% of users don't use native mail clients
- [Next.js Docs: opengraph-image](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) -- OG image file conventions
- [web.dev: Building an Adaptive Favicon](https://web.dev/articles/building/an-adaptive-favicon) -- SVG favicon with dark mode
- [favicon.im: SVG Favicon Guide](https://favicon.im/blog/svg-favicon-complete-guide) -- SVG vs ICO tradeoffs
- [Design Studio: Form UX Best Practices 2026](https://www.designstudiouiux.com/blog/form-ux-design-best-practices/) -- form validation patterns
- [PatternFly: Clipboard Copy](https://www.patternfly.org/components/clipboard-copy/design-guidelines/) -- copy-to-clipboard UX standards
- Existing codebase analysis (globals.css, ProjectCard, ContactForm, Navbar, layout.tsx)
