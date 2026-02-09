# Phase 16: User Setup Required

These manual configuration steps must be completed before deploying the updated application.

---

## 1. Add CHATBOT_API_URL to Cloud Build Trigger

**Why:** The Cloud Build configuration now passes `CHATBOT_API_URL` to Cloud Run via the `_CHATBOT_API_URL` substitution variable. This variable must be configured in the trigger settings.

**Steps:**
1. Go to **GCP Console -> Cloud Build -> Triggers -> deploy-on-push -> Edit**
2. Scroll to **Substitution variables**
3. Add a new variable:
   - **Variable:** `_CHATBOT_API_URL`
   - **Value:** The URL of your deployed FastAPI RAG backend Cloud Run service (e.g., `https://chatbot-assistant-XXXXXXXXXX-uc.a.run.app`)
4. Click **Save**

**Verification:**
- The next Cloud Build triggered by a push to master should pass `CHATBOT_API_URL` to the Cloud Run service
- After deployment, verify: `gcloud run services describe personal-brand --region=us-central1 --format='value(spec.template.spec.containers[0].env)'` should include `CHATBOT_API_URL`

---

## 2. Delete Orphaned google-ai-api-key Secret

**Why:** The `google-ai-api-key` secret in Secret Manager is no longer referenced by any service. The Next.js app no longer calls Gemini directly -- the FastAPI backend handles all LLM calls with its own credentials.

**Steps:**
1. Go to **GCP Console -> Security -> Secret Manager**
2. Find **google-ai-api-key**
3. Click the secret name, then click **Delete**
4. Confirm deletion

**Verification:**
- `gcloud secrets list --filter="name:google-ai-api-key"` should return empty

---

## 3. (Optional) Revoke Gemini API Key

**Why:** If the Gemini API key stored in the deleted secret is no longer used anywhere (including by the FastAPI backend), it should be revoked for security hygiene.

**Steps:**
1. Go to **Google AI Studio -> API keys** (https://aistudio.google.com/apikey)
2. Find the API key that was previously used by the Next.js app
3. If no other service uses this key, delete/revoke it

**Note:** If your FastAPI RAG backend uses the same Gemini API key, do NOT revoke it. Only revoke if the key is truly unused.

---

## Summary

| Task | Service | Priority |
|------|---------|----------|
| Add `_CHATBOT_API_URL` substitution | Cloud Build | Required before deploy |
| Delete `google-ai-api-key` secret | Secret Manager | Recommended |
| Revoke Gemini API key | Google AI Studio | Optional |
