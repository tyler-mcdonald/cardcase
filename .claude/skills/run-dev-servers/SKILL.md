---
name: run-dev-servers
description: Start cardcase's local dev environment — the Django backend (with its Postgres container) and the React/Vite frontend — each in its own background shell. Use whenever the user wants to run, start, launch, or restart the app, the servers, the backend, or the frontend locally, or needs the app running to try out or verify a change, even if they only mention one half (e.g. "spin up django" or "start the web app").
---

# Run dev servers

The backend (`backend/`) serves on port 8000 (`VITE_API_URL` in `web/.env`) and the frontend (`web/`) on port 3000 (`server.port` in `web/vite.config.ts`). If those sources say otherwise, use their ports. Start both unless the user asks for only one.

"This repo" below means `git rev-parse --show-toplevel`. Each worktree has its own `.env` files, dependencies, and servers.

If any step fails (e.g. Docker isn't running, a tool isn't installed, a server doesn't come up), stop and report the actual error from its output rather than guessing.

## Steps

1. **Read the README.** Its "Development" section is the source of truth for each app's setup and start commands. Read it every time and follow it rather than relying on memory.

2. **Check the ports.** Find both listeners and their working directories in one pass:
   `lsof -nP -iTCP:8000 -iTCP:3000 -sTCP:LISTEN -Fpn`, then `lsof -a -d cwd -Fpn -p <pid>,<pid>` for any pids found. For a taken port:
   - Working directory inside this repo: it's already running this branch's code. Don't set up or start that app again; just report it.
   - Anywhere else (e.g. another worktree): it's serving a different branch's code. Worktrees can't run side by side because they share fixed ports, localhost cookies, and the Postgres container. Ask the user with a single AskUserQuestion that covers every conflicting port, naming the port, the owning worktree path, and its branch (`git -C <cwd> branch --show-current`, once per distinct worktree). Never stop a server without this confirmation, even if a previous run approved it. If the user declines, skip that app and report which ports are still held and by what.

3. **Shut down the confirmed servers.** Kill all confirmed listener pids and wait for their ports to free in one command: `kill <pid>...; for i in $(seq 20); do lsof -nP -iTCP:<port> ... -sTCP:LISTEN >/dev/null || break; sleep 0.25; done`. Killing the listener is enough: its `uv`/`pnpm` parents exit on their own.

4. **Run setup for each app being started.** Follow the README's setup steps in each app's directory, as parallel Bash calls. Run them every time: they're idempotent and pick up new dependencies and migrations from the current branch. For the frontend's `.env`, use `cp -n .env.example .env` so an existing file isn't overwritten (`make setup` already handles this for the backend).

5. **Start each server as its own background shell.** Use the README's start command for each app as a separate `run_in_background` Bash command, so each server's logs and crashes are reported on their own.

6. **Wait until they respond, then report.** Poll `http://localhost:8000/health/` (which also checks the database) and `http://localhost:3000` together in one loop for up to ~30 seconds. Then tell the user both URLs, which servers were started fresh versus already running, and any other worktree's servers that were shut down.

## Stopping

If the user asks to stop (or restart) the servers, stop each port's listener the same way as step 3. No confirmation is needed when the servers belong to this repo, since the user asked. Leave the Postgres container running unless they ask for it to be stopped too, since it holds their local data and restarting it is slow.
