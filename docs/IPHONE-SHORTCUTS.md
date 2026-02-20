# iPhone Shortcuts Setup Guide

Two iPhone Shortcuts feed the GSD Builder OS capture pipeline: **GSD Capture** (voice dictation) and **Send to GSD** (screenshots via Share Sheet).

## Prerequisites

- GSD API key set in your environment (`GSD_API_KEY`)
- App deployed and accessible at your production URL

## Shortcut 1: GSD Capture (Dictation)

Captures voice input and sends it as a text transcript.

### Setup Steps

1. Open **Shortcuts** app on iPhone
2. Tap **+** to create a new shortcut
3. Name it **"GSD Capture"**
4. Add these actions in order:

**Action 1: Dictate Text**
- Search for "Dictate Text"
- Language: English
- Stop Listening: After Pause

**Action 2: Get Contents of URL**
- URL: `https://dan-weinbeck.com/api/gsd/capture`
- Method: **POST**
- Headers:
  - `X-API-Key`: *your GSD_API_KEY value*
  - `Content-Type`: `application/json`
- Request Body (JSON):
  - `transcript`: *Dictated Text* (variable from Action 1)

**Action 3: Show Result**
- Show: *Contents of URL* (variable from Action 2)

### Expected Response

```json
{
  "status": "queued",
  "id": "uuid-of-capture"
}
```

### Optional: Add Context

To add context to your dictation (e.g., "this is about the tasks app"):

Insert **Ask for Input** before the URL action:
- Question: "Any context? (leave blank to skip)"
- Input Type: Text

Then add to the request body:
- `context`: *Provided Input*

---

## Shortcut 2: Send to GSD (Screenshot)

Captures a screenshot via the Share Sheet and sends it with optional context.

### Setup Steps

1. Open **Shortcuts** app on iPhone
2. Tap **+** to create a new shortcut
3. Name it **"Send to GSD"**
4. Toggle **Show in Share Sheet** on (Settings gear icon)
5. Set Share Sheet types to: **Images**
6. Add these actions in order:

**Action 1: Get Contents of URL**
- URL: `https://dan-weinbeck.com/api/gsd/capture/screenshot`
- Method: **POST**
- Headers:
  - `X-API-Key`: *your GSD_API_KEY value*
- Request Body: **Form**
  - Field: `screenshot` → *Shortcut Input* (the shared image)
  - Field: `context` → *(optional text)*

**Action 2: Show Result**
- Show: *Contents of URL*

### How to Use

1. Take a screenshot on iPhone
2. Tap the screenshot preview
3. Tap **Share** button
4. Select **Send to GSD** from the Share Sheet
5. Response confirms the capture was queued

### Expected Response

```json
{
  "status": "queued",
  "id": "uuid-of-capture"
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing X-API-Key header" | Verify the header name is exactly `X-API-Key` (case-sensitive) |
| "Invalid JSON" | Ensure request body type is set to JSON (not Form) for dictation |
| "No screenshot provided" | Ensure the form field name is `screenshot` (lowercase) |
| "File too large" | Screenshots must be under 10MB. Use JPEG compression if needed |
| Connection timeout | Verify the app URL is correct and the app is deployed |
| 503 error | GSD_API_KEY is not configured on the server |

## Setup Verification Checklist

- [ ] `GSD_API_KEY` is set in production environment
- [ ] `GOOGLE_GENERATIVE_AI_API_KEY` is set (for LLM routing)
- [ ] `FIREBASE_STORAGE_BUCKET` is set (for screenshot storage)
- [ ] Test dictation shortcut: speak a test phrase, verify capture appears in Builder Inbox
- [ ] Test screenshot shortcut: share a screenshot, verify it appears in Builder Inbox
- [ ] Verify routing: check that captures get classified and routed correctly

## GitHub Actions Setup Checklist

For Claude Code Action to auto-implement captured GitHub issues:

- [ ] Install Claude GitHub App on the repository
- [ ] Add `ANTHROPIC_API_KEY` to repo secrets (Settings > Secrets and variables > Actions)
- [ ] `.github/workflows/claude.yml` exists (created in this milestone)
- [ ] Test: create an issue with `gsd-capture` label, verify Claude responds
- [ ] Test: comment `@claude` on an issue, verify Claude responds
