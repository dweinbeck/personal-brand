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
| 1 | | | | |
| 2 | | | | |

---

## 5. Envelopes (`/envelopes`)

> Pages: home, `/[envelopeId]` detail, `/analytics`, `/transactions`, `/demo`, `/demo/analytics`
> Components: EnvelopesHomePage, EnvelopeCardGrid, EnvelopeCard, EnvelopeDetailPage, CreateEnvelopeCard, EnvelopeForm, GreetingBanner, SavingsBanner, SummaryStats, EnvelopesNav, OverageModal, TransferModal, ReadOnlyBanner, TransactionsPage, TransactionList, TransactionRow, TransactionForm, InlineTransactionForm, IncomeEntryForm, IncomeBanner, KpiBox, WeeklyPivotTable, WeekSelector, StatusBadge, AnalyticsPage, SavingsChart, SpendingByEnvelopeChart, SpendingTrendChart, SpendingDistributionChart, IncomeVsSpendingChart, DonorAllocationRow

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

> Use this section for bigger-picture observations, architectural concerns, or ideas that don't fit a single bug/UI row.

### Testing Focus Areas — Multi-Area Feedback Fixes

**Brand Scraper (`/apps/brand-scraper`):**
- Old entries that were stuck "In Progress" should now show as viewable (with red dot) if >30 min old
- Submit button should say "Create Profile (X credits)" not "Scrape"
- History section header should say "Recent Brand Profiles" not "Recent Scrapes"
- Progress panel should say "Pages being analyzed" not "Pages being scraped"
- Click a logo thumbnail → lightbox should open with full-size image; click outside or press Escape to close
- Brand Identity section should show distinct sub-sections: Tagline, Industry badge, Typography list (all fonts, not just first)
- If zip download fails → should show "Retry Download" button and "or download the JSON instead" hint

**Research Assistant (`/tools/research-assistant`):**
- Complete a research query → click Reconsider → should NOT get stuck at "Connecting..." forever
- If connection fails, should show error state instead

**Building Blocks (`/building-blocks/frd` and `/building-blocks/custom-gpt`):**
- All text should say "Functional Requirements Document (FRD)" — no mentions of "PRD" anywhere

**Envelopes (`/envelopes`) — on dev.dan-weinbeck.com:**
- Check if data loads properly; if empty, Firestore indexes may need deploying

### Testing Focus Areas — Income Allocation Feature

**Envelopes Home (`/envelopes`):**
- Log extra income (via "Log Income" button) — IncomeBanner should appear below the envelope grid
- After logging income, "Allocate Income" button should appear in the action button row
- Click "Allocate Income" → modal opens with green "Available Income" banner showing correct amount
- Select an envelope from dropdown, enter amount, submit → envelope card's remaining budget should increase
- IncomeBanner should now show "Allocated: $X | Unallocated: $X" breakdown
- KeyMetricsCard "budget" figure should include allocated income
- Try allocating more than unallocated amount → should show server error "exceeds unallocated income"
- After allocating all income, "Allocate Income" button should disappear
- Verify allocations are week-scoped (don't carry over — check next week if possible)
- NOTE: Firestore index for `envelope_income_allocations` must be deployed first:
  `firebase deploy --only firestore:indexes --project <id>`

**Todoist (tasks.dan-weinbeck.com):**
- No question-mark help bubbles should be visible anywhere (sidebar, board toggle, sections, search, tags)
- Edit a task that has subtasks → subtasks should remain visible below the edit form
- Switch to Kanban view → refresh the page → should still be in Kanban view (persisted per project)
  - NOTE: requires `npx prisma db push` in todoist repo first

**Chatbot (chatbot on dan-weinbeck.com):**
- After re-sync: ask "What projects has Dan built?" → should return correct project names
  - NOTE: requires calling `POST /admin/sync-repo` after deploying the denylist change

### Testing Focus Areas — Brand Card Logos + Typography Fix

**Brand Scraper Result Card (`/apps/brand-scraper`):**
- **Logos:** Should render at 128px max height (was 64px). Broken image URLs should show a placeholder icon instead of invisible nothing.
- **Favicons:** New "Favicons" section should appear below Logos showing detected favicons at 64px max height.
- **Social Previews:** New "Social Previews" section should show OG images at 96px max height.
- **Empty state:** If no assets detected at all, shows "No assets detected" instead of "No logos detected".
- **Lightbox:** Click any asset (logo, favicon, or OG image) → full-size lightbox should still work.
- **Typography:** Each font entry should render its name **in the actual Google Font** with correct weight. System fonts show in default UI font. Loading/error states shown inline.
- **Tagline:** Tagline preview should still render in the primary Google Font (unchanged).
- **Tasks app:** Out of scope — separate repo/service at tasks.dan-weinbeck.com.

