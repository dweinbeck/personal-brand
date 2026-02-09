#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Deploy personal-brand to GCP Cloud Run
# Usage: ./scripts/deploy.sh <GCP_PROJECT_ID> [REGION]
# ============================================================

# Auto-source .env.local for NEXT_PUBLIC_* vars needed at build time
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env.local"

if [[ -f "$ENV_FILE" ]]; then
  echo "==> Sourcing environment from .env.local"
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "⚠️  Warning: .env.local not found. NEXT_PUBLIC_* vars may be missing."
  echo "   Create .env.local from .env.local.example before deploying."
fi

PROJECT_ID="${1:?Usage: ./scripts/deploy.sh <GCP_PROJECT_ID> [REGION]}"
REGION="${2:-us-central1}"
SERVICE_NAME="personal-brand"
SA_NAME="cloudrun-site"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "==> Deploying to project: ${PROJECT_ID}, region: ${REGION}"

# 1. Set active project
gcloud config set project "${PROJECT_ID}"

# 2. Enable required APIs
echo "==> Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com

# 3. Create Artifact Registry repository (idempotent)
echo "==> Creating Artifact Registry repository..."
gcloud artifacts repositories create "personal-brand" \
  --repository-format=docker \
  --location="${REGION}" \
  --description="Personal brand site Docker images" \
  2>/dev/null || echo "    Repository already exists."

# 4. Create dedicated service account (idempotent)
echo "==> Creating service account..."
gcloud iam service-accounts create "${SA_NAME}" \
  --display-name="Cloud Run Personal Brand Site" \
  2>/dev/null || echo "    Service account already exists."

# 5. Grant Firestore access (least privilege -- datastore.user only)
echo "==> Granting Firestore access..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/datastore.user" \
  --condition=None \
  --quiet

# 6. Build and push image via Cloud Build
# NEXT_PUBLIC_* vars must be available at build time (baked into client JS bundle)
echo "==> Building and deploying via Cloud Build..."
SHORT_SHA="$(git rev-parse --short HEAD)"
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions="SHORT_SHA=${SHORT_SHA},_REGION=${REGION},_NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY:-},_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:-},_NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID:-${PROJECT_ID}},_CHATBOT_API_URL=${CHATBOT_API_URL:-},_BRAND_SCRAPER_API_URL=${BRAND_SCRAPER_API_URL:-}" \
  --quiet

# 7. Print the service URL
echo ""
echo "==> Deployment complete!"
gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --format="value(status.url)"
