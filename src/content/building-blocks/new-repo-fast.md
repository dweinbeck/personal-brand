# An (almost) Automated Solution

Want a quicker way? Here's a markdown script you can save in ~/.claude/commands/new-project.md that will allow you to initialize a new repo from within your new project folder all in one command:

Just type the command, give the repo a name, and tell it whether you want your repo to be visible to the public or only to you:

/new-project <repo-name> <public|private>

Example
```
/new-project hello-world public
```

Here's the script:
```
---
description: Create + initialize a GitHub repo from the current folder. Usage: /new-project <project-name> <public|private>
argument-hint: <project-name> <public|private>
allowed-tools: Bash
---

# /new-project

Run: `/new-project <project-name> <public|private>`

This command should do everything in **one Bash run** for speed.

`$ARGUMENTS` is a single string containing all arguments (e.g. `"my-repo public"`).
Use `read` to split it into positional variables.

Execute the following Bash script exactly, substituting `$ARGUMENTS` into the ARGS_RAW variable:

```bash
set -euo pipefail

ARGS_RAW="$ARGUMENTS"

# Parse arguments by splitting the raw string
read -r REPO_NAME VISIBILITY_RAW EXTRA <<< "$ARGS_RAW" || true

if [ -z "${REPO_NAME:-}" ] || [ -z "${VISIBILITY_RAW:-}" ]; then
  echo "Usage: /new-project <project-name> <public|private>"
  exit 1
fi

if [ -n "${EXTRA:-}" ]; then
  echo "Too many arguments."
  echo "Usage: /new-project <project-name> <public|private>"
  exit 1
fi

# Normalize visibility to lowercase
VISIBILITY_RAW="$(printf "%s" "$VISIBILITY_RAW" | tr '[:upper:]' '[:lower:]')"

case "$VISIBILITY_RAW" in
  public)  GH_VIS="--public" ;;
  private) GH_VIS="--private" ;;
  *)
    echo "Visibility must be \"public\" or \"private\". Example: /new-project my-repo public"
    exit 1
    ;;
esac

# Preconditions
command -v git >/dev/null 2>&1 || { echo "Missing git. Install Git first."; exit 1; }
command -v gh  >/dev/null 2>&1 || { echo "Missing gh. Install GitHub CLI first."; exit 1; }

if ! gh auth status >/dev/null 2>&1; then
  echo "Not logged in to GitHub CLI. Run: gh auth login"
  exit 1
fi

# Ensure we can write here
if [ ! -w "." ]; then
  echo "Current directory is not writable: $(pwd)"
  exit 1
fi

# Init git repo if needed
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git init >/dev/null
fi

# Ensure at least one commit (so push works)
if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  if [ ! -f README.md ]; then
    printf "# %s\n" "$REPO_NAME" > README.md
  fi
  git add -A
  git commit -m "Initial commit" >/dev/null
fi

# Ensure branch is main
git branch -M main >/dev/null

# Refuse to overwrite an existing origin
if git remote get-url origin >/dev/null 2>&1; then
  echo "Remote 'origin' already exists: $(git remote get-url origin)"
  echo "Remove it with: git remote remove origin"
  exit 1
fi

# Create repo + push (let gh fail fast if name is taken)
gh repo create "$REPO_NAME" "$GH_VIS" --source=. --remote=origin --push

# Print URL + done
gh repo view "$REPO_NAME" --json url -q .url
echo "Done. Repo created and pushed."
```
