---
name: run-in-docker
description: Run the app's full local stack in Docker, for the current checkout or a named branch or PR, and hand the user a URL to try it. Use when asked to run, spin up, or try out the app, a branch, or a PR locally.
---

# Run in Docker

1. Find where to run it. If no branch or PR is named, use the current checkout. Otherwise, if `git worktree list` shows the branch checked out in some directory (the main checkout or an existing worktree), use that directory. If not, invoke `setup-worktree` and check out the PR or branch in it (`gh pr checkout <number>` or `git switch <branch>`).
2. From that directory, run `make up` and hand the user the app URL it prints. Emailed login codes show in `make logs`. Each directory runs one stack, so `make up` replaces any stack already running there.
3. When the user is done, run `make down` from the same directory.
