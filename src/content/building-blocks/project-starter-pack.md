# Project Start → First Successful Cloud Deploy (AI Agent Apps) — Building Blocks (GCP-first)

This is a menu of reusable “shortcut components” (building blocks) that take you from idea → MVP → first deploy.
Each block includes: what it does + how to make it fast (Claude skill / mini-agent / template / script).

**Cloud priorities:** GCP first, AWS second, Azure last.  
Mentioned vendors once: :contentReference[oaicite:0]{index=0}, :contentReference[oaicite:1]{index=1}, :contentReference[oaicite:2]{index=2}, :contentReference[oaicite:3]{index=3}, :contentReference[oaicite:4]{index=4}, :contentReference[oaicite:5]{index=5}, :contentReference[oaicite:6]{index=6}, :contentReference[oaicite:7]{index=7}.

---

## The “fast path” order of operations (first deploy ASAP)

1) **MVP Slice** (what is the smallest deployable value?)  
2) **Repo + Dev Environment** (bootstrap, standards, local run)  
3) **Service Scaffold + Docker** (health checks, config, container)  
4) **Cloud Foundation (minimal)** (project/account, IAM, registry, secrets)  
5) **Deploy Path** (IaC + CI/CD + one environment)  
6) **Basic Observability + Smoke Test** (logs, metrics, a canary check)  
7) **Domain/TLS + Auth (optional)** (only if MVP needs it)

---

## Conventions for “speed levers”

- **Claude skill**: asks 5–10 targeted questions → generates files + commands + PR-ready diff
- **Template**: cookiecutter / repo-template / “golden path” starter kit
- **Mini-agent**: runs multi-step checklists (validate state, propose next action, generate diffs)
- **Script/CLI**: one command that scaffolds or validates (idempotent)
- **Terraform module**: reusable infra blocks with sane defaults

---

# Building Blocks

## A) Idea → spec → plan (keep it thin, but explicit)

### BB01 — Problem framing + MVP slice
- **Outcome:** one-sentence goal + “MVP = X, not Y” + user story
- **Speed lever:** Claude skill that forces: *user*, *job-to-be-done*, *non-goals*, *success metric*
- **GCP/AWS/Azure:** cloud-agnostic

### BB02 — FRD / PRD-lite generator (1–2 pages)
- **Outcome:** FRD/PRD-lite in `/docs/FRD.md` with scope + acceptance criteria
- **Speed lever:** UI/form (or Claude skill) → generates FRD + seeds initial backlog issues
- **Cloud note:** include “first deploy definition” (endpoint live, logs visible, rollback path)

### BB03 — Architecture sketch + decisions (ADR-lite)
- **Outcome:** `/docs/ARCH.md` + `/docs/ADR-0001.md` (why this stack, what you’re not doing)
- **Speed lever:** template + Claude skill that picks defaults based on 6 questions (stateful? async jobs? auth?)
- **GCP-first defaults:** Cloud Run + Cloud Build + Artifact Registry + Secret Manager + Cloud SQL + GCS

### BB04 — Backlog seed (10–25 issues max)
- **Outcome:** labeled issues (MVP, infra, security, polish), plus milestones (MVP0, MVP1)
- **Speed lever:** mini-agent that turns FRD sections into issues automatically
- **Tooling:** works best if you standardize labels + issue templates

---

## B) Repo + local developer experience (DX)

### BB05 — Repo creation + local sync (the “you mentioned this one”)
- **Outcome:** repo exists, local cloned, correct default branch, first commit, remote set
- **Speed lever:** Claude skill that asks: repo name, visibility, license, language, package manager, CI choice
- **Notes:** include a “fix common git gotchas” snippet (branch mismatch, SSH keys, remote URL)

### BB06 — Project skeleton + conventions
- **Outc**
