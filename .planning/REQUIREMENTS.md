# Next Milestone Requirements

Collected page/feature descriptions for v1.1 planning.

---

## Projects Page

- Same background as the home page
- Headline: "Current and Past Projects"
- Shows the same project cards as the front page, but larger (2 across) to display more detail
- Each card includes:
  - Project name
  - One-paragraph description of the project and its goal
  - Topic / software / platform tags
  - Date initiated - Last commit
  - Public or Private designation
  - Large button linking to a project-specific page (to come later)

---

## Writing Page

- Title: "Writing"
- Subtitle: "Articles and Blog Posts by Dan"
- Same format and style cards as the Projects page, but with different components per card:
  - Article title
  - Publish date
  - Topic tag

---

## Contact Page (Redesign)

In less than 20 seconds, a visitor should be able to:
1. Email me (and copy address)
2. Send a message without friction (form) with abuse protection
3. See response expectations (reduces spam + increases legit outreach)
4. Trust me with their info (privacy/retention)

### Success Metrics

- Email clicks + copy events
- Form start → submit completion rate
- Spam rate / blocked submissions
- Median time-to-first-action (email click or form submit)

### Page Structure

#### 1) Hero: "How can I help?"

- **Headline:** "Contact Dan"
- **Subhead:** "Fastest is email. Form works too — I read everything."
- **Primary CTAs** (big buttons):
  - Email Dan (`mailto`)
  - Copy email
  - LinkedIn message
- **Microcopy** (trust + expectation):
  - "Typical reply: 1–2 business days."
  - "If it's urgent, put 'URGENT' in the subject."

#### 2) Form UX States

- Inline validation (email format, message min length)
- Clear success state: "Sent — thanks. I'll reply within X."
- Failure state: "Couldn't send right now. Please email me at …" (always include direct email fallback)
- Loading state with disabled button
- JS disabled: simple HTML form post still works (or show email-only fallback)

#### 3) Spam/Abuse Controls

- Honeypot field (hidden)
- Rate limit by IP (e.g., 5/hour)
- Server-side validation + length limits
- Block obvious prompt-injection content from being forwarded to assistant/logs

#### 4) "Other Ways to Reach Me" (Fast Links)

A clean section with labeled links:
- LinkedIn
- GitHub
- One line: "Prefer async? Email is best."

#### 5) Privacy & Retention

A short disclosure (not a wall of legal):
- "Messages are used only to respond."
- "Stored for up to X days for follow-up, then deleted." (pick a number; 30–90 days is reasonable for MVP)
- "Please don't send sensitive personal info."

### Ship-Gate Checklist

- [ ] Email visible + copy button + `mailto` works
- [ ] Clear response-time expectation
- [ ] Fallback when form fails
- [ ] Basic anti-spam (honeypot + rate limit)
- [ ] Privacy/retention note
- [ ] Works on mobile (single-column, big taps)
- [ ] Analytics events instrumented (copy, click, start, submit, error)
