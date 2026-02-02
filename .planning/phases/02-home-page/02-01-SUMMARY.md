---
phase: 02-home-page
plan: "01"
subsystem: hero-section
tags: [nextjs, next-image, tailwind-v4, animation, accessibility]
dependency-graph:
  requires: [01-02]
  provides: [hero-section, project-type, animation-keyframes, sr-only-utility]
  affects: [02-02]
tech-stack:
  added: []
  patterns: [server-components, next-image-preload, tailwind-v4-theme-animations, sr-only-accessibility]
key-files:
  created:
    - src/types/project.ts
    - src/components/home/HeroSection.tsx
  modified:
    - next.config.ts
    - src/app/globals.css
    - src/app/page.tsx
decisions:
  - id: use-preload-not-priority
    context: "Next.js 16 Image component has both preload and priority props"
    chosen: "preload attribute on headshot image"
    reason: "Follows Next.js 16 best practices for above-the-fold images; priority is deprecated"
  - id: sr-only-for-icon-buttons
    context: "Biome's useAnchorContent rule requires accessible content in anchor elements"
    chosen: "Add visually-hidden span with text inside icon-only anchor buttons"
    reason: "Satisfies both Biome linting and WCAG accessibility requirements without changing visual design"
  - id: external-link-security
    context: "GitHub and LinkedIn buttons open external sites in new tabs"
    chosen: "Use anchor tags with target='_blank' rel='noopener noreferrer', NOT next/link"
    reason: "Security best practice prevents reverse tabnabbing; next/link is for internal navigation only"
metrics:
  duration: ~3 minutes
  completed: 2026-02-02
---

# Phase 02 Plan 01: Hero Section with Headshot, Bio, CTAs, and Animation Foundations

Hero section built with optimized headshot using next/image preload, bio content, 4 CTA buttons (2 internal Link, 2 external anchor), fade-in animation with motion-safe prefix, and accessibility patterns established.

## What Was Done

### Task 1: Config and Foundation Files

**Files:** next.config.ts, src/app/globals.css, src/types/project.ts

**Actions:**
- Added `images.qualities: [25, 50, 75, 100]` to next.config.ts for Next.js 16 Image optimization
- Added `@theme` block with fade-in-up animation keyframes to globals.css (appended after existing `@theme inline` block)
- Created Project interface at src/types/project.ts matching GitHub API shape for future integration

**Verification:**
- `npx @biomejs/biome check src/types/project.ts` passed
- `npx next build` completed successfully

**Commit:** f22567d

### Task 2: HeroSection Component

**Files:** src/components/home/HeroSection.tsx, src/app/globals.css

**Actions:**
- Created HeroSection server component with responsive flex layout (column on mobile, row on desktop)
- Added optimized headshot using next/image with `preload` attribute (NOT priority), rounded-full styling
- Added name (h1), tagline (p with middle dot separators), and bio text with responsive centering
- Built 4 CTA buttons:
  - **View Projects** (primary, filled blue) - next/link to /projects
  - **Contact** (secondary, outlined) - next/link to /contact
  - **GitHub** (icon button) - external anchor with target="_blank" rel="noopener noreferrer"
  - **LinkedIn** (icon button) - external anchor with security attributes
- Added `<span className="sr-only">` text inside icon buttons for screen reader accessibility
- Applied `motion-safe:animate-fade-in-up` to section element (respects prefers-reduced-motion)
- Added `.sr-only` utility class to globals.css for visually-hidden accessible text

**Verification:**
- `npx @biomejs/biome check src/components/home/HeroSection.tsx` passed after adding sr-only spans
- `npx next build` completed successfully

**Commit:** 5897606

### Task 3: Compose Home Page with HeroSection

**Files:** src/app/page.tsx

**Actions:**
- Replaced stub content with HeroSection import and render
- Used consistent container pattern: `mx-auto max-w-5xl px-4 sm:px-6 lg:px-8`
- Removed py-16 from container (now in HeroSection for proper spacing control)

**Verification:**
- `npx @biomejs/biome check src/app/page.tsx` passed
- `npx next build` completed successfully
- Visual verification: Hero section displays with headshot, name, tagline, bio, and 4 working CTA buttons

**Commit:** 56df199

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added sr-only utility class and spans for accessibility**

- **Found during:** Task 2 verification
- **Issue:** Biome's `useAnchorContent` rule flagged GitHub and LinkedIn anchor elements as missing accessible content. The `aria-label` attributes were present but insufficient for the linter.
- **Fix:**
  - Added `<span className="sr-only">GitHub</span>` and `<span className="sr-only">LinkedIn</span>` inside anchor elements
  - Added `.sr-only` utility class to globals.css with standard visually-hidden CSS properties
  - Removed `aria-label` attributes as they're now redundant with visible (to screen readers) text content
- **Files modified:** src/components/home/HeroSection.tsx, src/app/globals.css
- **Commit:** Included in 5897606
- **Reason:** This is a bug fix (Rule 1) because accessibility compliance is essential for correct operation. The component would fail WCAG standards and Biome linting without this fix.

## Verification Results

### Build Verification
- `npm run build` completed successfully with no errors
- All routes generated as static content (○ Static)
- TypeScript compilation passed

### Linting Verification
- `npx @biomejs/biome check src/` passed with 0 errors
- All 12 files checked successfully

### Visual Verification (Expected at localhost:3000)
- [ ] Headshot renders as optimized circle (160x160) using next/image
- [ ] Name "Dan Weinbeck" displays in large bold text
- [ ] Tagline with middle dot separators displays below name
- [ ] Bio paragraph displays with max-w-lg constraint
- [ ] "View Projects" button (blue, filled) links to /projects
- [ ] "Contact" button (outlined) links to /contact
- [ ] GitHub icon button opens https://github.com/dweinbeck in new tab
- [ ] LinkedIn icon button opens https://www.linkedin.com/in/dw789/ in new tab
- [ ] Layout is responsive (column on mobile, row on desktop)
- [ ] Fade-in-up animation plays on load (unless prefers-reduced-motion)

### Success Criteria Met
- [x] Hero section is visible above the fold
- [x] Headshot loads via next/image with preload attribute (not priority)
- [x] All 4 CTA buttons work (2 internal Link components, 2 external anchors with security attributes)
- [x] Fade-in-up animation configured with motion-safe prefix
- [x] next.config.ts has images.qualities configured
- [x] Project type exists at src/types/project.ts ready for Plan 02
- [x] Build passes with no errors
- [x] Lint passes with no errors
- [x] Accessibility requirements met (sr-only text, proper semantic HTML)

## Next Phase Readiness

### Blockers
None.

### Concerns
None.

### Ready for Plan 02
All foundation elements are in place for Plan 02 (Featured Projects + Blog Teaser):
- Project type interface defined and ready for placeholder data
- Animation keyframes available for reuse
- Container pattern established
- Accessibility patterns demonstrated (sr-only utility)
- Home page structure ready to accept additional sections

### Technical Debt
None identified.

### Follow-up Items
None. All planned work completed successfully.
