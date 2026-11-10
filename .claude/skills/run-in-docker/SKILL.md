---
name: run-in-docker
description: Run a branch or PR's full local stack (db, backend, web) in Docker, isolated per branch, and hand the user a URL to try it. Use when asked to run, spin up, or try out a PR or branch locally.
---

# Run in Docker

1. Invoke `setup-worktree` with the title `pr-<number>` (or the branch name), then run `gh pr checkout <number>` (or `git switch <branch>`) inside it.
2. From the worktree root, run `make up`. It builds the images, starts the stack under a project named after the branch, waits until it's healthy, and prints the app and backend URLs.
3. Hand the user the printed app URL. The demo entry on the login page gives one-click access with seeded data. Emailed login codes print to the backend console: read them with `make logs`.
4. When the user is done, run `make down` from the same worktree. It removes the containers and the database volume, so every `make up` starts fresh.
