# Testing Feedback — Personal Brand Site

> **For the user:** Fill in items as you test. Use the pre-built rows or add more.
> Each item has: **what's wrong / what you want**, and **priority** (H/M/L).
> Leave `Priority` blank if unsure — Claude will triage.
> Delete any empty sections before handing off.
> When done testing, run `/testing-feedback` to process your entries.

> **For Claude (workflow protocol):**
> When you finish processing feedback from this file (via `/testing-feedback` or after completing a phase):
> 1. **COPY** all filled-in feedback rows and Planning Notes to `.planning/TESTING-REVIEW.md` — append as a new dated section (e.g., `### Testing Focus Areas — [description] (transferred YYYY-MM-DD)`). Mark each item as `[FIXED]`, `[PARTIAL]`, or `[DEFERRED]`.
> 2. **RESET** this file back to its clean template state (empty rows, no filled-in data, no Planning Notes content) so it is ready for the next testing session.
> 3. **Never delete TESTING-REVIEW.md** — it is the permanent historical record of all prior feedback.

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

## 2. AI Assistant (Popup Widget)

> Components: ChatPopupWidget, ChatInterface, ChatInput, ChatMessage, ChatHeader, TypingIndicator, MarkdownRenderer, SuggestedPrompts, CitationList, ConfidenceBadge, FeedbackButtons, LeadCaptureFlow, HumanHandoff, PrivacyDisclosure

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## 3. Brand Scraper (`/apps/brand-scraper`)

> Pages: listing, `/[jobId]` detail, `/[jobId]/assets`
> Components: UserBrandScraperPage, BrandCard, BrandCardHeader, BrandCardColors, BrandCardLogos, BrandCardDescription, BrandCardDownloads, ScrapeProgressPanel, BrandProfileCards, BrandProfileCard, AssetGrid, AssetsPage

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## 4. Tasks (`/apps/tasks`)

> Pages: landing, `(authenticated)/[projectId]`, `today`, `completed`, `search`, `tags`, `tags/[tagId]`, `demo`, `demo/[projectId]`
> Components: TasksLandingPage, TasksKpiCard, task-card, task-form, section-header, subtask-list, board-view, sidebar, quick-add-modal, add-task-button, add-section-button, FreeWeekBanner, ReadOnlyBanner, BillingProvider, DemoBanner, DemoProvider, DemoSidebar

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## 5. Envelopes (`/envelopes`)

> Pages: home, `/[envelopeId]` detail, `/analytics`, `/transactions`, `/demo`, `/demo/analytics`, `/demo/transactions`
> Components: EnvelopesHomePage, EnvelopesNav, GreetingBanner, EnvelopeCardGrid, EnvelopeCard, CreateEnvelopeCard, EnvelopeDetailPage, EnvelopeForm, SummaryStats, KeyMetricsCard, SavingsBanner, IncomeBanner, OverageModal, TransferModal, IncomeAllocationModal, KpiWizardModal, ReadOnlyBanner, TransactionsPage, TransactionList, TransactionRow, TransactionForm, InlineTransactionForm, IncomeEntryForm, DonorAllocationRow, StatusBadge, AnalyticsPage, SavingsChart, SpendingByEnvelopeChart, SpendingTrendChart, SpendingDistributionChart, IncomeVsSpendingChart, WeeklyPivotTable, WeekSelector, KpiBox

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## 6. Research Assistant (`/tools/research-assistant`)

> Components: ResearchAssistantPage, ChatInterface, ResponseDisplay, ConversationHistory, FollowUpInput, CreditBalanceDisplay, ReconsiderButton, ReconsiderDisplay, ExportButton, CopyButton

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
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

## 8. Tools Page (`/tools`)

> Components: ToolsShowcase (home), tool cards

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

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
| 1 | | | | |
| 2 | | | | |

---

## 11. Control Center — Admin (`/control-center`)

> Pages: dashboard, `/billing`, `/billing/[uid]`, `/content`, `/content/new`, `/research-assistant`
> Components: ControlCenterNav, AdminBillingPage, AdminBillingUserDetail, TutorialEditor, UsageStats

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

> Use this section for bigger-picture observations, architectural concerns, or ideas that don't fit a single bug/UI row.

### Phase 1 Testing Focus — Brand Scraper Bug Fixes & UI Improvements

**Test after deploying to dev.** Changes need deployment since they include new API routes.

1. **Downloads** (`/apps/brand-scraper` → scrape a site → results page):
   - Click "Download Brand JSON" → should trigger a real file download (not open in new tab)
   - Click "Download Assets" → should trigger ZIP file download
   - Also test from the `/[jobId]/assets` page — same ZIP download button
2. **Color labels** (results page → Color Palette section):
   - First color should show "Primary", second "Secondary", third "Accent"
   - If the scraper already provides role labels, those should take precedence
3. **Credits removed**: Verify the "Balance: X credits" and "Cost per profile: 50 credits" line is gone from the brand scraper page
4. **Status text**: During a scrape, the status area should say "Checking for updates..." instead of "Polling..."
5. **White inputs**: All input boxes across the site should have white backgrounds (check brand scraper URL input, contact form, AI assistant input, etc.)
6. **Brand profile cards**: After the URL input, there should be a gold divider line, then "Your Brand Profiles" heading, then a 3-wide card grid showing each past brand scrape with its logo, color swatches, font names, and date
7. **Item 4 (3M scraper accuracy)**: This is an external scraper service issue — not fixable from this codebase. If you want this investigated, file it against the brand-scraper service repo.

