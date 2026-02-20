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
| 1 | ui | M | UserBrandScraperPage | Get rid of the ($0.50) after credits.  Never list the dollar price except for when they're purchasing credits |
| 2 | bug | M | AssetGrid | I queried transparent.partners, and you came back with 2 logos (good), but then there are 11 blank rectangles.  When I click on one of them, I get a tiny rounded rectangle that opens but I can't figure out what it is. If you only return 2 logos, get rid of all the other blank rectangles or make it clear what they are  |
| 3 | feature | M | AssetGrid | Make sure to label the secondary color too |
| 4 | bug | H | AssetGrid | When I click Download Brand JSON, it doesn't actually cause it to download it, it just opens it in a new window.  When I click Download Assets, it fails with "Zip creation failed (403)".  curl 'https://dev.dan-weinbeck.com/api/tools/brand-scraper/jobs/KQ98_Hp2AUgxsP9MdZ7RE/assets/zip' \
  -X 'POST' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9,es-ES;q=0.8,es;q=0.7' \
  -H 'authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImY1MzMwMzNhMTMzYWQyM2EyYzlhZGNmYzE4YzRlM2E3MWFmYWY2MjkiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRGFuaWVsIFdlaW5iZWNrIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0pwMkE5bC1XQUYtbTVraHdGdEsxc3Iyd3FTVy1ab3ZhWEM1T3J3NXhmUVZETzhGZz1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9wZXJzb25hbC1icmFuZC1kZXYtNDg3MTE0IiwiYXVkIjoicGVyc29uYWwtYnJhbmQtZGV2LTQ4NzExNCIsImF1dGhfdGltZSI6MTc3MTI4MTA3OCwidXNlcl9pZCI6IkxiYjRINzlkMnpVQVZKaW43NjByTHF4dXd0MzMiLCJzdWIiOiJMYmI0SDc5ZDJ6VUFWSmluNzYwckxxeHV3dDMzIiwiaWF0IjoxNzcxNTQ1NjQ1LCJleHAiOjE3NzE1NDkyNDUsImVtYWlsIjoiZGFuaWVsLndlaW5iZWNrQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTE1NzY0MDc2NjI2MDk0NzAzNjI1Il0sImVtYWlsIjpbImRhbmllbC53ZWluYmVja0BnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.KM_H80q9UbsLsJ4yzo5oHsVYUuY0NKCF_hXPY7Kjog4JuuJs1ovSjdztdvhXiRlNZDn6hbyQ6ZmdZR2RyRr7XhnkKJe5ix_mN00tV-EujK1x5RzgWCtjTfjhCY3LvPCtgV6Su2Xif1VNqJQHHfC2mNRnNAZNMgS0yAeV2t1cdgoEVv6d3KlFSu0hAANihgpEoRs5DbXeG_sBDJ1tSyqHs-2WOaA99gAgOGSU0qgsoZsNH-4q6_jpN3G8oVH6otL_YOJrhygpXTRUBPQFFtnDN2k7TOvnScZmR5AdQp5ZkzrkFVJyPjKAlrBjrlJeHKqe1iAZDf4vxnGedrM7rBrnfQ' \
  -H 'cache-control: no-cache' \
  -H 'content-length: 0' \
  -b '__session=eyJhbGciOiJSUzI1NiIsImtpZCI6ImY1MzMwMzNhMTMzYWQyM2EyYzlhZGNmYzE4YzRlM2E3MWFmYWY2MjkiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRGFuaWVsIFdlaW5iZWNrIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0pwMkE5bC1XQUYtbTVraHdGdEsxc3Iyd3FTVy1ab3ZhWEM1T3J3NXhmUVZETzhGZz1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9wZXJzb25hbC1icmFuZC1kZXYtNDg3MTE0IiwiYXVkIjoicGVyc29uYWwtYnJhbmQtZGV2LTQ4NzExNCIsImF1dGhfdGltZSI6MTc3MTI4MTA3OCwidXNlcl9pZCI6IkxiYjRINzlkMnpVQVZKaW43NjByTHF4dXd0MzMiLCJzdWIiOiJMYmI0SDc5ZDJ6VUFWSmluNzYwckxxeHV3dDMzIiwiaWF0IjoxNzcxNTQ1NjQ1LCJleHAiOjE3NzE1NDkyNDUsImVtYWlsIjoiZGFuaWVsLndlaW5iZWNrQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTE1NzY0MDc2NjI2MDk0NzAzNjI1Il0sImVtYWlsIjpbImRhbmllbC53ZWluYmVja0BnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.KM_H80q9UbsLsJ4yzo5oHsVYUuY0NKCF_hXPY7Kjog4JuuJs1ovSjdztdvhXiRlNZDn6hbyQ6ZmdZR2RyRr7XhnkKJe5ix_mN00tV-EujK1x5RzgWCtjTfjhCY3LvPCtgV6Su2Xif1VNqJQHHfC2mNRnNAZNMgS0yAeV2t1cdgoEVv6d3KlFSu0hAANihgpEoRs5DbXeG_sBDJ1tSyqHs-2WOaA99gAgOGSU0qgsoZsNH-4q6_jpN3G8oVH6otL_YOJrhygpXTRUBPQFFtnDN2k7TOvnScZmR5AdQp5ZkzrkFVJyPjKAlrBjrlJeHKqe1iAZDf4vxnGedrM7rBrnfQ' \
  -H 'origin: https://dev.dan-weinbeck.com' \
  -H 'pragma: no-cache' \
  -H 'priority: u=1, i' \
  -H 'referer: https://dev.dan-weinbeck.com/apps/brand-scraper' \
  -H 'sec-ch-ua: "Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'

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
| 1 | bug | M | BuildingBlock Slug | The FRD Generator linked to within the "Just give me the building block" should go to dev.dan-weinbeck.com/tools/frd-generator which is a standalone app from @~/ai/frd-generator.  Ask me questions if this needs context |
| 2 | | | | |
| 3 | | | | |

---

## 8. Tools Page (`/tools`)

> Components: ToolsShowcase (home), tool cards

| # | Type | Priority | Where | Description |
|---|------|----------|-------|-------------|
| 1 | UI | L | home | In the page subtitle, actually spell out the word development |
| 2 | bug | M | home | The FRD Generator should go to dev.dan-weinbeck.com/tools/frd-generator which is a standalone app from @~/ai/frd-generator.  Ask me questions if this needs context |
| 3 | UI | M | Change the wording on each button depending on what the tool is.  If it's a custom GPT (New Phase Planner and FRD Interviewer) then say "Open Custom GPT".  If it's a standalone app, say "Open App" |

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

