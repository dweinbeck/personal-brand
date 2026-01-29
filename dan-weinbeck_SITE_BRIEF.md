# dan-weinbeck.com — Site Brief (Claude Code ready)

## Goals
- Give first-time visitors a fast, casual-but-professional understanding of who Dan is: skillset + interests
- Provide clear ways to engage: chatbot Q&A / site navigation, and obvious contact options
- Show proof-of-work: public GitHub repos and (later) richer case studies
- Serve as Dan’s personal home-base: AI assistant + organization for life and side-projects

## Audience
- Potential employers (link in resume)
- Current colleagues / professional network (share on LinkedIn)
- Friends (share for fun; possibly link from Instagram)
- Dan himself as a home-base + personal assistant hub (AI assistant built into the site to help organize life and manage side-projects)

## What a first-time visitor should do in 60 seconds
- Quickly understand who Dan is (professional skillset + personal interests) from a casual-but-professional summary.
- Discover and use a chatbot to ask questions about Dan and/or navigate the site
- View Dan's public GitHub repositories
- Find Dan's email address quickly for contact

## Required sections (v1)
- Home
- Projects
- Writing / Blog
- AI Assistant
- Contact

## Writing/Blog (v1)
- Stub (empty state + coming soon)

## Keywords
- Accomplished
- Self-taught AI Developer
- Analytics Professional
- Data Scientist

## Constraints
- Ship MVP in 24 hours
- Host on GCP Cloud Run; use Firestore + Cloud Storage
- Secure-by-default (least privilege, secret management, basic abuse protection)

## Tech preferences
- Framework: Next.js (TypeScript)
- Hosting: Cloud Run
- Data: Cloud Storage, Firestore
- Analytics: OK with Google Analytics
- Contact: email + Instagram + contact form (first-party endpoint on Cloud Run)

## Assets
- Headshot: /mnt/data/headshot.jpeg
- Resume: /mnt/data/Dan_Weinbeck_Resume.docx
- GitHub: https://github.com/dweinbeck
- LinkedIn: https://www.linkedin.com/in/dw789/

## Edge cases to handle
- Mobile/slow network: still readable; optimized images and fast initial render
- Chat assistant unavailable: show fallback message + email CTA
- Spam/abuse: contact form spam; prompt injection attempts; rate limiting
- JS disabled / GA blocked: site content still works; chatbot degrades gracefully
- 404/500: custom pages and safe navigation back home
- Chat logs retention/PII risk: avoid sensitive inputs; retention + deletion plan

## Success metrics (v1)
- Visitor can find: summary, GitHub, chatbot, and contact within 60 seconds
- Chatbot engagement: open + first message
- Contact intent: email clicks / form submissions
- Lighthouse >= 90 for Perf/A11y/Best/SEO
- Error rate < 0.1% on Cloud Run requests (basic monitoring)

## Home page wireframe (MVP)
┌─────────────────────────────────────────────────────────┐
│ Dan Weinbeck     Home  Projects  Writing  Assistant  Contact   [Ask Dan] │
└─────────────────────────────────────────────────────────┘

[ Headshot ]   Dan Weinbeck
              Self-taught AI developer • analytics pro • data scientist
              I build practical AI agents + data products that ship.
              Interests: experimentation, UX, automation, side projects.

              [ Ask Dan ]  [ View Projects ]  [ Email ]  [ GitHub ] [ LinkedIn ]

───────────────────────────────────────────────────────────
Proof of work
[Repo Card] [Repo Card] [Repo Card]
[Repo Card] [Repo Card] [Repo Card]
                         [See all projects →]

───────────────────────────────────────────────────────────
Writing
Coming soon… (Ask Dan what I’m working on)  [Ask Dan]

───────────────────────────────────────────────────────────
Contact
Email: dan@... (Copy)   LinkedIn   Instagram   Contact Form

