---
status: resolved
trigger: "GitHub Actions workflow failures for anthropics/claude-code-action@v1"
created: 2026-02-22T20:10:00Z
updated: 2026-02-22T21:00:00Z
---

## Resolution Summary

Three sequential issues were found and fixed:

### Issue 1: "fatal: not a git repository" (FIXED)
- **Root cause:** master branch workflow was missing `actions/checkout@v4` step
- **Fix:** Merged dev→master to include the checkout step (commit 2d28b87)

### Issue 2: "HttpError: Not Found" on compare API (FIXED)
- **Root cause:** Known upstream bug in `anthropics/claude-code-action` ([issue #589](https://github.com/anthropics/claude-code-action/issues/589)). The action tries to compare `base_branch...working_branch` via the GitHub API before the working branch exists.
- **Fix:** Added `branch_prefix: "claude-"` to `.github/workflows/claude.yml`

### Issue 3: "Claude Code process exited with code 1" — SDK AJV crash (FIXED)
- **Root cause:** Upstream regression in `@anthropic-ai/claude-agent-sdk` versions 0.2.15+ causes an AJV (JSON schema validation) crash during Claude Code startup in CI. The process exits with code 1 after ~254ms, before making any API calls ($0 cost). The `@v1` floating tag auto-resolves to the latest broken SDK.
- **Evidence:** `is_error: true`, `duration_ms: 254`, `total_cost_usd: 0`, `num_turns: 1` — identical to reports in [#852](https://github.com/anthropics/claude-code-action/issues/852), [#947](https://github.com/anthropics/claude-code-action/issues/947)
- **Fix:** Pinned action to `anthropics/claude-code-action@v1.0.51` which uses an older, working SDK version
- **Follow-up:** If this doesn't resolve it, check Anthropic API workspace billing limits ([#914](https://github.com/anthropics/claude-code-action/issues/914))

## Files Changed
- `.github/workflows/claude.yml` — pinned to `@v1.0.51`, added `branch_prefix: "claude-"`, added `actions/checkout@v4`
