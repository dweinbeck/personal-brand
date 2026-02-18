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
| 1 | bug | M | ChatMessage | One of the 4 starter questions (What Projects has Dan built?) comes back with incorrect answers.  It should only pull from what's currently published on my site |
| 2 | ui | M | ChatInterface | Get rid of the instructions at the bottom (Press Enter...) |
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
| 1 | 
| 2 |
---

## 5. Envelopes (`/envelopes`)

> Pages: home, `/analytics`, `/transactions`
> Components: EnvelopesHomePage, EnvelopeCardGrid, EnvelopeCard, CreateEnvelopeCard, EnvelopeForm, GreetingBanner, SavingsBanner, SummaryStats, EnvelopesNav, OverageModal, ReadOnlyBanner, TransactionsPage, TransactionList, TransactionRow, TransactionForm, InlineTransactionForm, WeeklyPivotTable, WeekSelector, StatusBadge, AnalyticsPage, SavingsChart, DonorAllocationRow

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | bug | M | EnvelopesHomePage | I have no way to adjust a card's budget.  I can only delete it, but then that gets rid of all the transactions too.  Make the budget a field that is available to edit when in the Editing mode |
| 2 | UI | M | OverageModal | When I need to Transfer funds, the Select target options should also have the balances displayed so I know how much I need to transfer.  I don't need the optional note input |
| 3 | UI | M | Envelopes Home Page | After the "Week of ..." text, place the next three buttons all in the same line: Edit Cards, Transfer Funds, Add Transaction |

---

## 6. Research Assistant (`/tools/research-assistant`)

> Components: ResearchAssistantPage, ChatInterface, ResponseDisplay, ConversationHistory, FollowUpInput, CreditBalanceDisplay, ReconsiderButton, ReconsiderDisplay, ExportButton, CopyButton

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | bug | H | ResponseDisplay | The text is now formatted correctly (no longer showing the markdown syntax), but it's basicallly unreadable.  Use the same colors as the rest of the website
| 2 | UI | M | ResponseDisplay | I don't understand what the extra "Previous Response" section is at the bottom after the side-by-side responses display.  Get rid of it |
| 3 | bug | M | ConversationHistory | The sidebar doesn't seem to do anything.  I should be able to click on a conversation, have it load the original promopt and the responses as though I'm still working on it |

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
| 1 | 
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
