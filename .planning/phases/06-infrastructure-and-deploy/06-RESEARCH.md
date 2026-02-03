# Phase 6: Infrastructure and Deploy - Research

**Researched:** 2026-02-03
**Domain:** GCP Cloud Run, Docker, Next.js standalone deployment, Secret Manager, IAM
**Confidence:** HIGH

## Summary

This phase deploys the personal-brand Next.js site to GCP Cloud Run using a multi-stage Docker build with Next.js standalone output mode. The research uncovered a critical simplification: on Cloud Run, `firebase-admin` can use Application Default Credentials (ADC) instead of explicit service account key environment variables. This eliminates the `FIREBASE_PRIVATE_KEY` newline problem entirely and is the GCP-recommended approach.

The standard approach is: (1) add `output: "standalone"` to `next.config.ts`, (2) build a multi-stage Docker image targeting under 150MB, (3) push to GCP Artifact Registry, (4) deploy to Cloud Run with a dedicated least-privilege service account, (5) use ADC for Firestore access, and (6) map custom domain.

**Primary recommendation:** Use Application Default Credentials for firebase-admin on Cloud Run -- refactor `src/lib/firebase.ts` to use `applicationDefault()` instead of `cert()` with individual env vars. This eliminates the need for `FIREBASE_PRIVATE_KEY` and `FIREBASE_CLIENT_EMAIL` as environment variables, requiring only `FIREBASE_PROJECT_ID` (or none at all if the GCP project IS the Firebase project).

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Docker (multi-stage) | Latest | Container image build | Official Next.js recommendation for self-hosting |
| node:20-alpine | 20.x LTS | Base image | Smallest stable Node image; matches Next.js Docker example |
| GCP Artifact Registry | N/A | Docker image storage | Google-recommended replacement for Container Registry (gcr.io) |
| GCP Cloud Run | v2 | Container hosting | Serverless, auto-scaling, managed TLS, no cluster management |
| GCP Secret Manager | N/A | Secret storage | Google-recommended for sensitive config on Cloud Run |
| gcloud CLI | Latest | Deployment commands | Official GCP deployment tool |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| sharp | Next.js image optimization | Required in standalone mode for `next/image` to work |
| libc6-compat | Alpine compatibility layer | Required in Alpine Docker images for native modules |
| Cloud Build (optional) | Build images remotely | If local Docker builds are too slow or CI/CD is desired |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Artifact Registry | Container Registry (gcr.io) | gcr.io is legacy; Artifact Registry is the successor |
| node:20-alpine | node:20-slim | Slim is ~60MB larger but avoids Alpine compatibility issues |
| Manual gcloud deploy | Cloud Build triggers | Automation is nice but overkill for v1; add later |
| ADC (applicationDefault) | cert() with env vars | cert() requires FIREBASE_PRIVATE_KEY with newline escaping; ADC is simpler and more secure on GCP |

**Installation (in Dockerfile):**
```bash
# sharp is already a dependency in package.json via next/image requirements
# No additional npm installs needed beyond what's in package.json
npm ci --omit=dev  # production dependencies only in runner stage
```

## Architecture Patterns

### Recommended Project Structure (new files)
```
/
├── Dockerfile               # Multi-stage build
├── .dockerignore             # Exclude unnecessary files from build context
├── next.config.ts            # Add output: "standalone"
└── src/lib/firebase.ts       # Refactor to use ADC on Cloud Run
```

### Pattern 1: Next.js Standalone Output
**What:** Next.js `output: "standalone"` creates a self-contained `.next/standalone` directory with only the files needed to run in production, including a minimal `server.js` entry point. No `node_modules` install needed in the final image.
**When to use:** Always for Docker deployments.
**Configuration:**
```typescript
// next.config.ts
import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",  // ADD THIS
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    qualities: [25, 50, 75, 100],
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [["rehype-pretty-code", { theme: "github-light" }]],
  },
});

export default withMDX(nextConfig);
```

**What standalone produces:**
- `.next/standalone/` -- complete server with bundled node_modules (only production deps)
- `.next/standalone/server.js` -- minimal entry point (replaces `next start`)
- `.next/static/` -- must be copied manually to `.next/standalone/.next/static/`
- `public/` -- must be copied manually to `.next/standalone/public/`

### Pattern 2: Multi-Stage Docker Build
**What:** Three-stage Dockerfile: deps, builder, runner. Keeps final image minimal.
**Source:** [Official Vercel Next.js Docker example](https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile)

```dockerfile
# syntax=docker.io/docker/dockerfile:1

FROM node:20-alpine AS base

# --- Stage 1: Install dependencies ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Stage 2: Build the application ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Stage 3: Production runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Pattern 3: Firebase Admin with Application Default Credentials
**What:** On Cloud Run, use ADC instead of explicit credential env vars.
**Why:** Eliminates FIREBASE_PRIVATE_KEY newline problems, removes credential exposure risk, follows GCP security best practices.
**Source:** [Firebase Admin SDK setup docs](https://firebase.google.com/docs/admin/setup)

```typescript
// src/lib/firebase.ts -- Cloud Run compatible version
import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });

export const db = getFirestore(app);
```

**Critical note:** This means the Cloud Run service account needs `roles/datastore.user` IAM role. The `applicationDefault()` call uses the service account attached to the Cloud Run service -- no key file, no env vars with secrets.

**Local development:** For local dev, set `GOOGLE_APPLICATION_CREDENTIALS` pointing to a service account JSON file, or keep a fallback to the `cert()` approach:

```typescript
import { getApps, initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getCredential() {
  // On GCP (Cloud Run), use ADC automatically
  if (process.env.K_SERVICE) {
    return applicationDefault();
  }
  // Local development: use explicit env vars
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (projectId && clientEmail && privateKey) {
    return cert({ projectId, clientEmail, privateKey });
  }
  // Fallback: try ADC (works with gcloud auth application-default login)
  return applicationDefault();
}

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: getCredential(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });

export const db = getFirestore(app);
```

`K_SERVICE` is an environment variable automatically set by Cloud Run, making it a reliable way to detect the Cloud Run environment.

### Pattern 4: .dockerignore
**What:** Exclude files from Docker build context to speed up builds and prevent credential leaks.

```
.git
.gitignore
node_modules
.next
.env*
*.md
.planning
.DS_Store
headshot.jpeg
*.pem
```

Note: `headshot.jpeg` in the repo root should be in `public/` if it's used by the site. The `.dockerignore` excludes the root copy. The `public/` directory IS included so Next.js can serve static assets.

### Anti-Patterns to Avoid
- **Copying full node_modules to runner stage:** Use standalone output instead; it bundles only needed dependencies.
- **Using `next start` in Docker:** Use `node server.js` from standalone output. `next start` requires the full Next.js installation.
- **Storing FIREBASE_PRIVATE_KEY as a Cloud Run env var:** Use ADC instead. If you absolutely must use a key, mount it as a Secret Manager volume.
- **Using the default Compute Engine service account:** Always create a dedicated service account with least-privilege roles.
- **Building Docker images with secrets in build args:** Secrets should never be passed as build args; they're visible in image history.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Docker image optimization | Custom pruning scripts | Next.js `output: "standalone"` | Handles dependency tracing automatically |
| Image optimization in Docker | Custom image pipeline | `sharp` (npm package) | Next.js requires it for `next/image` in standalone mode |
| Secret management | Custom secret-fetching code | Cloud Run Secret Manager integration | Native integration, no code changes, automatic rotation support |
| TLS/HTTPS | Certificate management | Cloud Run managed TLS | Automatic certificate provisioning and renewal |
| Container scaling | Custom autoscaler | Cloud Run auto-scaling | Built-in, configurable min/max instances |
| Health checks | Custom health endpoint | Cloud Run startup/liveness probes | Built-in container health checking |
| Firebase auth on GCP | Manual service account key management | Application Default Credentials | Automatic, keyless, metadata-server-based |

## Common Pitfalls

### Pitfall 1: sharp Not Found in Standalone Mode
**What goes wrong:** `next/image` fails at runtime with "'sharp' is required to be installed in standalone mode."
**Why it happens:** standalone output traces dependencies but sharp's native binaries may not be copied correctly, especially on Alpine.
**How to avoid:** Ensure `sharp` is in `dependencies` (not `devDependencies`) in `package.json`. In the Dockerfile deps stage, use `RUN apk add --no-cache libc6-compat`. If issues persist, install sharp separately in the runner stage: `RUN npm install sharp`.
**Warning signs:** Image optimization returning 500 errors in production.

### Pitfall 2: Missing public/ and .next/static/ in Standalone
**What goes wrong:** Static assets (images, CSS, JS) return 404.
**Why it happens:** standalone output deliberately excludes `public/` and `.next/static/` -- they're meant to be served by a CDN. But without a CDN, the standalone server needs them.
**How to avoid:** Always copy both directories in the Dockerfile runner stage:
```dockerfile
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
```

### Pitfall 3: FIREBASE_PRIVATE_KEY Newline Corruption
**What goes wrong:** `FirebaseAppError: Failed to parse private key: Error: Invalid PEM formatted message.`
**Why it happens:** PEM keys contain literal `\n` characters that get escaped to `\\n` when stored as environment variables.
**How to avoid:** Use ADC on Cloud Run (eliminates the problem entirely). For local dev, use `.replace(/\\n/g, "\n")` on the env var value.

### Pitfall 4: Docker Image Over 150MB
**What goes wrong:** Image exceeds the 150MB target, slow deploys.
**Why it happens:** Copying full node_modules, using non-Alpine base, or including dev dependencies.
**How to avoid:** Use the three-stage Dockerfile pattern with Alpine base and standalone output. A typical Next.js standalone image on Alpine is 80-130MB depending on dependencies.
**Warning signs:** `docker images` showing sizes > 150MB.

### Pitfall 5: Running Container as Root
**What goes wrong:** Security vulnerability -- container processes run as root user.
**Why it happens:** Default Docker behavior is to run as root.
**How to avoid:** Create a non-root user in the Dockerfile and switch to it before CMD:
```dockerfile
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
```

### Pitfall 6: Cloud Run Port Mismatch
**What goes wrong:** Container starts but Cloud Run can't reach it, health checks fail.
**Why it happens:** Cloud Run sends traffic to port 8080 by default, but Next.js standalone listens on port 3000.
**How to avoid:** Either set `ENV PORT=3000` in Dockerfile and configure Cloud Run with `--port 3000`, or set `ENV PORT=8080` in the Dockerfile to match Cloud Run's default.

### Pitfall 7: Forgetting HOSTNAME=0.0.0.0
**What goes wrong:** Container starts but Cloud Run can't connect -- health checks timeout.
**Why it happens:** Next.js standalone server defaults to listening on `localhost` (127.0.0.1), but Cloud Run needs it to listen on all interfaces (0.0.0.0).
**How to avoid:** Set `ENV HOSTNAME="0.0.0.0"` in the Dockerfile.

## Code Examples

### Complete gcloud Deployment Commands

```bash
# Variables (set these for your project)
PROJECT_ID="your-gcp-project-id"
REGION="us-central1"
SERVICE_NAME="personal-brand"
REPO_NAME="personal-brand"
IMAGE_NAME="site"

# 1. Create Artifact Registry repository (one-time)
gcloud artifacts repositories create $REPO_NAME \
  --repository-format=docker \
  --location=$REGION \
  --description="Personal brand site Docker images"

# 2. Configure Docker authentication (one-time)
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# 3. Create a dedicated service account (one-time)
gcloud iam service-accounts create cloudrun-site \
  --display-name="Cloud Run Personal Brand Site"

# 4. Grant Firestore read/write access to the service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:cloudrun-site@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

# 5. Build the Docker image locally
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest .

# 6. Push to Artifact Registry
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest

# 7. Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest \
  --region $REGION \
  --service-account cloudrun-site@${PROJECT_ID}.iam.gserviceaccount.com \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "FIREBASE_PROJECT_ID=${PROJECT_ID}" \
  --allow-unauthenticated
```

### Alternative: Build with Cloud Build (single command, no local Docker needed)

```bash
# Build and push in one step using Cloud Build
gcloud builds submit \
  --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest

# Then deploy as above (step 7)
```

### Cloud Run Custom Domain Mapping

```bash
# Verify domain ownership (one-time, opens browser)
gcloud domains verify dweinbeck.com

# Map domain to Cloud Run service
gcloud run domain-mappings create \
  --service $SERVICE_NAME \
  --domain dweinbeck.com \
  --region $REGION

# Get DNS records to configure
gcloud run domain-mappings describe \
  --domain dweinbeck.com \
  --region $REGION
```

After running the describe command, configure DNS records (A/AAAA) at your domain registrar as shown in the output. Cloud Run automatically provisions TLS certificates.

**Note:** Cloud Run domain mapping is available in specific regions (us-central1, us-east1, europe-west1, asia-northeast1, and others). If using a different region, you may need a Global External Application Load Balancer instead.

### Secret Manager (if secrets are needed beyond ADC)

```bash
# Create a secret
echo -n "some-value" | gcloud secrets create MY_SECRET --data-file=-

# Grant the Cloud Run service account access
gcloud secrets add-iam-policy-binding MY_SECRET \
  --member="serviceAccount:cloudrun-site@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Deploy with secret as env var
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE \
  --update-secrets=MY_ENV_VAR=MY_SECRET:latest

# Deploy with secret mounted as file (better for multiline values like PEM keys)
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE \
  --update-secrets=/secrets/my-key=MY_SECRET:latest
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Container Registry (gcr.io) | Artifact Registry | 2023+ | gcr.io is legacy; Artifact Registry has more features |
| `next start` in Docker | `node server.js` via standalone | Next.js 12+ | 90%+ image size reduction |
| Service account JSON key files | Application Default Credentials | Always recommended on GCP | No keys to manage, rotate, or leak |
| Cloud Run v1 domain mapping | Cloud Run v2 with improved domain mapping | 2024+ | Better TLS provisioning, more regions |
| `npm install --production` in runner | standalone output (no install in runner) | Next.js 12+ | Dependencies bundled automatically |

**Deprecated/outdated:**
- `gcr.io` image paths: Still work but Artifact Registry (`pkg.dev`) is recommended
- `runtimeConfig` in next.config: Does not work with standalone output mode; use environment variables directly

## Open Questions

1. **Exact image size with current dependencies**
   - What we know: Next.js standalone + Alpine typically produces 80-130MB images
   - What's unclear: Whether `firebase-admin` (which is large) will push past 150MB
   - Recommendation: Build the image and check. If over 150MB, consider `node:20-slim` vs Alpine tradeoffs or investigate if firebase-admin tree-shakes well in standalone mode

2. **Cloud Run region for domain mapping**
   - What we know: Domain mapping is only available in certain regions
   - What's unclear: Which region the user wants to deploy to
   - Recommendation: Use `us-central1` (cheapest, supports domain mapping, good latency for US users)

3. **Local development after firebase.ts refactor**
   - What we know: ADC works on Cloud Run; local dev needs `GOOGLE_APPLICATION_CREDENTIALS` or explicit env vars
   - What's unclear: Whether user has `gcloud auth application-default login` set up
   - Recommendation: Use the dual-mode pattern (detect `K_SERVICE` env var) so both environments work

4. **CI/CD pipeline**
   - What we know: v1 can use manual `gcloud` commands
   - What's unclear: Whether user wants GitHub Actions or Cloud Build triggers
   - Recommendation: Start with manual deploy. Document the commands in a deploy script. Add CI/CD later.

## Sources

### Primary (HIGH confidence)
- [Official Vercel Next.js Docker example Dockerfile](https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile) - Complete multi-stage Dockerfile
- [Next.js output configuration docs](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output) - Standalone mode configuration
- [Firebase Admin SDK setup docs](https://firebase.google.com/docs/admin/setup) - applicationDefault() on GCP
- [Cloud Run secrets configuration](https://docs.google.com/run/docs/configuring/services/secrets) - Secret Manager integration
- [Cloud Run deploying container images](https://docs.cloud.google.com/run/docs/deploying) - gcloud deploy commands
- [Artifact Registry push/pull docs](https://docs.cloud.google.com/artifact-registry/docs/docker/pushing-and-pulling) - Docker image management
- [Cloud Run domain mapping](https://docs.cloud.google.com/run/docs/mapping-custom-domains) - Custom domain setup (updated 2026-01-30)
- [Firestore IAM roles](https://docs.cloud.google.com/iam/docs/roles-permissions/firestore) - Least privilege roles

### Secondary (MEDIUM confidence)
- [Next.js self-hosting guide](https://nextjs.org/docs/app/guides/self-hosting) - Caching, environment variables, sharp
- [Community guides on sharp in Alpine Docker](https://dev.to/angojay/optimizing-nextjs-docker-images-with-standalone-mode-2nnh) - sharp troubleshooting

### Tertiary (LOW confidence)
- Image size estimates (80-130MB) - based on community reports, not verified with this specific dependency set

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Based on official Google Cloud and Next.js documentation
- Architecture (Dockerfile): HIGH - Official Vercel example, widely used pattern
- Architecture (ADC for firebase-admin): HIGH - Official Firebase/GCP recommendation
- Pitfalls: HIGH - Well-documented community issues with verified solutions
- Image size target: MEDIUM - Depends on actual dependency sizes; firebase-admin is heavy

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (stable domain; Docker/Cloud Run patterns change slowly)
