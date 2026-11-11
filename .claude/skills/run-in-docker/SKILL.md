---
name: run-in-docker
description: Run the app's full local stack in Docker, for the current checkout or a named branch or PR, and hand the user a URL to try it. Use when asked to run, spin up, or try out the app, a branch, or a PR locally.
---

# Run in Docker

1. Pick the directory to run from. For a PR, get its branch with `gh pr view <number> --json headRefName`.
   - No branch or PR named: the current checkout.
   - The branch is already checked out somewhere (`git worktree list`): that directory.
   - Otherwise: invoke `setup-worktree` with the branch name, then check out the PR or branch in it (`gh pr checkout <number>` or `git switch <branch>`).
2. From that directory, run `make up` and hand the user the app URL it prints. Emailed login codes show in `make logs`.
3. When the user is done, run `make down`.
