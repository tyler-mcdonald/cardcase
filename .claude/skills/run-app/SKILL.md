---
name: run-app
description: Run the app locally or in Docker. Use when asked to run, start, spin-up the app, etc.
argument-hint: "[local|docker]"
---

## Steps

1. Pick the directory
   - For a PR, get its branch with `gh pr view <number> --json headRefName`.
   - No branch or PR named: use the current checkout.
   - The branch is already checked out somewhere (`git worktree list`): use that directory.
   - Otherwise: invoke `setup-worktree` with the branch name, then check out the PR or branch in it (`gh pr checkout <number>` or `git switch <branch>`).

2. Pick the mode
   - `local` or `docker` given: use it.
   - No argument: `local` if ports 8000 and 3000 are both free (`lsof -i :8000 -i :3000` prints nothing); otherwise `docker`.

3. Start it
   - `docker`:
     - From that directory, run `make up` and hand the user the app URL it prints.
     - Emailed login codes show in `make logs`.
     - Code edits reload on their own. Rerun `make up` only after a dependency, Dockerfile, or migration change, and hand the user the new URL it prints — the ports change on each run.
   - `local`:
     - From that directory, run `make setup` if `backend/.venv` or `web/node_modules` is missing.
     - Start `make dev-backend` and `make dev-web` as background processes and hand the user `http://localhost:3000`.
     - Emailed login codes show in the backend's output.
     - Code edits reload on their own. After a dependency or migration change, rerun `make setup` and restart the servers.

4. Stop it
   - When the user is done:
     - `docker`: run `make down`.
     - `local`: stop both background processes. Leave the Postgres container running.
