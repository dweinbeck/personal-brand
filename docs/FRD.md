# Functional Requirements Document: dan-weinbeck.com

## Goals

- Visitors understand who Dan is and see proof of his work within 60 seconds
- Project portfolio stays current automatically via GitHub API
- Contact options are clear and functional
- Site is fast, accessible, and SEO-friendly
- Foundation supports future AI assistant and blog content

## Non-Goals

- AI chatbot / assistant functionality (deferred to v2)
- Real-time features (WebSockets, live chat)
- Video content hosting
- Mobile app
- Custom analytics dashboard
- Multi-language support
- Comments system

## User Persona

**Dan Weinbeck** — Site owner
- Self-taught AI developer, analytics professional, and data scientist
- Wants a professional but approachable online presence
- GitHub: https://github.com/dweinbeck
- LinkedIn: https://www.linkedin.com/in/dw789/

**Visitors** — Primary audience
- Recruiters and hiring managers evaluating Dan's technical skills
- Collaborators and peers exploring open-source work
- General visitors wanting to get in touch
- Expected behavior: land on site, understand Dan's profile quickly, browse projects, optionally reach out

## Scenarios

### S1: First Impression
A recruiter clicks a link to dan-weinbeck.com. They see Dan's headshot, name, tagline, and a short bio above the fold. Within seconds they understand his role and expertise. CTA buttons guide them to projects or contact.

### S2: Exploring Projects
A visitor navigates to the Projects page. They see a responsive grid of project cards with descriptions, languages, and topic tags — all pulled live from GitHub. Each card links to the GitHub repo (and live demo if available). Data refreshes hourly via ISR.

### S3: Reading Tutorials
A visitor navigates to the Building Blocks section. They see a list of tutorials with titles and descriptions, then click into a full step-by-step guide rendered from MDX content.

### S4: Making Contact
A visitor fills out the contact form (name, email, message). The form validates client-side and server-side with Zod. A honeypot field and rate limiting block spam. On success, the submission is stored in Firestore. Alternatively, the visitor copies Dan's email or clicks social links.

### S5: Mobile Browsing
A visitor on a phone sees a hamburger menu. Tapping it reveals smooth navigation to all sections. All pages render correctly on mobile viewports. Images are optimized and load quickly.

### S6: Admin Sign-In
Dan clicks "Sign In" in the navbar. A Google sign-in popup appears. After authenticating with `daniel.weinbeck@gmail.com`, the button is replaced by a blue circle with his initial. A "Control Center" link appears in the navigation.

### S7: Admin Control Center
Dan navigates to the Control Center. He sees a grid of all GitHub repos (public and private) with names, last commit dates, and purposes extracted from READMEs. Below that, he sees Todoist project cards with task counts. Clicking a Todoist project shows a board view with tasks grouped by section.

## End-to-End Workflows

### Home Page Flow
`Land on site` -> `See hero (headshot, tagline, bio)` -> `Click CTA` -> `Navigate to Projects / Contact / GitHub / LinkedIn`

### Projects Flow
`Navigate to Projects` -> `Browse project cards (GitHub API data)` -> `Click card` -> `Open GitHub repo or live demo`

### Contact Flow
`Navigate to Contact` -> `Fill out form` -> `Submit` -> `See success message` (or) `Copy email / Click social link`

### Tutorial Flow
`Navigate to Building Blocks` -> `Browse tutorial list` -> `Click tutorial` -> `Read step-by-step guide`

### Admin Flow
`Click Sign In` -> `Google popup` -> `Authenticate` -> `See Control Center in nav` -> `Browse repos and Todoist projects` -> `Click Todoist project` -> `View task board`

## v1 Requirements

### Navigation
| ID | Requirement | Status |
|----|-------------|--------|
| NAV-01 | Responsive navbar with links to Home, Projects, Writing, Building Blocks, Assistant, Contact | Complete |
| NAV-02 | Mobile hamburger menu with smooth open/close | Complete |
| NAV-03 | Active page indicator in navigation | Complete |

### Home
| ID | Requirement | Status |
|----|-------------|--------|
| HOME-01 | Hero section with headshot, name, tagline, and short bio | Complete |
| HOME-02 | CTA buttons (View Projects, Contact, GitHub, LinkedIn) | Complete |
| HOME-03 | Featured project cards section (live GitHub data) | Complete |
| HOME-04 | Blog teaser section with link to Writing page | Complete |

### Projects
| ID | Requirement | Status |
|----|-------------|--------|
| PROJ-01 | Project cards from GitHub API with description, language, and topics | Complete |
| PROJ-02 | Responsive project grid across all screen sizes | Complete |
| PROJ-03 | Links to GitHub repo and live demo (if homepage URL set) | Complete |
| PROJ-04 | ISR caching of GitHub data (revalidate hourly) | Complete |

### Writing
| ID | Requirement | Status |
|----|-------------|--------|
| BLOG-01 | Stub page with coming soon message | Complete |

### AI Assistant
| ID | Requirement | Status |
|----|-------------|--------|
| ASST-01 | Placeholder page with coming soon message | Complete |

### Contact
| ID | Requirement | Status |
|----|-------------|--------|
| CONT-01 | Contact form with name, email, and message fields | Complete |
| CONT-02 | Server-side validation and spam protection (honeypot + rate limiting) | Complete |
| CONT-03 | Form submissions stored in Firestore | Complete |
| CONT-04 | Email address with click-to-copy | Complete |
| CONT-05 | Social links (LinkedIn, Instagram, GitHub) | Complete |

### Authentication & Admin
| ID | Requirement | Status |
|----|-------------|--------|
| AUTH-01 | Google Sign-In via Firebase Auth | Complete |
| AUTH-02 | Signed-in state shown as avatar circle in navbar | Complete |
| AUTH-03 | Sign-out dropdown menu | Complete |
| ADMIN-01 | Admin-only Control Center route (email guard) | Complete |
| ADMIN-02 | Control Center nav link visible only to admin | Complete |
| ADMIN-03 | GitHub repo cards (all repos, public + private) with name, last commit, purpose | Complete |
| ADMIN-04 | Todoist project cards with task counts | Complete |
| ADMIN-05 | Todoist board view (sections as columns, tasks as cards) | Complete |

### Design & Performance
| ID | Requirement | Status |
|----|-------------|--------|
| PERF-01 | Lighthouse >= 90 for Performance, Accessibility, Best Practices, SEO | Complete |
| PERF-02 | Mobile responsive across all pages | Complete |
| PERF-03 | Optimized images via Next.js Image component | Complete |
| PERF-04 | Subtle animations (page transitions, card hover effects) | Complete |

### SEO
| ID | Requirement | Status |
|----|-------------|--------|
| SEO-01 | Meta tags and Open Graph tags on all pages | Complete |
| SEO-02 | Generated sitemap.xml and robots.txt | Complete |
| SEO-03 | JSON-LD structured data (Person schema) | Complete |

### Infrastructure
| ID | Requirement | Status |
|----|-------------|--------|
| INFRA-01 | Deployed on GCP Cloud Run | Pending |
| INFRA-02 | Next.js standalone Docker build (< 150MB image) | Pending |
| INFRA-03 | Environment variables via Cloud Run / Secret Manager | Pending |
| INFRA-04 | Secure-by-default (no credential exposure, least privilege) | Pending |

## v2 Requirements (Planned)

| ID | Requirement |
|----|-------------|
| DESIGN-01 | Dark/light mode toggle |
| DESIGN-02 | Custom 404/500 error pages with branded design |
| ASST-02 | Conversational AI chatbot for portfolio exploration |
| ASST-03 | Answers questions about Dan's background, skills, and projects |
| ASST-04 | Site navigation assistance via chatbot |
| BLOG-02 | MDX-powered blog with content pages |
| BLOG-03 | Blog listing page with post previews |

## Coverage

- v1 requirements: 29 total
- Complete: 25
- Pending: 4 (Infrastructure — Phase 6)
