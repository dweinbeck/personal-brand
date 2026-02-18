# Deployment Guide

## Overview

The site is deployed as a Docker container on **GCP Cloud Run**. The build uses Next.js standalone output for minimal image size.

---

## Environment Variables

### Build-Time Variables (Public)

These are baked into the client bundle during build:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain (e.g., `project-id.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |

### Runtime Variables (Server-Side)

These are used by API routes at runtime:

| Variable | Description |
|----------|-------------|
| `CHATBOT_API_URL` | URL for the external FastAPI RAG backend |
| `BRAND_SCRAPER_API_URL` | URL for the external Brand Scraper service |
| `GITHUB_TOKEN` | GitHub personal access token (for repo data) |
| `STRIPE_SECRET_KEY` | Stripe secret key (via Secret Manager on Cloud Run) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (via Secret Manager on Cloud Run) |

### Firebase Admin (Local Development Only)

On Cloud Run, Firebase Admin SDK uses Application Default Credentials (ADC) automatically. For local development, set these:

| Variable | Description |
|----------|-------------|
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `FIREBASE_PRIVATE_KEY` | Service account private key (with `\n` for newlines) |

---

## Local Development

```bash
# Install dependencies
npm install

# Create .env.local with required variables
cp .env.example .env.local  # (or create manually)

# Start dev server
npm run dev
```

---

## Docker Build (Local)

```bash
# Build the image
docker build \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=your-key \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project \
  -t dan-weinbeck-site .

# Run locally
docker run -p 3000:3000 \
  -e CHATBOT_API_URL=https://your-fastapi-service-url.run.app \
  -e GITHUB_TOKEN=your-github-token \
  dan-weinbeck-site
```

---

## Cloud Build & Deploy

### Trigger Setup

Cloud Build is triggered automatically on push to `master`. The `cloudbuild.yaml` builds the Docker image and pushes to Artifact Registry.

### Substitution Variables

Configure these in Cloud Build trigger settings:

| Variable | Description |
|----------|-------------|
| `_IMAGE_URI` | Full Artifact Registry image path |
| `_NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `_NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |

### Cloud Run Configuration

Runtime environment variables are set in Cloud Run service settings (not in cloudbuild.yaml):

- `CHATBOT_API_URL`
- `GITHUB_TOKEN`
The service uses ADC for Firebase Admin SDK—no credentials needed if the Cloud Run service account has Firestore access.

---

## Build Pipeline

```
Push to master
    │
    ▼
Cloud Build Trigger
    │
    ▼
Docker multi-stage build (Dockerfile)
    │   1. Install dependencies (node:20-alpine)
    │   2. Build Next.js (standalone output)
    │   3. Create minimal production image
    │
    ▼
Push to Artifact Registry
    │
    ▼
Deploy to Cloud Run
    │   - 1 min instance
    │   - Auto-scaling
    │   - HTTPS with managed cert
    │
    ▼
Live at dan-weinbeck.com
```

---

## Rollback

```bash
# List recent revisions
gcloud run revisions list --service=dan-weinbeck-site

# Route traffic to previous revision
gcloud run services update-traffic dan-weinbeck-site \
  --to-revisions=dan-weinbeck-site-00042-abc=100
```

---

## Stripe Setup

### Secret Manager

Create the Stripe secrets in GCP Secret Manager:

```bash
# Create secrets (use sk_test_ / whsec_ for test mode, sk_live_ for production)
echo -n "sk_test_..." | gcloud secrets create stripe-secret-key --data-file=-
echo -n "whsec_..." | gcloud secrets create stripe-webhook-secret --data-file=-

# Grant Cloud Run service account access to read secrets at runtime
gcloud secrets add-iam-policy-binding stripe-secret-key \
  --member="serviceAccount:cloudrun-site@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding stripe-webhook-secret \
  --member="serviceAccount:cloudrun-site@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Webhook Configuration

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set URL to: `https://your-domain.com/api/billing/webhook`
4. Select events: `checkout.session.completed`
5. Copy the signing secret to `stripe-webhook-secret` in Secret Manager

---

## Firestore Setup

### Deploy Indexes

Composite indexes are defined in `firestore.indexes.json`. Deploy them to your Firebase project:

```bash
firebase deploy --only firestore:indexes --project=PROJECT_ID
```

This creates the indexes required by billing queries (`billing_tool_usage` and `billing_purchases` collections). Index creation may take a few minutes.

### Deploy Rules

Security rules are defined in `firestore.rules`. Deploy them:

```bash
firebase deploy --only firestore:rules --project=PROJECT_ID
```

The current rules deny all client-side access (`allow read, write: if false`). All Firestore operations go through the Admin SDK on the server.

### Seed Tool Pricing

Seed the `billing_tool_pricing` collection with default pricing data:

```bash
npx tsx scripts/seed-billing.ts
```

This is safe to run multiple times -- it only creates documents that don't already exist.

---

## Per-Environment Setup Checklist

Use this checklist when setting up a new environment (production, dev, or local).

### 1. Firebase Auth Authorized Domains

Firebase Auth blocks sign-in from domains not in its allowlist. This is a **manual** step in the Firebase Console.

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add each domain that will host the app:
   - Production: `dan-weinbeck.com`
   - Dev: `dev.dan-weinbeck.com`
   - Cloud Run: `personal-brand-pcyrow43pa-uc.a.run.app`
   - Local: `localhost`

### 2. Secret Manager Secrets

All secrets must use real values, not placeholders. Expected format prefixes:

| Secret | Expected Prefix | Source |
|--------|----------------|--------|
| `GITHUB_TOKEN` | `ghp_` or `github_pat_` | GitHub → Settings → Developer Settings → Personal Access Tokens |
| `STRIPE_SECRET_KEY` | `sk_test_` or `sk_live_` | Stripe Dashboard → API Keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_` | Stripe Dashboard → Webhooks → Signing Secret |
| `OPENAI_API_KEY` | `sk-` | OpenAI Dashboard → API Keys |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `AIza` | Google AI Studio → API Keys |
| `CHATBOT_API_KEY` | (any, optional) | FastAPI backend config |

### 3. FIREBASE_PROJECT_ID Gotcha

`FIREBASE_PROJECT_ID` must be the **Firebase project ID** (e.g., `personal-brand-486314`), NOT the GCP project ID (which may differ). It must exactly match `NEXT_PUBLIC_FIREBASE_PROJECT_ID`. The startup validation enforces this.

### 4. External Service URLs

`CHATBOT_API_URL` and `BRAND_SCRAPER_API_URL` must point to the **external Cloud Run services**, not back to this app. Common mistake: setting these to the app's own URL, which causes 404s.

### 5. Firestore Indexes

Deploy and verify indexes are READY before going live:

```bash
firebase deploy --only firestore:indexes --project=personal-brand-486314
npm run verify-indexes -- --project personal-brand-486314
```

### 6. Service Account IAM Roles

The Cloud Run service account needs:
- `roles/datastore.user` (Firestore read/write)
- `roles/secretmanager.secretAccessor` (read secrets)
- `roles/iam.serviceAccountTokenCreator` (sign custom tokens, if applicable)

---

## Validation Scripts

### Pre-Deploy Env Validation

Validates all environment variables, checks cross-field consistency, detects self-referencing URLs, verifies secret formats, and optionally probes service health:

```bash
# Full validation with health probes
npm run validate-env

# Skip health probes (faster, for CI)
npm run validate-env -- --skip-health
```

### Firestore Index Verification

Checks that all composite indexes in `firestore.indexes.json` are deployed and READY:

```bash
npm run verify-indexes -- --project personal-brand-486314
```

Requires `gcloud auth login` for authentication.

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Build fails on Firebase credentials | `FIREBASE_PRIVATE_KEY` escaping wrong | `\n` must be literal in the env var value |
| AI assistant not responding | `CHATBOT_API_URL` not set or wrong | Verify URL points to the FastAPI Cloud Run service |
| GitHub data stale | ISR revalidation period | Revalidates hourly; force refresh via redeploy |
| `auth/unauthorized-domain` | Domain not in Firebase Auth allowlist | Add domain in Firebase Console → Auth → Settings → Authorized Domains |
| All API routes return 401 | `FIREBASE_PROJECT_ID` is GCP project ID, not Firebase ID | Must match `NEXT_PUBLIC_FIREBASE_PROJECT_ID` exactly |
| Chatbot/scraper returns 404 HTML | Service URL points to this app, not external service | Fix URL to point to the actual Cloud Run service |
| "Incorrect API key" from OpenAI/Google | Secret Manager has placeholder value | Update with real key: `gcloud secrets versions add SECRET_NAME --data-file=-` |
| "requires an index" 500 error | Missing Firestore composite index | `firebase deploy --only firestore:indexes` and wait for READY status |
| Env validation fails at startup | Missing or invalid environment variables | Run `npm run validate-env` locally to see detailed error messages |
