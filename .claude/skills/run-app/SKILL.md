---
name: run-app
description: Start or stop cardcase locally (backend and web). Use when asked to run, start, or QA the app, or to see a change working in it.
---

# Run app

From the repo root, run `scripts/run-app.sh` as a normal foreground command. It sets up dependencies, picks free ports, starts both servers in the background, and prints the web URL, API URL, and log paths once both respond. Rerunning it restarts the servers.

- Login codes and other emails are printed to the backend log.
- To stop, run `scripts/run-app.sh stop`.
- If it fails, it prints the end of the failing log. Fix the cause rather than starting the servers by hand.
