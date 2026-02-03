# Project Instructions

## Git Workflow

After each phase is complete, commit all changes and push to master.

## Documentation Maintenance

On every commit, review the diff of staged changes and update the following documentation files as needed. These updates must NOT affect any visible site content — only markdown documentation files should be modified.

### 1. `README.md`

Update if changes affect any of:
- Purpose or problem statement
- Who uses the site
- High-level workflow or architecture overview
- Success metrics
- Links to other documentation

### 2. `docs/FRD.md`

Update if changes affect any of:
- Goals or non-goals
- User persona or audience
- Scenarios and end-to-end user workflows
- Functional requirements (add new, update status, refine descriptions)

### 3. `docs/TECHNICAL_DESIGN.md`

Update if changes affect any of:
- System architecture or component hierarchy
- API contracts or server action signatures
- Data flows (GitHub API, Firestore, MDX)
- AI call structure (when added)
- Error handling patterns
- Integration points (Firebase, GitHub, external services)
- Architecture Decision Records (ADRs)
- Diagrams
- Data models
- Limitations or tradeoffs
