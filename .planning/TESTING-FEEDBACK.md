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

> Components: HeroSection, AppsGrid, ToolsShowcase, FeaturedBuildingBlocks, BuildingBlocksCta, BlogTeaser

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## 2. AI Assistant (`/assistant`)

> Components: ChatInterface, ChatInput, ChatMessage, ChatHeader, ChatPopupWidget, TypingIndicator, MarkdownRenderer, SuggestedPrompts, CitationList, ConfidenceBadge, FeedbackButtons, LeadCaptureFlow, HumanHandoff, ExitRamps, PrivacyDisclosure

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## 3. Brand Scraper (`/apps/brand-scraper`)

> Pages: listing, `/[jobId]` detail, `/[jobId]/assets`
> Components: UserBrandScraperPage, BrandCard, BrandCardHeader, BrandCardColors, BrandCardLogos, BrandCardDescription, BrandCardDownloads, ScrapeProgressPanel, ScrapeHistory, AssetGrid, AssetsPage

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## 4. Tasks (`/apps/tasks`)

> Components: TasksLandingPage

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | bug | M | Tasks sidebar | The bubbles that come up when you click on the question marks seems to be hidding behind other things.  The top one is cut off on the right side, the bottom one is cut off on top |
| 2 | ui | M | View | It should remember the view that the user last clicked on (Kanban or List) so that if a user prefers one view that becomes his default |

---

## 5. Envelopes (`/envelopes`)

> Pages: home, `/analytics`, `/transactions`
> Components: EnvelopesHomePage, EnvelopeCardGrid, EnvelopeCard, CreateEnvelopeCard, EnvelopeForm, GreetingBanner, SavingsBanner, SummaryStats, EnvelopesNav, OverageModal, ReadOnlyBanner, TransactionsPage, TransactionList, TransactionRow, TransactionForm, InlineTransactionForm, WeeklyPivotTable, WeekSelector, StatusBadge, AnalyticsPage, SavingsChart, DonorAllocationRow

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | bug | M | EnvelopesHomePage | I have no way to adjust a card's budget.  I can only delete it, but then that gets rid of all the transactions too.  Make the budget a field that is available to edit when in the Editing mode |
| 2 | | | | |
| 3 | | | | |

---

## 6. Research Assistant (`/tools/research-assistant`)

> Components: ResearchAssistantPage, ChatInterface, ResponseDisplay, ConversationHistory, FollowUpInput, CreditBalanceDisplay, ReconsiderButton, ReconsiderDisplay, ExportButton, CopyButton

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 |bug | H | ResponseDisplay | Everything was working well and the responses were streaming and then we got a 500 error: 5110906506a766b5.js:1 Credit balance listener error: FirebaseError: Missing or insufficient permissions.
(anonymous) @ 5110906506a766b5.js:1Understand this error
inpage.js:1 Uncaught (in promise) i: Failed to connect to MetaMask
    at Object.connect (inpage.js:1:63510)
    at async s (inpage.js:1:61013)Caused by: Error: MetaMask extension not found
    at inpage.js:1:57963Understand this error
aebc3b6d791f68d2.js:1 TypeError: Cannot read properties of undefined (reading 'toLocaleString')
    at F (5110906506a766b5.js:1:21722)
    at av (aebc3b6d791f68d2.js:1:63230)
    at oY (aebc3b6d791f68d2.js:1:83503)
    at io (aebc3b6d791f68d2.js:1:94935)
    at sc (aebc3b6d791f68d2.js:1:137956)
    at aebc3b6d791f68d2.js:1:137801
    at ss (aebc3b6d791f68d2.js:1:137809)
    at u9 (aebc3b6d791f68d2.js:1:133734)
    at sV (aebc3b6d791f68d2.js:1:159329)
    at MessagePort.O (aebc3b6d791f68d2.js:1:8295)
d @ aebc3b6d791f68d2.js:1Understand this error
69487a961c0d369d.js:1 [Error Boundary] Object |
| 2 | | | | |
| 3 | | | | |

---

## 7. Building Blocks (`/building-blocks`)

> Pages: listing, `/[slug]` detail
> Components: TutorialCard, ArticleTabs, FeaturedBuildingBlocks

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## 8. Custom GPTs (`/custom-gpts`)

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
| 2 | | | | |

---

## 9. About & Contact (`/about`, `/contact`)

> Components: AccomplishmentCard, ContactForm, CopyEmailButton, EmailDanButton, SubmitButton

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## 10. Billing (`/billing`)

> Pages: main, `/success`, `/cancel`
> Components: BillingPage

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | bug | H | main | In Billing Management in the Control center, user "daniel.weinbeck@gmail.com" is listed twice and has different numbers of credits.  One user should never be in the system twice.  Please consolidate into one account and never allow this to happen in the future |
| 2 | | | | |

---

## 11. Control Center — Admin (`/control-center`)

> Pages: dashboard, `/billing`, `/billing/[uid]`, `/content`, `/content/new`, `/research-assistant`, `/todoist/[projectId]`
> Components: ControlCenterNav, AdminBillingPage, AdminBillingUserDetail, TutorialEditor, UsageStats, TodoistBoard, TodoistProjectCard, RepoCard

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## 12. Navigation & Layout (Global)

> Components: Navbar, NavLinks, AuthButton, Footer

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
| 2 | | | | |

---

## 13. Auth & Permissions (Global)

> Components: AuthGuard, AdminGuard, AuthContext

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

> Phase 40.1 just shipped. Here's what to test:

**Envelopes (`/envelopes`):**
- Click "Edit Cards" — each card should now show BOTH a pencil (edit) icon and an X (delete) icon
- Click the pencil icon — the form should open pre-filled with the envelope's current title, budget, and rollover setting
- Change the budget and save — the card should update immediately
- Click an envelope card in NORMAL mode (not edit mode) — it should navigate to `/envelopes/{id}` detail page
- Detail page should show: envelope name, status badge, budget summary, current-week transactions
- "Add Transaction" on the detail page should have the envelope pre-selected and hidden
- Back link should return to `/envelopes`

**Research Assistant (`/tools/research-assistant`):**
- Run a research query — token usage display should show numbers (not crash)
- If Firestore permissions expire mid-session, the page should NOT crash (credit balance stays at last known value)

**Billing Admin (`/control-center/billing`):**
- Check if duplicate email entries show a yellow "Duplicate" badge
- Test the "Consolidate" button — it should merge credits and remove the duplicate entry

**General:**
- Run `npm run dev` and navigate between pages — no console errors expected
