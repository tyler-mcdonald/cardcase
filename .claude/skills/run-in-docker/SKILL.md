---
name: run-in-docker
description: Run a branch or PR's full local stack in Docker and hand the user a URL to try it. Use when asked to run, spin up, or try out a PR or branch locally.
---

# Run in Docker

1. Invoke `setup-worktree`, then check out the PR or branch in it (`gh pr checkout <number>` or `git switch <branch>`).
2. Run `make up` and hand the user the app URL it prints. Emailed login codes show in `make logs`.
3. When the user is done, run `make down`.
