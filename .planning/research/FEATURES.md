# Features Research: Personal Developer Portfolio

## Table Stakes (Must have or visitors leave)

### Navigation & Structure
- **Clear navigation** across all sections — Complexity: LOW
- **Mobile responsive layout** — Complexity: MEDIUM
- **Fast load time** (< 3s) — Complexity: MEDIUM

### Hero / About
- **Professional headshot** — Complexity: LOW
- **Clear tagline / role description** — Complexity: LOW
- **Call-to-action buttons** (view projects, contact) — Complexity: LOW

### Projects / Portfolio
- **Project cards with descriptions** — Complexity: MEDIUM
- **Links to live demos / GitHub repos** — Complexity: LOW
- **Technology tags on projects** — Complexity: LOW
- Dependency: GitHub API integration

### Contact
- **Email address (visible or mailto link)** — Complexity: LOW
- **Social links** (LinkedIn, GitHub at minimum) — Complexity: LOW
- **Contact form** — Complexity: MEDIUM
- Dependency: Backend endpoint for form submission

### SEO & Meta
- **Open Graph tags** for social sharing — Complexity: LOW
- **Semantic HTML** — Complexity: LOW
- **Proper meta descriptions** per page — Complexity: LOW

### Accessibility
- **WCAG 2.1 AA compliance** — Complexity: MEDIUM
- **Keyboard navigable** — Complexity: LOW (if using semantic HTML)
- **Alt text on images** — Complexity: LOW

## Differentiators (Competitive advantage)

### GitHub API Integration
- **Auto-updating project cards from GitHub** — Complexity: MEDIUM
- **Featured/pinned project selection** — Complexity: LOW
- **Language/tech breakdown per repo** — Complexity: LOW
- This is Dan's key differentiator vs. static portfolios

### AI Assistant (Later Phase)
- **Conversational interface for exploring portfolio** — Complexity: HIGH
- **Answers questions about background/skills** — Complexity: HIGH
- Deferred to later phase

### Design Quality
- **Subtle animations / micro-interactions** — Complexity: MEDIUM
- **Consistent light + clean aesthetic** — Complexity: MEDIUM
- **Dark/light mode toggle** — Complexity: MEDIUM (nice-to-have)

### Blog (Future Content)
- **MDX-powered blog** — Complexity: MEDIUM
- Stub for v1, functional later

### Custom Error Pages
- **Branded 404/500 pages** — Complexity: LOW
- **Navigation back to safety** — Complexity: LOW

## Anti-Features (Do NOT build)

- **Complex CMS** — Overkill for personal site; GitHub API + MDX files cover content
- **User authentication** — No login needed for a public portfolio
- **Comments system** — Adds moderation burden, low value for personal site
- **Real-time features** — WebSocket complexity with no clear benefit
- **Video hosting** — Storage/bandwidth costs, use YouTube embeds if needed
- **Over-animated site** — Hurts performance and accessibility; keep motion subtle
- **Analytics dashboard** — Use Google Analytics or Plausible directly, don't build custom
- **Multi-language support** — English only is fine for Dan's audience

## Feature Dependencies

```
Navigation ──────────────> All pages
Hero/About ──────────────> Home page (standalone)
GitHub API ──────────────> Project cards ──> Projects page
Contact form ────────────> Backend endpoint ──> Contact page
SEO/Meta ────────────────> All pages
Blog stub ───────────────> Writing page (standalone)
AI placeholder ──────────> Assistant page (standalone)
```
