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
REPO_NAME="personal-brand"
IMAGE_NAME="site"
SA_NAME="cloudrun-site"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"

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
gcloud artifacts repositories create "${REPO_NAME}" \
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
echo "==> Building image with Cloud Build..."
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions="_IMAGE_URI=${IMAGE_URI},_NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY:-},_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:-},_NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID:-${PROJECT_ID}}" \
  --quiet

# 7. Deploy to Cloud Run
echo "==> Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_URI}" \
  --region "${REGION}" \
  --service-account "${SA_EMAIL}" \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "FIREBASE_PROJECT_ID=${PROJECT_ID},NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY:-},NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:-},NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID:-${PROJECT_ID}},GITHUB_TOKEN=${GITHUB_TOKEN:-},TODOIST_API_TOKEN=${TODOIST_API_TOKEN:-}" \
  --allow-unauthenticated

# NOTE: Secret Manager is NOT needed for this deployment.
# firebase-admin uses Application Default Credentials (ADC) via the
# Cloud Run service account, which has roles/datastore.user for Firestore.
# No private keys or secrets need to be stored in Secret Manager.
# If you need additional secrets in the future, use:
#   gcloud secrets create MY_SECRET --data-file=-
#   gcloud run deploy ... --update-secrets=MY_ENV_VAR=MY_SECRET:latest

# 8. Print the service URL
echo ""
echo "==> Deployment complete!"
gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --format="value(status.url)"
