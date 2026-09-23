---
name: run-dev-servers
description: Start cardcase's local dev environment — the Django backend (with its Postgres container) and the React/Vite frontend — each in its own background shell. Use whenever the user wants to run, start, launch, or restart the app, the servers, the backend, or the frontend locally, or needs the app running to try out or verify a change, even if they only mention one half (e.g. "spin up django" or "start the web app").
---

# Run dev servers

Cardcase has two apps that run side by side during development:

| App | Directory | URL |
|---|---|---|
| Django backend | `backend/` | http://localhost:8000 |
| React frontend | `web/` | http://localhost:3000 |

The repo's `README.md` (its "Development" section) is the source of truth for how to set up and start each app. Read it every time and follow its commands rather than relying on memory or on this file — if the README and this skill ever disagree about a command, the README wins.

The frontend needs the backend running for login to work, so start both unless the user explicitly asks for only one.

Resolve paths from the repo root (`git rev-parse --show-toplevel`) so this works from any worktree — each worktree has its own `.env` files, dependencies, and servers.

## Steps

1. **Read the README.** Find the setup and start commands for the backend and the frontend.

2. **Run setup for each app.** Follow the README's setup steps in each app's directory. Run them every time, not only on first use: they're idempotent and pick up new dependencies and migrations from the current branch. The one exception is copying `.env.example` to `.env` — skip it if `.env` already exists, so local changes aren't overwritten. If a setup step fails (e.g. Docker isn't running, a tool isn't installed), stop and report the actual error.

3. **Check the ports.** Check each port with `lsof -nP -iTCP:<port> -sTCP:LISTEN`. If a port is taken, find the owning process's working directory (`lsof -a -p <pid> -d cwd -Fn`):
   - Inside this repo root: it's already running — don't start a second copy, just report it.
   - Anywhere else (e.g. another worktree): it's serving different code. Don't kill it; tell the user what's holding the port and ask how to proceed.

4. **Start each server as its own background shell.** Use the README's start command for each app, as a separate background Bash command (`run_in_background`) rather than one combined command, so each server's logs stay separate and a crash in one is reported on its own.

5. **Wait until they respond.** Poll each URL with `curl -s -o /dev/null -w '%{http_code}'` for up to ~30 seconds. If one doesn't come up, read its background shell output and report the actual error rather than guessing.

6. **Report.** Tell the user both URLs and which servers were started fresh versus already running.

## Stopping

If the user asks to stop the servers, stop the background shells you started. Leave the Postgres container running unless they ask for it to be stopped too, since it holds their local data and restarting it is slow.
