---
phase: 06-infrastructure-and-deploy
plan: 02
subsystem: infra
tags: [gcp, cloud-run, cloud-build, artifact-registry, deployment, docker, security]

# Dependency graph
requires:
  - phase: 06-01
    provides: Dockerfile with multi-stage build, non-root user, ADC-aware firebase.ts
provides:
  - Parameterized deploy script for one-command GCP Cloud Run deployment
  - Least-privilege service account setup (roles/datastore.user only)
  - Cloud Build integration for remote Docker image building
  - Domain mapping to dan-weinbeck.com with SSL auto-provisioning
  - Comprehensive env var documentation for local + production
affects: [future-deployments, ci-cd, production-operations]

# Tech tracking
tech-stack:
  added: [gcloud CLI, Cloud Build, Cloud DNS]
  patterns:
    - "Parameterized bash deployment script"
    - "Cloud Build for serverless Docker builds"
    - "ADC for credential-less production auth"
    - "Dedicated service account per service (least privilege)"

key-files:
  created:
    - scripts/deploy.sh
  modified:
    - .env.local.example

key-decisions:
  - "Use Cloud Build instead of local Docker build (no Docker installed locally)"
  - "Enable cloudbuild.googleapis.com API alongside run and artifactregistry"
  - "Map custom domain dan-weinbeck.com via Cloud Run domain mapping and Cloud DNS"
  - "No Secret Manager needed - ADC handles all Firebase auth via service account"

patterns-established:
  - "Single-command deployment: ./scripts/deploy.sh PROJECT_ID [REGION]"
  - "Cloud Build pattern: gcloud builds submit --tag IMAGE_URI"
  - "Idempotent resource creation with 2>/dev/null || echo already exists"
  - "Dedicated service account per Cloud Run service with minimal IAM roles"

# Metrics
duration: 8min
completed: 2026-02-03
---

# Phase 6 Plan 2: Deploy Script and Production Deployment Summary

**One-command GCP Cloud Run deployment with Cloud Build, custom domain (dan-weinbeck.com), and least-privilege service account - site live at https://dan-weinbeck.com**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-03T17:45:00Z
- **Completed:** 2026-02-03T17:53:00Z
- **Tasks:** 2 (1 auto task + 1 verification checkpoint)
- **Files modified:** 2

## Accomplishments
- Created parameterized deployment script (scripts/deploy.sh) for full GCP Cloud Run automation
- Deployed site successfully to Cloud Run with custom domain dan-weinbeck.com
- Configured Cloud DNS with A and AAAA records pointing to Cloud Run
- SSL certificate auto-provisioned and active
- Least-privilege service account (cloudrun-site) with only roles/datastore.user for Firestore
- Updated .env.local.example with clear local vs production documentation

## Task Commits

Each task was committed atomically:

1. **Task 1: Deploy script and env var documentation** - `423b146` (feat)

**Plan metadata:** (to be committed after this summary)

## Files Created/Modified
- `scripts/deploy.sh` - Parameterized bash script for one-command Cloud Run deployment with Cloud Build
- `.env.local.example` - Updated with local dev and production env var documentation

## Decisions Made

**Use Cloud Build instead of local Docker:**
- Docker not installed locally (blocker for local build)
- Cloud Build provides serverless Docker image building
- Changed from `docker build` + `docker push` to `gcloud builds submit --tag`
- Removed Docker auth configuration step (not needed with Cloud Build)

**Enable cloudbuild.googleapis.com API:**
- Added to required APIs list in deploy script
- Required for `gcloud builds submit` command

**Map custom domain via Cloud Run:**
- Created domain mapping for dan-weinbeck.com
- Added A and AAAA records to Cloud DNS zone
- SSL certificate provisioned automatically by Cloud Run
- Site accessible at https://dan-weinbeck.com (not just *.run.app URL)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Changed from local Docker build to Cloud Build**
- **Found during:** Task 1 (deploy script creation)
- **Issue:** Docker not installed locally - local `docker build` and `docker push` would fail
- **Fix:** Used `gcloud builds submit --tag IMAGE_URI` for remote Docker image building via Cloud Build
- **Files modified:** scripts/deploy.sh
- **Verification:** Deploy script successfully builds and pushes image to Artifact Registry
- **Committed in:** 423b146 (Task 1 commit)

**2. [Rule 3 - Blocking] Added cloudbuild.googleapis.com to enabled APIs**
- **Found during:** Task 1 (deploy script creation)
- **Issue:** Cloud Build API not in original plan's API list - `gcloud builds submit` would fail
- **Fix:** Added `cloudbuild.googleapis.com` to `gcloud services enable` command
- **Files modified:** scripts/deploy.sh
- **Verification:** Deploy script enables API before attempting Cloud Build
- **Committed in:** 423b146 (Task 1 commit)

**3. [Rule 3 - Blocking] Removed Docker auth configuration**
- **Found during:** Task 1 (deploy script creation)
- **Issue:** Plan included `gcloud auth configure-docker` step, but Cloud Build doesn't need local Docker auth
- **Fix:** Removed step #4 (Docker auth) from deploy script
- **Files modified:** scripts/deploy.sh
- **Verification:** Cloud Build works without Docker auth configuration
- **Committed in:** 423b146 (Task 1 commit)

**4. [Rule 2 - Missing Critical] Added custom domain mapping and DNS configuration**
- **Found during:** Task 2 (deployment verification)
- **Issue:** Site deployed but only accessible via *.run.app URL - custom domain needed for production
- **Fix:** Created domain mapping via Cloud Run console and added A/AAAA records to Cloud DNS zone
- **Files modified:** Cloud Run service configuration, Cloud DNS zone (not in repo)
- **Verification:** Site accessible at https://dan-weinbeck.com with valid SSL certificate
- **Impact:** Not included in deploy script (one-time manual setup), but documented for future reference

---

**Total deviations:** 4 auto-fixed (3 blocking, 1 missing critical)
**Impact on plan:** All deviations necessary to handle local environment constraints (no Docker) and complete production deployment (custom domain). Cloud Build approach is actually superior for CI/CD - no local Docker daemon needed. No scope creep.

## Deployment Verification

**Checkpoint results (Task 2):**
- ✅ Site deployed successfully to Cloud Run
- ✅ Service accessible at https://dan-weinbeck.com
- ✅ SSL certificate provisioned and active (Let's Encrypt)
- ✅ DNS resolves correctly (A and AAAA records in Cloud DNS)
- ✅ Home page loads with all content and styling
- ✅ Navigation works across all pages
- ✅ Contact form functional (Firestore writes via ADC)
- ✅ Service account has only roles/datastore.user (verified in IAM)
- ✅ No credentials exposed in code or environment

## User Setup Required

None - deployment completed successfully. The deploy script is parameterized and ready for future use.

**For future deployments:** Run `./scripts/deploy.sh <GCP_PROJECT_ID> [REGION]`

## Next Phase Readiness

Phase 6 complete. All infrastructure and deployment requirements satisfied:
- ✅ Docker multi-stage build with non-root user (06-01)
- ✅ Standalone Next.js output configuration (06-01)
- ✅ Firebase ADC integration for Cloud Run (06-01)
- ✅ Parameterized deployment script (06-02)
- ✅ Least-privilege service account (06-02)
- ✅ Production deployment with custom domain (06-02)
- ✅ SSL certificate auto-provisioned (06-02)

**Site is live at https://dan-weinbeck.com**

### Blockers/Concerns

None. All deployment infrastructure is functional and the site is live in production.

### Future Enhancements

Potential improvements not in current scope:
- Add CI/CD pipeline (GitHub Actions calling deploy script on push to master)
- Add Cloud Run revision tagging for rollback capability
- Add Cloud Monitoring alerts for service health
- Add Cloud Armor for DDoS protection (overkill for personal site)

---
*Phase: 06-infrastructure-and-deploy*
*Completed: 2026-02-03*
