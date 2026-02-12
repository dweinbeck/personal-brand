# Requirements: dan-weinbeck.com

**Defined:** 2026-02-11
**Core Value:** Visitors can understand who Dan is and see proof of his work within 60 seconds

## v1.8 Requirements

Requirements for Tasks App integration milestone. Each maps to roadmap phases.

### Help Tips

- [ ] **TIPS-01**: User can see a gold "?" icon next to key UI elements that provides contextual help on hover or focus
- [ ] **TIPS-02**: HelpTip component is accessible (ARIA tooltip role, keyboard focus trigger, Escape to dismiss)
- [ ] **TIPS-03**: Help tip content is centralized in a catalog file for easy updates
- [ ] **TIPS-04**: Help tips render correctly on mobile (tap-to-toggle, max-width constraint, viewport-aware positioning)

### Effort Scoring

- [ ] **EFFORT-01**: User can assign an optional effort score (1, 2, 3, 5, 8, or 13) to any task
- [ ] **EFFORT-02**: User can see a visual effort selector when creating or editing a task
- [ ] **EFFORT-03**: User can see the sum of effort scores for all incomplete tasks in a section
- [ ] **EFFORT-04**: User can see the sum of effort scores for all incomplete tasks in a project
- [ ] **EFFORT-05**: Unscored tasks display distinctly (not as 0) and are excluded from rollup totals

### Multi-User + Auth

- [ ] **AUTH-01**: User can sign in to the todoist app via Google Sign-In (Firebase Auth, same project as personal-brand)
- [ ] **AUTH-02**: Each user's data is scoped by userId — users cannot see or modify other users' data
- [ ] **AUTH-03**: All Prisma queries include userId filter to prevent cross-user data leaks
- [ ] **AUTH-04**: Server derives userId from verified Firebase token — never accepts userId from client input

### Weekly Credit Gating

- [ ] **BILL-01**: User's first week of task management access is free (from first access timestamp)
- [ ] **BILL-02**: After the free week, user is charged 100 credits/week for read-write access
- [ ] **BILL-03**: When user has insufficient credits, app degrades to read-only mode (all data visible, writes disabled)
- [ ] **BILL-04**: Server returns 402 on all mutation endpoints when user is in read-only mode
- [ ] **BILL-05**: User sees a ReadOnlyBanner when in read-only mode with a "Buy Credits" CTA
- [ ] **BILL-06**: User sees a FreeWeekBanner during their free trial week explaining upcoming charges
- [ ] **BILL-07**: Billing check uses idempotency key (`tasks_week_<weekStart>`) to prevent double-charging
- [ ] **BILL-08**: `tasks_app` tool pricing entry exists in `billing_tool_pricing` Firestore collection

### Apps Integration

- [ ] **APPS-01**: Tasks app appears on the /apps page with correct metadata (title, description, tech stack)
- [ ] **APPS-02**: Tasks app entry links to the deployed todoist service URL
- [ ] **APPS-03**: Sitemap includes the tasks app entry

### Demo Workspace

- [ ] **DEMO-01**: Unauthenticated visitor can view a pre-populated demo workspace with 30-60 realistic tasks across 3-5 projects
- [ ] **DEMO-02**: Demo workspace showcases effort scores, subtasks, tags, and multiple project structures
- [ ] **DEMO-03**: Demo workspace runs entirely client-side with no database writes or API calls
- [ ] **DEMO-04**: Demo mode displays a persistent "DEMO" banner explaining data is temporary with CTA to sign up
- [ ] **DEMO-05**: All mutation UI elements are disabled or show feedback in demo mode (no silent failures)

### Testing

- [ ] **TEST-01**: Unit tests verify billing access check logic (enabled/disabled, free week, paid week, insufficient credits)
- [ ] **TEST-02**: Unit tests verify effort rollup computation (null handling, section sum, project sum)

## Future Requirements

Deferred to a later milestone. Tracked but not in current roadmap.

### Effort Scoring Enhancements

- **EFFORT-06**: User can see an effort distribution visualization (bar chart across sections)
- **EFFORT-07**: Effort badges appear in board view cards with column totals

### Demo Enhancements

- **DEMO-06**: User can keep demo workspace data after signing up and paying
- **DEMO-07**: Guided tour walks user through demo workspace features

### Billing Enhancements

- **BILL-09**: User can see their credit balance in the todoist app header
- **BILL-10**: User can view billing history for tasks app charges

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Todoist parity (filters, labels, NLP dates, reminders, collaboration) | Not needed for personal productivity tool |
| Stripe subscriptions for tasks | Pre-paid credits model is intentional |
| Per-task billing (charge per task created) | Discourages natural task creation behavior; weekly flat rate is better UX |
| Feature-tiered access (free basic, paid premium features) | App is simple enough that partial access feels broken |
| Embedding todoist as pages in personal-brand repo | Different databases and mutation patterns; keep as separate deployment |
| Prisma 7.x upgrade | Major version bump during feature work adds unnecessary risk |
| Real-time WebSocket updates | Single-user app, page revalidation sufficient |
| Drag-and-drop task reordering | Already uses manual ordering; DnD is a v2+ enhancement |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TIPS-01 | Phase 31 | Pending |
| TIPS-02 | Phase 31 | Pending |
| TIPS-03 | Phase 31 | Pending |
| TIPS-04 | Phase 31 | Pending |
| EFFORT-01 | Phase 32 | Pending |
| EFFORT-02 | Phase 32 | Pending |
| EFFORT-03 | Phase 32 | Pending |
| EFFORT-04 | Phase 32 | Pending |
| EFFORT-05 | Phase 32 | Pending |
| AUTH-01 | Phase 33 | Pending |
| AUTH-02 | Phase 33 | Pending |
| AUTH-03 | Phase 33 | Pending |
| AUTH-04 | Phase 33 | Pending |
| BILL-01 | Phase 34 | Pending |
| BILL-02 | Phase 34 | Pending |
| BILL-03 | Phase 34 | Pending |
| BILL-04 | Phase 34 | Pending |
| BILL-05 | Phase 34 | Pending |
| BILL-06 | Phase 34 | Pending |
| BILL-07 | Phase 34 | Pending |
| BILL-08 | Phase 34 | Pending |
| APPS-01 | Phase 34 | Pending |
| APPS-02 | Phase 34 | Pending |
| APPS-03 | Phase 34 | Pending |
| TEST-01 | Phase 34 | Pending |
| DEMO-01 | Phase 35 | Pending |
| DEMO-02 | Phase 35 | Pending |
| DEMO-03 | Phase 35 | Pending |
| DEMO-04 | Phase 35 | Pending |
| DEMO-05 | Phase 35 | Pending |
| TEST-02 | Phase 32 | Pending |

**Coverage:**
- v1.8 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0

---
*Requirements defined: 2026-02-11*
*Last updated: 2026-02-11 after roadmap creation*
