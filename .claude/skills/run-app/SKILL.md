---
name: run-app
description: Run the app's full local stack in Docker. Use when asked to run, start, spin-up the app, etc.
---

# Run App

## Steps

1. Pick the directory
   - For a PR, get its branch with `gh pr view <number> --json headRefName`.
   - No branch or PR named: use the current checkout.
   - The branch is already checked out somewhere (`git worktree list`): use that directory.
   - Otherwise: invoke `setup-worktree` with the branch name, then check out the PR or branch in it (`gh pr checkout <number>` or `git switch <branch>`).

2. Start it
   - From that directory, run `make up` and hand the user the app URL it prints.
   - Emailed login codes show in `make logs`.
   - Code edits reload on their own. Rerun `make up` only after a dependency, Dockerfile, or migration change, and hand the user the new URL it prints — the ports change on each run.

3. Stop it
   - When the user is done, run `make down`.
