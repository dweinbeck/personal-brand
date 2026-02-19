# Testing Review — Personal Brand Site

> Snapshot of TESTING-FEEDBACK.md transferred on 2026-02-19.
> Use this as a reference for previously reported items and testing focus areas.

---

## Planning Notes (from previous phases)

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
