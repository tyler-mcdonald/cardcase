---
name: run-dev-servers
description: Start cardcase's local dev environment — the Django backend (with its Postgres container) and the React/Vite frontend — each in its own background shell. Use whenever the user wants to run, start, launch, or restart the app, the servers, the backend, or the frontend locally, or needs the app running to try out or verify a change, even if they only mention one half (e.g. "spin up django" or "start the web app").
---

# Run dev servers

Cardcase has two apps that run side by side during development:

| App | Directory | Command | URL |
|---|---|---|---|
| Django backend | `backend/` | `uv run manage.py runserver` | http://localhost:8000 |
| React frontend | `web/` | `pnpm dev` | http://localhost:3000 |

The backend needs the Postgres container from `backend/docker-compose.yml`. The frontend needs the backend running for login to work, so start both unless the user explicitly asks for only one.

Resolve paths from the repo root (`git rev-parse --show-toplevel`) so this works from any worktree.

## Steps

1. **Check prerequisites.** Both `backend/.env` and `web/.env` must exist, and Docker must be running (`docker info`). If either is missing, stop and tell the user what's missing, pointing them to `make setup` in `backend/` or the README's frontend setup. Setup is a one-time step with side effects (dependency installs, migrations), so it shouldn't happen silently as part of starting servers.

2. **Start Postgres.** Run `docker compose up -d --wait` in `backend/`. It's idempotent, so it's safe even if the container is already up.

3. **Skip anything already running.** Check each port with `lsof -nP -iTCP:<port> -sTCP:LISTEN`. If a port is taken, don't start a second copy — a duplicate would fail to bind or leave an orphaned process. Report what's already listening instead.

4. **Start each server as its own background shell.** Use a separate background Bash command for each (`run_in_background`), not one combined command, so each server's logs stay separate and a crash in one is reported on its own:
   - `cd <repo>/backend && uv run manage.py runserver`
   - `cd <repo>/web && pnpm dev`

5. **Wait until they respond.** Poll each URL with `curl -s -o /dev/null -w '%{http_code}'` for up to ~30 seconds. If one doesn't come up, read its background shell output and report the actual error rather than guessing.

6. **Report.** Tell the user both URLs and which servers were started fresh versus already running.

## Stopping

If the user asks to stop the servers, stop the background shells you started. Leave the Postgres container running unless they ask for it to be stopped too, since it holds their local data and restarting it is slow.
