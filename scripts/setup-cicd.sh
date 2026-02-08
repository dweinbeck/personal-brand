#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Set up CI/CD for personal-brand
# Connects GitHub to Cloud Build and creates a push trigger
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env.local"

PROJECT_ID="${1:-personal-brand-486314}"
REGION="us-central1"
GITHUB_OWNER="dweinbeck"
GITHUB_REPO="personal-brand"
CONNECTION_NAME="github-connection"
TRIGGER_NAME="deploy-on-push"

echo "==> Setting up CI/CD for project: ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}"

# 1. Enable required APIs
echo ""
echo "==> Enabling APIs..."
gcloud services enable \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com

# 2. Create secrets in Secret Manager (from .env.local)
echo ""
echo "==> Creating secrets in Secret Manager..."

if [[ -f "$ENV_FILE" ]]; then
  source "$ENV_FILE"

  # Create secrets (or update if they exist)
  echo "${GOOGLE_GENERATIVE_AI_API_KEY:-}" | gcloud secrets create google-ai-api-key --data-file=- 2>/dev/null \
    || echo "${GOOGLE_GENERATIVE_AI_API_KEY:-}" | gcloud secrets versions add google-ai-api-key --data-file=-

  echo "${GITHUB_TOKEN:-}" | gcloud secrets create github-token --data-file=- 2>/dev/null \
    || echo "${GITHUB_TOKEN:-}" | gcloud secrets versions add github-token --data-file=-

  echo "${TODOIST_API_TOKEN:-}" | gcloud secrets create todoist-api-token --data-file=- 2>/dev/null \
    || echo "${TODOIST_API_TOKEN:-}" | gcloud secrets versions add todoist-api-token --data-file=-

  echo "    Secrets created/updated from .env.local"
else
  echo "    ⚠️  .env.local not found. Create secrets manually:"
  echo "    gcloud secrets create google-ai-api-key --data-file=-"
  echo "    gcloud secrets create github-token --data-file=-"
  echo "    gcloud secrets create todoist-api-token --data-file=-"
fi

# 3. Grant Cloud Build access to secrets
echo ""
echo "==> Granting Cloud Build access to secrets..."
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

for SECRET in google-ai-api-key github-token todoist-api-token; do
  gcloud secrets add-iam-policy-binding "${SECRET}" \
    --member="serviceAccount:${CB_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet 2>/dev/null || true
done

# 4. Grant Cloud Build permission to deploy to Cloud Run
echo ""
echo "==> Granting Cloud Build permission to deploy..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/run.admin" \
  --quiet

gcloud iam service-accounts add-iam-policy-binding \
  "cloudrun-site@${PROJECT_ID}.iam.gserviceaccount.com" \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/iam.serviceAccountUser" \
  --quiet

# 5. Connect GitHub to Cloud Build (2nd gen)
echo ""
echo "==> Connecting GitHub to Cloud Build..."
echo "    This will open a browser for GitHub authorization."
echo ""

# Check if connection exists
if ! gcloud builds connections describe "${CONNECTION_NAME}" --region="${REGION}" &>/dev/null; then
  echo "    Creating GitHub connection..."
  gcloud builds connections create github "${CONNECTION_NAME}" \
    --region="${REGION}"

  echo ""
  echo "    ⚠️  IMPORTANT: Complete the GitHub authorization in the browser!"
  echo "    Then run this script again to finish setup."
  echo ""
  echo "    If the browser didn't open, go to:"
  echo "    https://console.cloud.google.com/cloud-build/repositories/2nd-gen?project=${PROJECT_ID}"
  exit 0
fi

# Check if repo is linked
if ! gcloud builds repositories describe "${GITHUB_REPO}" \
  --connection="${CONNECTION_NAME}" \
  --region="${REGION}" &>/dev/null; then
  echo "    Linking repository..."
  gcloud builds repositories create "${GITHUB_REPO}" \
    --remote-uri="https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git" \
    --connection="${CONNECTION_NAME}" \
    --region="${REGION}"
fi

# 6. Create the trigger
echo ""
echo "==> Creating Cloud Build trigger..."

# Get NEXT_PUBLIC vars from .env.local
NEXT_PUBLIC_FIREBASE_API_KEY="${NEXT_PUBLIC_FIREBASE_API_KEY:-}"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:-}"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="${NEXT_PUBLIC_FIREBASE_PROJECT_ID:-${PROJECT_ID}}"

# Delete existing trigger if present
gcloud builds triggers delete "${TRIGGER_NAME}" --region="${REGION}" --quiet 2>/dev/null || true

gcloud builds triggers create github \
  --name="${TRIGGER_NAME}" \
  --region="${REGION}" \
  --repository="projects/${PROJECT_ID}/locations/${REGION}/connections/${CONNECTION_NAME}/repositories/${GITHUB_REPO}" \
  --branch-pattern="^master$" \
  --build-config="cloudbuild.yaml" \
  --substitutions="_NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY},_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN},_NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}"

echo ""
echo "==> CI/CD setup complete!"
echo ""
echo "    Trigger: ${TRIGGER_NAME}"
echo "    Branch:  master"
echo "    Config:  cloudbuild.yaml"
echo ""
echo "    Every push to master will now auto-deploy to Cloud Run."
echo ""
echo "    View builds: https://console.cloud.google.com/cloud-build/builds?project=${PROJECT_ID}"
