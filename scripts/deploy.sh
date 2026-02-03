#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Deploy personal-brand to GCP Cloud Run
# Usage: ./scripts/deploy.sh <GCP_PROJECT_ID> [REGION]
# ============================================================

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
  artifactregistry.googleapis.com

# 3. Create Artifact Registry repository (idempotent)
echo "==> Creating Artifact Registry repository..."
gcloud artifacts repositories create "${REPO_NAME}" \
  --repository-format=docker \
  --location="${REGION}" \
  --description="Personal brand site Docker images" \
  2>/dev/null || echo "    Repository already exists."

# 4. Configure Docker authentication
echo "==> Configuring Docker auth..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

# 5. Create dedicated service account (idempotent)
echo "==> Creating service account..."
gcloud iam service-accounts create "${SA_NAME}" \
  --display-name="Cloud Run Personal Brand Site" \
  2>/dev/null || echo "    Service account already exists."

# 6. Grant Firestore access (least privilege -- datastore.user only)
echo "==> Granting Firestore access..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/datastore.user" \
  --condition=None \
  --quiet

# 7. Build Docker image
echo "==> Building Docker image..."
docker build -t "${IMAGE_URI}" .

# 8. Push to Artifact Registry
echo "==> Pushing image to Artifact Registry..."
docker push "${IMAGE_URI}"

# 9. Deploy to Cloud Run
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
  --set-env-vars "FIREBASE_PROJECT_ID=${PROJECT_ID}" \
  --allow-unauthenticated

# NOTE: Secret Manager is NOT needed for this deployment.
# firebase-admin uses Application Default Credentials (ADC) via the
# Cloud Run service account, which has roles/datastore.user for Firestore.
# No private keys or secrets need to be stored in Secret Manager.
# If you need additional secrets in the future, use:
#   gcloud secrets create MY_SECRET --data-file=-
#   gcloud run deploy ... --update-secrets=MY_ENV_VAR=MY_SECRET:latest

# 10. Print the service URL
echo ""
echo "==> Deployment complete!"
gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --format="value(status.url)"
