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
A recruiter clicks a link to dan-weinbeck.com. They see Dan's headshot, name in Playfair Display serif with a navy underline, gold-bordered tagline pills (AI Developer, Analytics Professional, Data Science Background, Curiosity Mindset), a bio paragraph, and social links. The navy/gold palette conveys confidence and sophistication. Within seconds they understand his role and expertise.

### S2: Exploring Projects (Home)
A visitor scrolls past the gold divider to the Featured Projects section. They see a responsive grid of 6 curated project cards with status badges (Live in gold, In Development in navy, Planning in burgundy), descriptions, and tech tags in JetBrains Mono. Cards lift on hover with the title shifting to gold.

### S2b: Browsing Projects Page
A visitor navigates to the Projects page. They see the headline "Current and Past Projects" with a dot-pattern background matching the home page. Below is a filter bar with tag chips and a sort dropdown. The 2-column grid of detailed project cards shows project name, a full paragraph description, topic/tech tags, date range (started and last updated), public/private badge, and a "View Project" button. The visitor filters by "AI" tag to see only AI-related projects, then sorts by "Newest first".

### S3: Reading Tutorials
A visitor navigates to the Building Blocks section. They see a list of tutorials with titles and descriptions, then click into a full step-by-step guide rendered from MDX content.

### S4: Making Contact
A visitor fills out the contact form (name, email, message). The form validates client-side and server-side with Zod. A honeypot field and rate limiting block spam. On success, the submission is stored in Firestore. Alternatively, the visitor copies Dan's email or clicks social links.

### S5: Mobile Browsing
A visitor on a phone sees a hamburger menu. Tapping it reveals smooth navigation to all sections. All pages render correctly on mobile viewports. Images are optimized and load quickly.

### S6: Admin Sign-In
Dan clicks "Sign In" (gold-bordered pill in the navbar). A Google sign-in popup appears. After authenticating with `daniel.weinbeck@gmail.com`, the button is replaced by a navy circle with gold border showing his initial. A "Control Center" link appears in the navigation.

### S7: Admin Control Center
Dan navigates to the Control Center. He sees a grid of all GitHub repos (public and private) with names, last commit dates, and purposes extracted from READMEs. Below that, he sees Todoist project cards with task counts. Clicking a Todoist project shows a board view with tasks grouped by section.

### S8: Exploring Writing
A visitor navigates to the Writing page. They see the title "Writing" with subtitle "Articles and Blog Posts by Dan" and a 2-column grid of article cards. Each card displays a topic badge (color-coded like project status badges), a Playfair Display title, a publish date, an excerpt, and a "Read More" link. Cards lift on hover with the title shifting to gold. Currently displays placeholder articles; real content deferred.

## End-to-End Workflows

### Home Page Flow
`Land on site` -> `See hero (headshot, serif name, tagline pills, bio, social links)` -> `Scroll past gold divider` -> `Browse 6 project cards with status badges` -> `See Writing teaser`

### Projects Flow
`Navigate to Projects` -> `See "Current and Past Projects" headline` -> `Filter by tag or sort by date` -> `Browse detailed project cards (name, description, tags, dates, visibility)` -> `Click "View Project" button (placeholder)`

### Contact Flow
`Navigate to Contact` -> `Fill out form` -> `Submit` -> `See success message` (or) `Copy email / Click social link`

### Tutorial Flow
`Navigate to Building Blocks` -> `Browse tutorial list` -> `Click tutorial` -> `Read step-by-step guide`

### Writing Flow
`Navigate to Writing` -> `See title and subtitle` -> `Browse article cards with topic badges, dates, excerpts`

### Admin Flow
`Click Sign In` -> `Google popup` -> `Authenticate` -> `See Control Center in nav` -> `Browse repos and Todoist projects` -> `Click Todoist project` -> `View task board`

## v1 Requirements

### Navigation
| ID | Requirement | Status |
|----|-------------|--------|
| NAV-01 | Responsive navbar with DW wordmark and links to Home, Projects, Writing, Building Blocks, Assistant, Contact | Complete |
| NAV-02 | Mobile hamburger menu with smooth open/close | Complete |
| NAV-03 | Active page indicator as navy pill with bold white text and gold border | Complete |
| NAV-04 | Sign In button styled as gold-bordered pill; signed-in avatar with gold border | Complete |

### Home
| ID | Requirement | Status |
|----|-------------|--------|
| HOME-01 | Hero section with headshot, Playfair Display name, tagline pills, bio, and social links | Complete |
| HOME-02 | Gold horizontal divider separating hero from projects | Complete |
| HOME-03 | Featured project cards section (6 static curated projects with status badges) | Complete |
| HOME-04 | Blog teaser section with gold left border and link to Writing page | Complete |

### Projects
| ID | Requirement | Status |
|----|-------------|--------|
| PROJ-01 | Curated project cards with name, description, tech tags, and status badges | Complete |
| PROJ-02 | Responsive project grid across all screen sizes (2-column on large screens) | Complete |
| PROJ-03 | Status badges: Live (gold), In Development (navy), Planning (burgundy #8B1E3F) | Complete |
| PROJ-04 | Each card shows full paragraph description | Complete |
| PROJ-05 | Each card shows topic/software/platform tags | Complete |
| PROJ-06 | Each card shows date initiated and last commit date | Complete |
| PROJ-07 | Each card shows public or private designation badge | Complete |
| PROJ-08 | Each card has "View Project" button linking to project-specific page (placeholder) | Complete |
| PROJ-09 | Page headline "Current and Past Projects" with dot-pattern background | Complete |
| PROJ-10 | Filter projects by tag (chip toggles) | Complete |
| PROJ-11 | Sort projects by date (newest, oldest, recently updated) | Complete |

### Writing
| ID | Requirement | Status |
|----|-------------|--------|
| WRIT-01 | Writing page displays with title "Writing" and subtitle "Articles and Blog Posts by Dan" | Complete |
| WRIT-02 | Article cards display in same format/style as Projects page cards | Complete |
| WRIT-03 | Each article card shows article title, publish date, and topic tag | Complete |
| WRIT-04 | Page renders with lorem ipsum placeholder articles (real content deferred) | Complete |

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
| PERF-04 | Subtle animations (fade-in-up, slide-up, card hover lift + gold title shift) | Complete |
| PERF-05 | Navy/gold founder aesthetic with Playfair Display, Inter, JetBrains Mono typography | Complete |

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

## v1.1 Requirements

### Branding Assets
| ID | Requirement | Status |
|----|-------------|--------|
| BRAND-01 | Branded OG image (1200x630) using Next.js ImageResponse API with navy/gold design | Complete |
| BRAND-02 | SVG favicon with "DW" text inside a gold rounded-corner square | Complete |
| BRAND-03 | Persistent gold underline accent on the "DW" logo in the navbar | Complete |

### Projects Page (Enhanced)
| ID | Requirement | Status |
|----|-------------|--------|
| PROJ-V11-01 | Detailed project cards in 2-across responsive grid with rich content | Complete |
| PROJ-V11-02 | Each card shows project name, paragraph description, tags, date range, visibility | Complete |
| PROJ-V11-03 | Each card has "View Project" button (placeholder link) | Complete |
| PROJ-V11-04 | Page headline "Current and Past Projects" with dot-pattern background | Complete |
| PROJ-V11-05 | Client-side filter by tag (chip toggles) and sort by date (dropdown) | Complete |

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

- v1 requirements: 34 total
- Complete: 30
- Pending: 4 (Infrastructure — Phase 6)
- v1.1 requirements: 8 total (3 branding + 5 projects)
- Complete: 8
