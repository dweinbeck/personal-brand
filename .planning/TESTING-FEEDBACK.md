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
| 1 | ui | M | Home | The "Free Trial Week" is fine but needs to have an x on the top right so I can dismiss it.  Make it dynamic so that it starts the clock from the day I sign up. Each time I open it, it should have the countdown: " Free trial week. You have X days left in your trial" It should not reappear on the project page after I've dismissed it.| 
| 2 | bug | H | Project Home | 

I need to be able to edit subtasks - right now all I can do is delete them.  I need to be able to add effort scores from the edit screen and change the sub-task names.  Title: Effort scoring w/ subtasks: keep parent as manual “budget” + show allocation + reconcile when over

Summary
Implement sprint-style effort scoring where the parent task effort remains a manual estimate (“budget”) even when subtasks have their own effort. Show subtask roll-up as an allocation indicator (e.g., 3/8 allocated) and provide an explicit reconcile action when subtasks exceed the parent.

Behavior: Parent task has an effort score (default manual/budget). Subtasks can each have their own effort score. Adding/editing subtasks does not automatically change the parent effort in manual mode. Show allocation in list + detail: Subtasks total = X, allocated: X / Parent: Y (or X/Y allocated)
If X < Y: show “Unallocated: (Y - X)” as a hint (non-warning).
If X > Y: show warning “Subtasks exceed task effort by (X - Y)” + explicit CTAs:
Update task effort to X
Keep task effort at Y (acknowledge over-budget)
Effort input UX
Show Fibonacci quick-picks (1,2,3,5,8,13…) for speed/ease.
ALSO provide a number input box for both tasks and subtasks so users can enter non-Fibonacci values.
Rationale: subtasks should not be forced to Fibonacci just to “add up” to the parent; user can keep parent as Fibonacci while using any numbers for subtasks (or vice versa).
UI notes
Task list row (collapsed subtasks): show N subtasks • X/Y allocated.
Task detail (expanded): show parent effort chip + allocation line; show over-budget warning state with buttons above.
Acceptance Criteria
Parent effort remains unchanged when subtasks are added/edited (manual mode).
Allocation indicator updates immediately as subtasks change.
Over-budget state appears only when sum(subtask effort) > parent effort and includes both CTAs.
Fibonacci quick-picks + numeric input box exist for tasks and subtasks.
Numeric input accepts integers (and optionally decimals if we support them—default to integers unless already decided).
| 3 | bug | M | Project Home| I need the ability to move tasks from one section to another by simply clicking and dragging them.  This option should always be avialble, I shouldn't need to be in edit mode. |
| 4 | UI | M | Project Home sidebar | I need an option for "Home" on the sidebar at all times to get back to my welcome page |
| 5 | UI | M | Sidebar | Get rid of all ? helper icons.  I'll add a demo later.  This goes for everywhere in the app |
| 6 | UI | H | I have added a file @~/.planning/focus-sprint-30d.tasks-import.json that has all of the tasks and subtasks I need.  Please update my personal tasks list (daniel.weinbeck@gmail.com) so these are here.
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

