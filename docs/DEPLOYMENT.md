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
| `GITHUB_TOKEN` | GitHub personal access token (for repo data) |
| `TODOIST_API_TOKEN` | Todoist API token (for admin dashboard) |

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
- `TODOIST_API_TOKEN`

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

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails on Firebase credentials | Check `FIREBASE_PRIVATE_KEY` escaping—`\n` must be literal |
| AI assistant not responding | Verify `CHATBOT_API_URL` is set in Cloud Run env and the FastAPI service is reachable |
| GitHub data stale | ISR revalidates hourly; force refresh via redeploy |
| Auth not working | Check Firebase Auth domain in console matches env var |
