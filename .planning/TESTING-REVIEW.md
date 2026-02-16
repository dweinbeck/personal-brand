# Testing Feedback — Personal Brand Site

> **Instructions:** Fill in items as you test. Use the pre-built rows or add more.
> Each item has: **what's wrong / what you want**, and **priority** (H/M/L).
> Leave `Priority` blank if unsure — Claude will triage.
> Delete any empty sections before handing off.

---

## Legend

| Field | Values |
|-------|--------|
| **Type** | `bug` · `ui` · `feature` |
| **Priority** | `H` (blocking/ugly) · `M` (should fix) · `L` (nice to have) |
| **Where** | Page URL or component name — be as specific as possible |

---

## 1. Home Page (`/`)

> Components: HeroSection, AppsGrid, FeaturedBuildingBlocks, BuildingBlocksCta

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | bug | M | HeroSection | I want users to see more of my published apps before scrolling. so let's make the text column a little wider, bring the  image up so it's essentially aligned top with the top of Dan Weinbeck text, then bring the text to the left below the image for the second paragraph |
| 2 | bug | M | AppsGrid | We lost the technology tags we had below the Apps description.  Rewtore those.  If the cards need to be a little taller, that's fine.  Same goes for within the Apps site as well  |
| 3 | ui | L | AppsGrid | Get rid of the line "Sign Up or Sign in to Use them.  We don't need a subtitle here. Remove the subitle to the Building Blocks section as well, the title should be "Learn about AI Development with Building Block Tutorials |
| 4 | ui | M | FeaturedBuildingBlocks | Each building block should have the time it takes to go through them listed below the description but above the tags. Same goes for within the Building Blocks Home as well |
| 5 | ui | H | AppsGrid | Add a new section after the Apps Section that says "Explore Development Tools" and has all of the Tools from what's currently the CustomGPT section (see the Custom GPT feedback below before implementing this change) | 

---

## 2. AI Assistant (`/assistant`)

> Components: ChatInterface, ChatInput, ChatMessage, MarkdownRenderer, SuggestedPrompts, CitationList, ConfidenceBadge, FeedbackButtons, LeadCaptureFlow, HumanHandoff, ExitRamps

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | bug | H | ChatMessage | I asked Tell me about the most recent app Dan added to the site, and the response I got back was : No repositories have been indexed yet. Use POST /admin/sync-repo to sync a repository.  It should know about everything I have on my site and know which apps recetnly got added |
| 2 | | | | |
| 3 | | | | |

---

## 3. Brands (`/apps/brand-scraper`)

> Pages: listing, `/[jobId]` detail, `/[jobId]/assets`
> Components: UserBrandScraperPage, BrandCard (Header, Colors, Logos, Description, Downloads), ScrapeProgressPanel, ScrapeHistory, AssetGrid

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | bug | H | UserBrandScraperPage | I should be able to type in a URL and run it, but when I type in the URL, the Scrape button is still inactive and won't let me submit |
| 2 | bug | L | UserBrandScraperPage | Make the button the same height as the text input box to the left of it |
| 3 | | | | |

---

## 4. Envelopes (`/envelopes`)

> Pages: home, `/analytics`, `/transactions`
> Components: EnvelopeCardGrid, EnvelopeCard, TransactionForm, InlineTransactionForm, SummaryStats, SavingsChart, WeeklyPivotTable, AnalyticsPage, OverageModal

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## 5. Tasks (`/apps/tasks`)

> Landing page with auth guard and external app launch link

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
| 2 | | | | |

---

## 6. Research (`/tools/research-assistant`)

> Components: ResearchAssistantPage, ChatInterface, ResponseDisplay, ConversationHistory, FollowUpInput, CreditBalanceDisplay, ReconsiderButton, ExportButton, CopyButton

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | bug | H | ChatInterface | When I type in a question and hit research, it should run and return results.  Instead I get an error: curl 'https://dev.dan-weinbeck.com/api/tools/research-assistant/chat' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjRiMTFjYjdhYjVmY2JlNDFlOTQ4MDk0ZTlkZjRjNWI1ZWNhMDAwOWUiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRGFuaWVsIFdlaW5iZWNrIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0pwMkE5bC1XQUYtbTVraHdGdEsxc3Iyd3FTVy1ab3ZhWEM1T3J3NXhmUVZETzhGZz1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9wZXJzb25hbC1icmFuZC00ODYzMTQiLCJhdWQiOiJwZXJzb25hbC1icmFuZC00ODYzMTQiLCJhdXRoX3RpbWUiOjE3NzExNzUyODgsInVzZXJfaWQiOiJDOUxZZUNNNzQ0WGhzUnE0a3dscE5WaFBwMHAyIiwic3ViIjoiQzlMWWVDTTc0NFhoc1JxNGt3bHBOVmhQcDBwMiIsImlhdCI6MTc3MTE3NTI4OCwiZXhwIjoxNzcxMTc4ODg4LCJlbWFpbCI6ImRhbmllbC53ZWluYmVja0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjExNTc2NDA3NjYyNjA5NDcwMzYyNSJdLCJlbWFpbCI6WyJkYW5pZWwud2VpbmJlY2tAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.XvbxCIK0dXTFd6yHW6MYrjmGTyczPr0ppcx_OUNra1uJwD2sNgFwxZo0Kiv8KB0zppCBf4Mwr5qr27tZn5PL1eS0Ck1TQ8yzPqsfSUSQ0lDgn9NxP1W8g_u4YVdUODKAEEkCSpv6JYdkLLIdTLQ5T_AycBdnU9i78y_ohg7UD0MxxylEAqSE2poCvusiDUwPqI2DGXSOeMyUrnS-oq9wLqKFDIl5_LJ8sQGG1w7CZbddXKOQtYLKkBqwweJ3iwo_kaiDdShPu4hwFyXE1U6HbN0nNXsuP7fCaANpEt-t9NOFYdCNnsLzgBP6jmg02GfQ-Gs9t4fzfKQyhEiyYoIxCA' \
  -H 'content-type: application/json' \
  -H 'origin: https://dev.dan-weinbeck.com' \
  -H 'priority: u=1, i' \
  -H 'referer: https://dev.dan-weinbeck.com/tools/research-assistant' \
  -H 'sec-ch-ua: "Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36' \
  --data-raw '{"prompt":"Teach me everything I should know about Naltrexone","tier":"standard","action":"prompt"}' |
| 2 | bug | H | ConversationHistory | curl 'https://dev.dan-weinbeck.com/api/tools/research-assistant/conversations' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9,es-ES;q=0.8,es;q=0.7' \
  -H 'authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImY1MzMwMzNhMTMzYWQyM2EyYzlhZGNmYzE4YzRlM2E3MWFmYWY2MjkiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRGFuaWVsIFdlaW5iZWNrIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0pwMkE5bC1XQUYtbTVraHdGdEsxc3Iyd3FTVy1ab3ZhWEM1T3J3NXhmUVZETzhGZz1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9wZXJzb25hbC1icmFuZC00ODYzMTQiLCJhdWQiOiJwZXJzb25hbC1icmFuZC00ODYzMTQiLCJhdXRoX3RpbWUiOjE3NzEwMjc2MzIsInVzZXJfaWQiOiJDOUxZZUNNNzQ0WGhzUnE0a3dscE5WaFBwMHAyIiwic3ViIjoiQzlMWWVDTTc0NFhoc1JxNGt3bHBOVmhQcDBwMiIsImlhdCI6MTc3MTE4MjEyMywiZXhwIjoxNzcxMTg1NzIzLCJlbWFpbCI6ImRhbmllbC53ZWluYmVja0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjExNTc2NDA3NjYyNjA5NDcwMzYyNSJdLCJlbWFpbCI6WyJkYW5pZWwud2VpbmJlY2tAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.KVXqbBRzfO8IR5D8xe04ES8iY5BZKP3X6ebLcX6gThmbqHZDIhQL83zbcYtrJrx8PO8dGx-6wkPXn43hkZprd6sh2fwnDCgApYmtdO-M-vvCYImtk8PcwO9FyI0zlW6U8kE1X5C_4DlM2YWDy7fF5T6brb8ppcBKU0ZGQBii4grkKDdP_mFCTaArKFTqUvAr-Yewp34UBUQEBAqHCEV8uluf14hkwuYdcZYLVeX40IbOE4KVi_Z1Q-57BKRKcE0-CzTPOZq0gBCkE_zoCZz2n7NrV-Rbf-KAv7UAOfCC6zLAhs1PgyIUGths6bdN_PmxVTuDcwqGQHp0kbeaO-ENkA' \
  -H 'cache-control: no-cache' \
  -H 'pragma: no-cache' \
  -H 'priority: u=1, i' \
  -H 'referer: https://dev.dan-weinbeck.com/tools/research-assistant' \
  -H 'sec-ch-ua: "Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36' |
| 3 | | | | |

---

## 7. Billing (`/billing`)

> Pages: main, `/success`, `/cancel`
> Components: BillingPage, credit balance, Stripe checkout flow

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## 8. Building Blocks (`/building-blocks`)

> Pages: listing, `/[slug]` detail
> Components: TutorialCard, ArticleTabs (normal vs fast mode)

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | UI | M | /frd | The "Just Give me the building block" page should link to my actual FRD Generator now.  I also want it to be availble in the  |
| 2 | | | | |  
| 3 | | | | |

---

## 9. About & Contact (`/about`, `/contact`)

> Components: AccomplishmentCard, ContactForm, CopyEmailButton

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | ui | M | ContactForm | Get rid of the section at the bottom of the Contact Dan page that says "Other ways to contact me" and has links to github and linked in.  They have plenty of other places they can get that info |
| 2 | ui | L | ContactForm | All 3 buttons for Email Dan, copy email, etc, should be the same blue format with the glowing gold hover|
| 3 | | | | |

---

## 10. Custom GPTs (`/custom-gpts`)

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | feature | M | Home & /cust-gpts | I want this page to become a location where I can offer development tools, whether or not they're Custom GPTs.  Let's called it "Tools" and change it on the home page and everywhere in the code.  Then, reduce the cards to "New Phase Planner", "FRD Interviewer", and "FRD Generator".  The first two, since they're Custom GPTs, Should have Open Custom GPT written on their button.  The 3rd should have Open Tool.  The Title of the Page (not in the navbar, but in the Tools Homepage, should be "Development Tools", with the subtitle "Single-function resources for development efficiency." From here on out, anything built to help with development but that is single-function should go here.  Move Research out of apps and move it here. Move Envelopes out of Apps and Move it here.  |
| 2 | | | | |

---

## 11. Control Center — Admin (`/control-center`)

> Pages: dashboard, `/billing`, `/billing/[uid]`, `/brand-scraper`, `/content`, `/content/new`, `/research-assistant`, `/todoist/[projectId]`
> Components: ControlCenterNav, RepoCard, TodoistBoard, TutorialEditor, AdminBillingPage, UsageStats

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | bug | H | /brand-scraper | when i try to have it scrape a site, I get "Invalid or expired token" |
| 2 | UI | M | Control Center Home | I don't need the Brand Scraper as part of the control center.  Remove the link and the page, I'll access it through the apps |
| 3 | | | | |

---

## 12. Navigation & Layout (Global)

> Components: Navbar, NavLinks, AuthButton, Footer
> Applies to: all pages, responsive behavior, auth state

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | ui | M | Navbar | The Navbar order should now be: "Home", "Apps", "Tools", "Building Blocks", "Contact", "Control Cetner", "Ask my Assistant", "Sign in" / Account circle |
| 2 | ui | M | Navbar | I no longer want a standalone assistant box.  I want a Navbar title that says "Ask My Assistant" that when clicked opens the bottom-right chatbot popup with the text input some instructions "Ask my Assistant anything" with very small subtext that explains the privacy. The popup box should have an x on it that collapses it.  The conversation should persist during the session, but once the user closes the browswer and comes back, it should be a new session. |

---

## 13. Auth & Permissions (Global)

> Components: AuthGuard, AdminGuard, AuthContext
> Applies to: login/logout flow, protected routes, session handling

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
| 2 | | | | |

---

## 14. Cross-Cutting / Site-Wide

> For issues that don't fit a single page: performance, mobile responsiveness, accessibility, SEO, error handling, loading states, etc.

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## Planning Notes

> Optional: jot down any bigger-picture thoughts, patterns you noticed, or sequencing preferences (e.g., "fix all billing bugs before adding features").

-
-
-
