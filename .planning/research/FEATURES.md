# Feature Landscape: Control Center Content Editor + Brand Scraper UI

**Domain:** Admin tooling -- MDX content editor and async job dashboard for brand analysis
**Researched:** 2026-02-08
**Overall confidence:** HIGH (well-established CMS and dashboard patterns; direct codebase analysis of existing components, metadata shape, and design tokens)

---

## Current State Summary

The personal-brand site has two relevant existing systems:

1. **Building Blocks content system** -- MDX files in `src/content/building-blocks/` with `export const metadata` containing `{ title, description, publishedAt, tags }`. Files are discovered at build time by `src/lib/tutorials.ts` using `fs.readdirSync`. Content is rendered via `@next/mdx` with `remark-gfm` and `rehype-pretty-code`. The `ArticleTabs` component already demonstrates tab-based content switching (manual vs fast track).

2. **Control Center** -- Admin area at `/control-center/` protected by `AdminGuard` (Firebase Auth email check). Currently shows GitHub repos grid and Todoist project kanban. Uses `force-dynamic` rendering. The layout wraps all children in `AdminGuard`.

The two new features fit naturally as new sections within the Control Center:
- **Building Blocks Editor** -- form-guided MDX content creation with live preview
- **Brand Scraper UI** -- URL submission, async job monitoring, and brand data gallery

---

## Feature 1: Building Blocks Content Editor

### Overview

A form-guided content editor that produces MDX files matching the existing `export const metadata` + markdown body format. This is NOT a full CMS -- it is a single-user admin tool for one author (Dan) to create Building Blocks tutorials without manually writing metadata boilerplate.

---

### Table Stakes

Features that must exist for the editor to be useful. Without these, it would be faster to just write MDX files directly.

#### TS-1: Metadata Form Fields

| Aspect | Detail |
|--------|--------|
| **Feature** | Structured form fields for all metadata properties: title, description, publishedAt, tags |
| **Why Expected** | The entire point of a form-guided editor is separating metadata from content. Every CMS -- Contentful, Sanity, DatoCMS, Decap -- presents structured fields for metadata and a separate content area |
| **Complexity** | Low |
| **Dependencies** | Must match `TutorialMeta` interface in `src/lib/tutorials.ts` |

**Required fields:**

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Title | Text input | Required, max 100 chars | Used for `metadata.title` and as seed for slug generation |
| Description | Textarea | Required, max 300 chars | Used for `metadata.description` and meta tags |
| Published Date | Date input | Required, defaults to today | ISO format (`YYYY-MM-DD`) matching existing `publishedAt` |
| Tags | Multi-select or comma-separated input | At least 1, max 5 | Existing tags include: Git, GitHub, DevOps, Workflow, Tooling, Beginner. Allow custom tags |

**Confidence:** HIGH -- directly mirrors the `TutorialMeta` interface already in the codebase.

#### TS-2: Slug Generation and Validation

| Aspect | Detail |
|--------|--------|
| **Feature** | Auto-generate URL slug from title, with manual override and uniqueness validation |
| **Why Expected** | Every CMS auto-generates slugs from titles. Contentful, Sanity, and DatoCMS all have slug fields that auto-populate from the title field. Manual editing is expected for SEO tuning |
| **Complexity** | Low-Medium |
| **Dependencies** | Needs to check against existing files in `src/content/building-blocks/` |

**Slug rules:**
1. Auto-generate from title on blur/change (only if slug has not been manually edited)
2. Lowercase, replace spaces with hyphens, strip non-alphanumeric except hyphens
3. Collapse consecutive hyphens, trim leading/trailing hyphens
4. Min 3 characters, max 100 characters
5. Validate uniqueness against existing `.mdx` files in the content directory
6. Display the resulting URL preview: `/building-blocks/{slug}`

**Implementation:** Use a simple `slugify()` utility function. Uniqueness check requires a server action or API route that reads the content directory. The slug becomes the filename: `{slug}.mdx`.

**Confidence:** HIGH -- slug generation is a well-established pattern with clear rules.

#### TS-3: Markdown Content Area

| Aspect | Detail |
|--------|--------|
| **Feature** | A textarea for writing the markdown body of the tutorial |
| **Why Expected** | The core editing experience. Without this, the editor only produces metadata |
| **Complexity** | Low (plain textarea) to Medium (enhanced editor) |
| **Dependencies** | None |

**Recommended approach: Enhanced textarea, NOT a WYSIWYG editor.**

Rationale for plain textarea over MDXEditor or react-md-editor:
- MDXEditor ships at 851 kB gzipped -- enormous for a single-user admin tool
- The content is MDX with code blocks, which WYSIWYG editors handle poorly
- Dan is a developer comfortable with markdown syntax
- The existing content (`setting-up-a-repo.mdx`, `custom-gpt.mdx`) uses standard markdown features: headings, code blocks, lists, links, bold/italic
- A plain textarea with a toolbar for common insertions (heading, bold, code block, link) is the right tradeoff

**Toolbar quick-insert buttons:**
- `## Heading` -- insert heading prefix
- `**bold**` -- wrap selection
- `` `code` `` -- wrap selection in inline code
- ```` ```bash ... ``` ```` -- insert fenced code block template
- `[text](url)` -- insert link template
- `- item` -- insert list item

**Confidence:** HIGH -- plain textarea with toolbar is the standard pattern for developer-facing markdown editors. The overhead of WYSIWYG is not justified for a single user.

#### TS-4: Live Preview (Tab Toggle)

| Aspect | Detail |
|--------|--------|
| **Feature** | Toggle between "Edit" and "Preview" views to see rendered markdown |
| **Why Expected** | Users expect to see how their content will look before saving. Every markdown editor -- GitHub, VS Code, Notion -- provides preview. The site already has a tab toggle pattern in `ArticleTabs.tsx` |
| **Complexity** | Medium |
| **Dependencies** | Markdown rendering library |

**Recommended approach: Tab toggle (not split view).**

Rationale:
- The site already has a tab toggle component (`ArticleTabs`) that switches between two content views. This establishes the pattern.
- Split view requires responsive handling (stacking on mobile) and doubles the visible content area, which fights the admin layout.
- Tab toggle is simpler to build and matches the existing site patterns.
- For a single-user tool, the slight friction of switching tabs is acceptable.

**Preview rendering:**
- Use `react-markdown` with `remark-gfm` for GFM support (tables, strikethrough, task lists)
- Apply the same `prose prose-neutral max-w-none` classes used on the actual tutorial pages
- This ensures the preview matches the published output exactly
- Code block syntax highlighting can use `rehype-highlight` (lightweight) rather than `rehype-pretty-code` (build-time only) for client-side rendering

**Tab states:**
- "Edit" tab: metadata form + markdown textarea (default)
- "Preview" tab: rendered metadata header (title, description, date, tags) + rendered markdown body
- The preview should replicate the actual tutorial page layout from `src/app/building-blocks/[slug]/page.tsx`

**Confidence:** HIGH -- tab toggle is already an established pattern in this codebase.

#### TS-5: Save (Write to Filesystem)

| Aspect | Detail |
|--------|--------|
| **Feature** | Save the editor content as an MDX file to `src/content/building-blocks/` |
| **Why Expected** | The entire purpose of the editor. Without save, it is a preview tool |
| **Complexity** | Medium |
| **Dependencies** | Server action or API route with filesystem write access |

**File format to produce:**

```mdx
export const metadata = {
  title: "The Title",
  description: "The description",
  publishedAt: "2026-02-08",
  tags: ["Tag1", "Tag2"],
};

[markdown body content here]
```

This exactly matches the existing format in `setting-up-a-repo.mdx` and `custom-gpt.mdx`.

**Implementation:**
- Server action that receives `{ slug, title, description, publishedAt, tags, body }`
- Constructs the MDX string with `export const metadata` block + body
- Writes to `src/content/building-blocks/{slug}.mdx` using `fs.writeFileSync`
- Returns success/error status
- On Cloud Run (production), the filesystem is read-only. This feature works in local development. For production, it would need an alternative persistence layer (Git commit via API, or Firestore draft storage). Flag this as a known limitation.

**Confidence:** HIGH for format. MEDIUM for production deployment -- filesystem writes on Cloud Run require careful handling (see PITFALLS).

#### TS-6: Unsaved Changes Protection

| Aspect | Detail |
|--------|--------|
| **Feature** | Warn user before navigating away with unsaved changes |
| **Why Expected** | Standard form behavior. Losing work to an accidental navigation is unacceptable in any editor |
| **Complexity** | Low |
| **Dependencies** | None |

**Implementation:**
- Track "dirty" state: form fields or textarea content have changed since last save
- Use `beforeunload` event listener (covers browser back, close tab, external navigation)
- For Next.js App Router internal navigation: use the `onBeforeRouteChange` pattern or a simple `window.confirm` in a navigation interceptor
- Reset dirty state after successful save

**Confidence:** HIGH -- `beforeunload` is the standard browser API for this. React Hook Form's `isDirty` is the standard React approach, but a simple manual state comparison works fine for a single form.

---

### Differentiators

Features that make the editor feel polished beyond the minimum viable product. Not expected, but valued.

#### D-1: Edit Existing Tutorials

| Aspect | Detail |
|--------|--------|
| **Feature** | Load an existing MDX file into the editor for modification |
| **Why Expected** | Not expected in MVP, but critical for the editor to be useful long-term. Without edit, you can only create new tutorials -- fixing typos requires manual file editing |
| **Complexity** | Medium |
| **Value** | HIGH -- transforms the editor from "create only" to "manage" |

**Implementation:**
- Tutorial list page within Control Center showing all existing tutorials
- Click to load: parse the MDX file to extract metadata and body
- The existing `extractMetadataFromSource()` in `tutorials.ts` already has regex parsing for the metadata block -- reuse this
- Body extraction: split on the closing `};` of the metadata export, take everything after
- Save overwrites the existing file (same slug)

**Confidence:** HIGH -- the parsing infrastructure already exists.

#### D-2: Fast Companion File Support

| Aspect | Detail |
|--------|--------|
| **Feature** | Create and manage the `_slug-fast.mdx` companion files that the existing `ArticleTabs` component renders |
| **Why Expected** | Not expected, but the site already supports this dual-content pattern. Two existing tutorials have fast companions (`_setting-up-a-repo-fast.mdx`, `_custom-gpt-fast.mdx`) |
| **Complexity** | Low (if base editor works) |
| **Value** | Medium -- keeps the dual-tab content pattern maintainable |

**Implementation:**
- Toggle/checkbox in the editor: "Include fast track version"
- When enabled, show a second markdown textarea for the fast companion content
- Save produces both `{slug}.mdx` and `_{slug}-fast.mdx`

**Confidence:** HIGH -- straightforward extension of the base editor.

#### D-3: Character/Word Count

| Aspect | Detail |
|--------|--------|
| **Feature** | Display word count and estimated reading time below the textarea |
| **Why Expected** | Nice to have. The tutorial detail page already calculates reading time with `calculateReadingTime()` in the `[slug]/page.tsx`. Showing this in the editor gives immediate feedback |
| **Complexity** | Low |
| **Value** | Low-Medium |

**Implementation:** Count words in the textarea content, divide by 200 (matching the existing formula), display as "~N min read (M words)".

**Confidence:** HIGH -- trivial calculation.

#### D-4: Draft Status / Publish Toggle

| Aspect | Detail |
|--------|--------|
| **Feature** | Save content as "draft" (not visible on the public site) vs "published" |
| **Why Expected** | Standard CMS workflow. Allows work-in-progress content without publishing |
| **Complexity** | Medium |
| **Value** | Medium |

**Implementation options:**
- **Simple approach:** Add a `draft: boolean` field to `TutorialMeta`. The `getAllTutorials()` function filters out drafts. The editor shows a "Publish" vs "Save Draft" button. This requires modifying `TutorialMeta` and `tutorials.ts` -- minor but touches the public content system.
- **Alternative:** Use filename convention -- prefix draft files with `_draft-`. The existing file discovery already skips files starting with `_`.

**Recommendation:** Use the `_draft-` filename prefix for MVP. It requires zero changes to the existing content system and leverages the existing skip-underscore behavior in `tutorials.ts`. The editor shows a "Save as Draft" vs "Publish" choice.

**Confidence:** HIGH -- the underscore-prefix convention is already in place.

---

### Anti-Features

Features to deliberately NOT build for the content editor.

#### AF-1: WYSIWYG / Rich Text Editing (MDXEditor)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Full WYSIWYG editing with MDXEditor or similar | 851 kB gzipped bundle for a single-user admin tool. WYSIWYG editors struggle with code blocks and MDX syntax. The user is a developer comfortable with markdown | Plain textarea with toolbar quick-insert buttons (TS-3). Faster to build, smaller bundle, better for code-heavy content |

#### AF-2: Image Upload / Media Manager

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Drag-and-drop image upload with media library | Requires object storage (GCS bucket), upload API, image optimization pipeline. The existing tutorials have zero images -- they are text and code only. Massive complexity for unused functionality | Reference external images via markdown URL syntax `![alt](url)` if ever needed. Images can be placed in `/public/` manually |

#### AF-3: Collaborative Editing / Multi-User

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Real-time collaboration, edit locking, version conflict resolution | Single user (Dan). No other editors. Adding collaboration adds WebSocket infrastructure, OT/CRDT algorithms, user presence UI | Single-user editor with simple save. No locking needed |

#### AF-4: Revision History / Version Control in UI

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| In-app revision history showing previous versions of each tutorial | Files are in a Git repo. Git IS the revision history. Building a secondary versioning system duplicates existing functionality | Use Git for version history. If a diff view is needed later, shell out to `git log` / `git diff` |

#### AF-5: Content Scheduling (Future Publish Date)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Schedule content to publish at a future date/time | Requires a cron job or scheduled function to "flip" content from draft to published. Static site builds happen on deploy, not on a schedule. Over-engineered for a personal blog | Use the draft mechanism (D-4). When ready to publish, change to published and redeploy |

#### AF-6: SEO Analysis / Readability Scoring

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Inline SEO suggestions (keyword density, readability grade, meta description length warnings) | This is a developer tutorial site, not a marketing blog. SEO tooling adds complexity and visual noise without matching the use case | Write good content. The description field has a character limit. That is sufficient |

---

## Feature 2: Brand Scraper UI

### Overview

A dashboard within the Control Center for submitting URLs to the brand scraper API, monitoring async job progress, and browsing extracted brand data (colors, fonts, logos, design tokens). The scraper API is external -- it returns a `BrandTaxonomy` JSON with confidence scores on each extracted element.

---

### Table Stakes

Features that must exist for the brand scraper UI to be functional.

#### TS-7: URL Submission Form

| Aspect | Detail |
|--------|--------|
| **Feature** | Input field to submit one or more URLs for brand analysis |
| **Why Expected** | The entry point for the entire feature. Without URL submission, nothing happens |
| **Complexity** | Low |
| **Dependencies** | Brand scraper API endpoint |

**Form fields:**

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| URL | Text input | Required, valid URL format (starts with `http://` or `https://`) | Primary input |
| Label/Name | Text input | Optional | A friendly name for the brand (e.g., "Stripe") for the gallery card title |

**Submission behavior:**
- Validate URL format client-side
- POST to the scraper API
- API returns a job ID immediately (async pattern)
- Transition to job monitoring view (TS-8)
- Disable submit button during request to prevent duplicates

**Confidence:** HIGH -- standard form submission pattern.

#### TS-8: Job Status Monitoring

| Aspect | Detail |
|--------|--------|
| **Feature** | Poll the scraper API for job status and display progress |
| **Why Expected** | The scraper is async (queued -> processing -> succeeded/partial/failed). Users need to know what is happening. Without status feedback, the UI appears broken during the 10-60 second processing time |
| **Complexity** | Medium |
| **Dependencies** | API polling mechanism |

**Status transitions and display:**

| Status | Visual Treatment | User Action |
|--------|-----------------|-------------|
| `queued` | Pulsing dot + "Queued..." text | Wait |
| `processing` | Spinner/animated bar + "Analyzing..." text | Wait |
| `succeeded` | Green check + "Complete" | View results |
| `partial` | Amber warning + "Partial results" | View results (with caveat) |
| `failed` | Red X + error message | Retry option |

**Polling implementation:**
- Use a `useEffect` + `setInterval` pattern with cleanup on unmount
- Poll every 2-3 seconds while status is `queued` or `processing`
- Stop polling when status reaches a terminal state (`succeeded`, `partial`, `failed`)
- Use `useRef` for the interval ID and callback to avoid stale closure issues
- Alternative: TanStack Query with `refetchInterval` that conditionally stops -- cleaner API but adds a dependency. For a single polling use case, the manual approach is sufficient.

**Confidence:** HIGH -- polling is a well-established pattern. The 2-3 second interval balances responsiveness with API load.

#### TS-9: Brand Data Gallery (Results View)

| Aspect | Detail |
|--------|--------|
| **Feature** | Display extracted brand data in an organized, visual gallery |
| **Why Expected** | The whole point of the scraper. Raw JSON is not useful. Brand data is inherently visual (colors, fonts, logos) and must be displayed visually |
| **Complexity** | High (many sub-components) |
| **Dependencies** | Successful job completion, BrandTaxonomy JSON structure |

**Gallery sections (in display order):**

**1. Color Palette Section**

| Element | Display |
|---------|---------|
| Swatches | Rectangular color blocks in a grid (4-6 per row) |
| Each swatch shows | The color fill, hex code below, role label (primary/secondary/accent/background/text) |
| Hex/RGB toggle | Small toggle to switch between hex and RGB display |
| Confidence per color | Small dot or bar on the swatch (green/amber/red) |
| Copy hex on click | Click a swatch to copy hex to clipboard (toast feedback) |

**2. Typography Section**

| Element | Display |
|---------|---------|
| Font family cards | Card per font with: family name rendered in that font (via Google Fonts embed or fallback), weight, usage (heading/body), source (Google Fonts/custom) |
| Font specimen | Show "The quick brown fox" or similar specimen text in the detected font |
| Google Fonts link | If source is `google_fonts`, link to the Google Fonts page |

**3. Logo & Favicon Section**

| Element | Display |
|---------|---------|
| Image grid | Thumbnail grid of downloaded logos and favicons |
| Each card shows | Image preview, format (SVG/PNG), dimensions if available |
| Download individual | Download button per asset |
| Formats indicated | Badge showing SVG/PNG/ICO |

**4. Design Tokens Section**

| Element | Display |
|---------|---------|
| Token table | Grouped by category: color tokens, spacing, typography, shadows |
| Each row shows | CSS property name, value, a visual preview (color swatch for colors, length for spacing) |
| Copy token | Copy button per row |

**5. Identity Section**

| Element | Display |
|---------|---------|
| Tagline | Display the detected tagline |
| Industry guess | Badge showing detected industry |

**Confidence:** HIGH for the overall structure. The BrandTaxonomy JSON structure directly maps to these sections. The visual patterns (color swatches, font specimens, image grids) are well-established in design system documentation tools like Storybook, Figma, and Brand.dev.

#### TS-10: Confidence Indicators

| Aspect | Detail |
|--------|--------|
| **Feature** | Display confidence scores for extracted brand elements |
| **Why Expected** | The API provides confidence (0-1) and `needs_review` flags on each element. Hiding this would be dishonest -- some extractions are uncertain. Users need to know which data to trust and which to manually verify |
| **Complexity** | Low |
| **Dependencies** | TS-9 gallery components |

**Visualization pattern (tiered color + text):**

| Confidence Range | Color | Label | Tailwind Class |
|------------------|-------|-------|---------------|
| 0.85 - 1.0 | Sage (green) | "High" | `text-sage bg-sage/10` (uses existing `--color-sage`) |
| 0.60 - 0.84 | Amber/gold | "Medium" | `text-amber bg-amber/10` (uses existing `--color-amber`) |
| 0.00 - 0.59 | Muted gray | "Low" | `text-text-tertiary bg-text-tertiary/10` |

Additional indicators:
- `needs_review: true` -- show a small "Review" badge alongside the confidence level
- Evidence array -- tooltips or expandable section showing what evidence the scraper used

**Implementation:** A reusable `<ConfidenceBadge score={0.85} needsReview={false} />` component. Note that the existing codebase already has a `ConfidenceBadge` component for the AI assistant (confidence: "low" | "medium" | "high"). The brand scraper uses numeric 0-1 scores instead. Either extend the existing component to accept both formats, or create a separate `<BrandConfidenceBadge>` to avoid coupling.

**Confidence:** HIGH -- the site already has the color tokens for this three-tier system (`--color-sage`, `--color-amber`, `--color-muted`).

#### TS-11: Download Links

| Aspect | Detail |
|--------|--------|
| **Feature** | Download buttons for `brand.json` and `assets.zip` |
| **Why Expected** | The API returns signed GCS URLs for downloadable artifacts. Users expect to be able to download the complete brand data and assets |
| **Complexity** | Low |
| **Dependencies** | Signed URLs from API response |

**Display pattern:**
- Two prominent download buttons in a card/section at the top or bottom of the results view
- `brand.json` -- "Download Brand Data (JSON)" with file icon
- `assets.zip` -- "Download Assets (ZIP)" with archive icon
- Buttons use `<a href={signedUrl} download>` for direct browser download
- Show file size if available
- Note that signed URLs expire (typically 1 hour) -- show a timestamp or "Link expires in X minutes" if feasible

**Confidence:** HIGH -- `<a download>` with signed URLs is the standard pattern.

---

### Differentiators

Features that elevate the brand scraper UI beyond basic functionality.

#### D-5: Brand Gallery / History View

| Aspect | Detail |
|--------|--------|
| **Feature** | A gallery of all previously scraped brands, displayed as cards |
| **Why Expected** | Not required for single-use, but if the scraper is used more than once, users need to browse past results without re-scraping |
| **Complexity** | Medium |
| **Value** | HIGH -- transforms the tool from single-use to a brand reference library |

**Card layout per brand:**

| Element | Position |
|---------|----------|
| Brand name / URL | Card title |
| Primary color palette (3-5 swatches) | Below title, small inline swatches |
| Primary font | Font name in that font |
| Logo thumbnail | Top-right corner |
| Scrape date | Bottom of card, muted text |
| Overall confidence | Badge (uses same tiered system as TS-10) |
| Status | Badge if partial/failed |

**Storage:** Requires persisting job results. Options:
- Firestore (already integrated) -- store BrandTaxonomy JSON per job
- localStorage -- simpler but lost on device change
- **Recommendation:** Firestore, since the project already uses it and the data is small (a few KB per brand)

**Confidence:** MEDIUM -- depends on persistence layer decision.

#### D-6: Color Contrast Matrix

| Aspect | Detail |
|--------|--------|
| **Feature** | Show WCAG contrast ratios between extracted colors |
| **Why Expected** | Not expected, but valuable for anyone using the brand data for design work. Shows which color combinations are accessible |
| **Complexity** | Medium |
| **Value** | Medium -- useful for design validation, adds a "wow" factor |

**Implementation:** A matrix grid showing foreground vs background color pairs with their contrast ratio and WCAG AA/AAA pass/fail badges. Libraries like `wcag-contrast-ratio` or a simple relative luminance calculation can compute this.

**Confidence:** HIGH for the pattern (EightShapes Contrast Grid is the gold standard). MEDIUM for prioritization -- this is a nice-to-have.

#### D-7: Re-Scrape / Refresh

| Aspect | Detail |
|--------|--------|
| **Feature** | Button to re-scrape a previously analyzed URL |
| **Why Expected** | Brands update their sites. A re-scrape button saves the user from re-entering the URL |
| **Complexity** | Low |
| **Value** | Low-Medium |

**Implementation:** A "Re-analyze" button on the results page that submits the same URL as a new job.

**Confidence:** HIGH -- trivial to implement.

#### D-8: Side-by-Side Brand Comparison

| Aspect | Detail |
|--------|--------|
| **Feature** | Select two brands and compare their palettes, fonts, and tokens side by side |
| **Why Expected** | Not expected. Would be impressive but is a niche use case |
| **Complexity** | High |
| **Value** | Low |

**Recommendation:** Defer. This is a V2+ feature. The gallery view (D-5) provides enough browsing capability for now.

**Confidence:** HIGH that this should be deferred.

---

### Anti-Features

Features to deliberately NOT build for the brand scraper UI.

#### AF-7: Real-Time Scraping with WebSocket/SSE

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Stream scraping progress events in real time via WebSocket or SSE | The backend API uses a simple polling model (submit job, poll status). Adding streaming requires WebSocket infrastructure, connection management, and reconnection logic. The scraping takes 10-60 seconds -- polling every 2-3 seconds is perfectly adequate | Poll with `setInterval` at 2-3 second intervals (TS-8). Simple, reliable, matches the API design |

#### AF-8: Manual Brand Data Editing

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Allow users to manually edit/correct extracted brand data (change a hex value, rename a font) | Adds form state management for every field in the BrandTaxonomy, validation logic, and a save/persist mechanism. The scraper output is a snapshot, not a living document | Display results as read-only. If corrections are needed, the user can download the JSON, edit manually, and keep their own copy. The scraper is a starting point, not a design system manager |

#### AF-9: Automated Brand Monitoring / Change Detection

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Periodically re-scrape URLs and alert on brand changes | Requires a scheduler (Cloud Scheduler, cron), diff logic, notification system (email, push), and persistent storage of historical results. This is a full SaaS feature, not an admin tool | Use the manual re-scrape button (D-7) when needed. This is a personal tool, not a monitoring service |

#### AF-10: Export to Design Tool Formats (Figma, Sketch, Adobe XD)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Export brand data as Figma tokens, Sketch palette, or Adobe swatch files | Each design tool has its own format specification. Supporting multiple export formats is a significant development effort for minimal personal use | Provide `brand.json` download (TS-11). JSON is universal and can be manually imported or converted with existing tools |

#### AF-11: Public Brand Gallery / Sharing

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|---------------------|
| Make scraped brand data publicly viewable or shareable via link | The brand scraper is an admin tool behind `AdminGuard`. Making results public raises legal/trademark concerns (displaying other companies' brand assets) and requires a separate public-facing view layer | Keep everything behind AdminGuard. Download and share artifacts manually if needed |

---

## Feature Dependencies

```
CONTENT EDITOR DEPENDENCY CHAIN:

Server Action: write MDX file (TS-5)
  |
  v
Metadata Form (TS-1) + Slug Generation (TS-2)
  |
  +---> Markdown Textarea (TS-3)
  |       |
  |       +---> Live Preview Tab (TS-4)
  |               |
  |               +---> react-markdown rendering
  |
  +---> Unsaved Changes Protection (TS-6)
  |
  +---> [D-1] Edit Existing (loads file into form)
  |
  +---> [D-2] Fast Companion (second textarea)

BRAND SCRAPER DEPENDENCY CHAIN:

URL Submission Form (TS-7)
  |
  v
Job Status Polling (TS-8)
  |
  v
Brand Data Gallery (TS-9)
  |
  +---> Color Palette Section
  |       +---> Confidence Badges (TS-10)
  |
  +---> Typography Section
  |       +---> Confidence Badges (TS-10)
  |
  +---> Logo/Favicon Section
  |       +---> Confidence Badges (TS-10)
  |
  +---> Design Tokens Section
  |       +---> Confidence Badges (TS-10)
  |
  +---> Identity Section
  |
  +---> Download Links (TS-11)

INDEPENDENT:
  [D-5] Brand Gallery (requires Firestore persistence layer)
  [D-6] Contrast Matrix (depends on TS-9 color data only)

SHARED DEPENDENCY:
  Both features depend on Control Center layout (already exists)
  Both features depend on AdminGuard (already exists)
```

---

## MVP Recommendation

### Content Editor MVP

Build in this order:

**Must ship (table stakes):**
1. Metadata form fields matching TutorialMeta (TS-1) -- the foundation
2. Slug generation and validation (TS-2) -- needed for file naming
3. Markdown textarea with toolbar (TS-3) -- the editing surface
4. Live preview tab (TS-4) -- visual verification before save
5. Save to filesystem via server action (TS-5) -- the whole point
6. Unsaved changes warning (TS-6) -- data loss prevention

**Should ship (low-effort, high value):**
7. Word count / reading time (D-3) -- trivial addition
8. Draft support via filename prefix (D-4) -- leverages existing convention

**Defer to post-MVP:**
- Edit existing tutorials (D-1) -- important but can use manual file editing for now
- Fast companion support (D-2) -- edge case, existing companions were created manually
- WYSIWYG editing (AF-1) -- wrong tool for the job
- Image upload (AF-2) -- no images in existing content

### Brand Scraper UI MVP

Build in this order:

**Must ship (table stakes):**
1. URL submission form (TS-7) -- entry point
2. Job status polling (TS-8) -- progress feedback
3. Brand data gallery with all sections (TS-9) -- the payoff
4. Confidence indicators (TS-10) -- data quality transparency
5. Download links (TS-11) -- get the artifacts

**Should ship (high value):**
6. Brand gallery / history (D-5) -- makes the tool reusable

**Defer to post-MVP:**
- Contrast matrix (D-6) -- nice to have, not essential
- Re-scrape (D-7) -- can re-enter URL manually
- Side-by-side comparison (D-8) -- niche use case

---

## New Components to Build

### Content Editor

| Component | Type | Purpose | Estimated Size |
|-----------|------|---------|---------------|
| `EditorPage` | Client Component | Page at `/control-center/building-blocks/new` | ~50 lines (orchestrator) |
| `MetadataForm` | Client Component | Title, description, date, tags, slug fields | ~120 lines |
| `MarkdownEditor` | Client Component | Textarea with toolbar + word count | ~100 lines |
| `EditorPreview` | Client Component | Rendered markdown preview tab | ~60 lines |
| `EditorTabs` | Client Component | Edit/Preview tab toggle | ~40 lines |
| `slugify` | Utility | Title to URL slug conversion | ~15 lines |
| `saveTutorial` | Server Action | Write MDX file to filesystem | ~40 lines |

### Brand Scraper UI

| Component | Type | Purpose | Estimated Size |
|-----------|------|---------|---------------|
| `BrandScraperPage` | Client Component | Page at `/control-center/brands` | ~80 lines (orchestrator) |
| `UrlSubmitForm` | Client Component | URL input + submit button | ~60 lines |
| `JobStatusCard` | Client Component | Polling status display with progress | ~80 lines |
| `BrandGallery` | Client Component | Results container with section tabs | ~60 lines |
| `ColorPalette` | Client Component | Color swatches grid with copy-to-clipboard | ~100 lines |
| `TypographySection` | Client Component | Font family cards with specimens | ~80 lines |
| `LogoGrid` | Client Component | Logo/favicon thumbnail grid | ~60 lines |
| `DesignTokenTable` | Client Component | CSS token table with visual previews | ~80 lines |
| `IdentitySection` | Client Component | Tagline + industry display | ~30 lines |
| `BrandConfidenceBadge` | Client Component | Numeric confidence to color-coded badge | ~30 lines |
| `DownloadLinks` | Client Component | brand.json + assets.zip download buttons | ~40 lines |
| `useJobPolling` | Hook | Custom hook for poll-until-complete | ~40 lines |

---

## Sources

- Existing codebase analysis: `src/lib/tutorials.ts`, `src/content/building-blocks/*.mdx`, `src/components/building-blocks/ArticleTabs.tsx`, `src/app/building-blocks/[slug]/page.tsx`, `src/app/control-center/page.tsx`, `src/components/admin/AdminGuard.tsx`, `src/app/globals.css` (HIGH confidence -- direct file inspection)
- CMS form field patterns: [Sanity field validation best practices](https://www.sanity.io/answers/best-practice-validation-for-different-types-of-fields-slugs-titles-etc), [DatoCMS slug permalinks](https://www.datocms.com/docs/content-modelling/slug-permalinks) (MEDIUM confidence)
- Slug generation rules: [URL Slug Guide 2025](https://seoservicecare.com/url-slug-guide/), [JavaScript regex URL slug validation](https://www.ditig.com/javascript-regex-url-slug-validation) (HIGH confidence -- well-established web standards)
- Markdown editor approaches: [5 Best Markdown Editors for React](https://strapi.io/blog/top-5-markdown-editors-for-react), [MDXEditor](https://mdxeditor.dev/) (HIGH confidence -- evaluated and rejected for bundle size)
- Live preview patterns: [UI Patterns - Live Preview](https://ui-patterns.com/patterns/LivePreview), [Smashing Magazine - Visual Editing](https://www.smashingmagazine.com/2023/06/visual-editing-headless-cms/) (HIGH confidence)
- Unsaved changes protection: [Next.js + React Hook Form beforeunload](https://dev.to/juanmtorrijos/how-to-add-the-changes-you-made-may-not-be-saved-warning-to-a-nextjs-app-with-react-hook-form-3ibh) (HIGH confidence)
- Async polling patterns: [Polling in React](https://dev.to/tangoindiamango/polling-in-react-3h8a), [TanStack Query refetchInterval](https://github.com/tannerlinsley/react-query/discussions/713) (HIGH confidence)
- Confidence visualization: [Agentic Design - Confidence Visualization Patterns](https://agentic-design.ai/patterns/ui-ux-patterns/confidence-visualization-patterns), [AI UX Design Guide](https://www.aiuxdesign.guide/patterns/confidence-visualization) (HIGH confidence)
- Brand data display: [Brand.dev Styleguide API](https://docs.brand.dev/api-reference/screenshot-styleguide/extract-design-system-and-styleguide-from-website) (MEDIUM confidence -- reference implementation)
- Color accessibility tools: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/), [InclusiveColors](https://www.inclusivecolors.com/) (HIGH confidence -- pattern reference for D-6)
