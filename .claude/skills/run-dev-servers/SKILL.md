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

3. **Check the ports.** For each port, run `lsof -nP -iTCP:<port> -sTCP:LISTEN`. No output means it's free. Otherwise, get the listening pid's working directory with `lsof -a -p <pid> -d cwd -Fn`. For a taken port:
   - Working directory inside this repo root: it's already running this branch's code — don't start a second copy, just report it.
   - Anywhere else (e.g. another worktree): it's serving a different branch's code, and a second copy can't run alongside it because the backend only trusts one frontend origin. Go to step 4.

4. **Confirm before shutting anything down.** Ask the user with a single AskUserQuestion covering every conflicting port, naming for each the port, the owning worktree path, and its branch (`git -C <cwd> branch --show-current`). Never stop a server without this confirmation, even if a previous run of this skill was approved. If the user declines, don't start the conflicting server(s) and report which ports are still held and by what.

5. **Shut down the confirmed servers.** Run `kill <pid>` on each confirmed port's listener, then re-run the `lsof` check until the port is free. Killing the listener is enough: its `uv`/`pnpm` parents exit on their own. If a port is still held after a few seconds, stop and report what's holding it.

6. **Start each server as its own background shell.** Use the README's start command for each app, as a separate background Bash command (`run_in_background`) rather than one combined command, so each server's logs stay separate and a crash in one is reported on its own.

7. **Wait until they respond.** Poll each URL with `curl -s -o /dev/null -w '%{http_code}'` for up to ~30 seconds. If one doesn't come up, read its background shell output and report the actual error rather than guessing.

8. **Report.** Tell the user both URLs, which servers were started fresh versus already running, and any other worktree's servers that were shut down.

## Stopping

If the user asks to stop (or restart) the servers, stop each port's listener the same way as step 5. No confirmation is needed when the servers belong to this repo root, since the user asked. Leave the Postgres container running unless they ask for it to be stopped too, since it holds their local data and restarting it is slow.
