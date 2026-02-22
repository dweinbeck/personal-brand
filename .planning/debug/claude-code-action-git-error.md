---
status: resolved
trigger: "GitHub Actions workflow failures for anthropics/claude-code-action@v1"
created: 2026-02-22T20:10:00Z
updated: 2026-02-22T20:30:00Z
---

## Resolution Summary

Two sequential issues were found and fixed:

### Issue 1: "fatal: not a git repository" (FIXED)
- **Root cause:** master branch workflow was missing `actions/checkout@v4` step
- **Fix:** Merged dev→master to include the checkout step (commit 2d28b87)

### Issue 2: "HttpError: Not Found" on compare API (FIXED)
- **Root cause:** Known upstream bug in `anthropics/claude-code-action` ([issue #589](https://github.com/anthropics/claude-code-action/issues/589)). The action tries to compare `base_branch...working_branch` via the GitHub API before the working branch exists. The 404 response from the non-existent branch is not caught gracefully.
- **Contributing factor:** The default `branch_prefix: "claude/"` contains a forward slash that gets URL-encoded to `%2F` in API calls, which has inconsistent handling in GitHub's API.
- **Fix:** Added `branch_prefix: "claude-"` to `.github/workflows/claude.yml` to avoid the forward slash encoding issue.
- **Verification:** Multiple users on #589 confirmed this workaround resolves the issue.

## Files Changed
- `.github/workflows/claude.yml` — added `branch_prefix: "claude-"` parameter
