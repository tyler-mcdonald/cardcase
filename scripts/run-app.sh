#!/usr/bin/env bash
set -euo pipefail
set -m

ROOT=$(cd "$(dirname "$0")/.." && pwd)
STATE="$(git -C "$ROOT" rev-parse --absolute-git-dir)/run-app"
mkdir -p "$STATE"

stop() {
  for name in backend web; do
    if [[ -f "$STATE/$name.pid" ]]; then
      local pgid
      pgid=$(cat "$STATE/$name.pid")
      kill -- "-$pgid" 2>/dev/null || true
      for _ in $(seq 1 20); do
        kill -0 -- "-$pgid" 2>/dev/null || break
        sleep 0.5
      done
      rm -f "$STATE/$name.pid"
    fi
  done
}

free_port() {
  local port=$1
  while lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; do
    port=$((port + 1))
  done
  echo "$port"
}

wait_for() {
  local url=$1 log=$2
  for _ in $(seq 1 90); do
    if curl -s -o /dev/null "$url"; then
      return 0
    fi
    sleep 1
  done
  echo "Timed out waiting for $url. Last lines of $log:" >&2
  tail -20 "$log" >&2
  stop
  exit 1
}

if [[ "${1:-}" == "stop" ]]; then
  stop
  echo "Stopped."
  exit 0
fi

stop

echo "==> Setting up (log: $STATE/setup.log)"
if ! make -C "$ROOT" setup >"$STATE/setup.log" 2>&1; then
  tail -20 "$STATE/setup.log" >&2
  exit 1
fi

API_PORT=$(free_port 8000)
WEB_PORT=$(free_port 3000)
API_URL="http://localhost:$API_PORT"
WEB_URL="http://localhost:$WEB_PORT"

(cd "$ROOT/backend" && FRONTEND_URL="$WEB_URL" PYTHONUNBUFFERED=1 exec uv run manage.py runserver "$API_PORT") \
  >"$STATE/backend.log" 2>&1 </dev/null &
echo $! >"$STATE/backend.pid"

(cd "$ROOT/web" && VITE_API_URL="$API_URL" exec pnpm exec vite --port "$WEB_PORT" --strictPort) \
  >"$STATE/web.log" 2>&1 </dev/null &
echo $! >"$STATE/web.pid"

wait_for "$API_URL/" "$STATE/backend.log"
wait_for "$WEB_URL/" "$STATE/web.log"

cat <<EOF
Web: $WEB_URL
API: $API_URL
Backend log: $STATE/backend.log (login codes and other emails are printed here)
Web log: $STATE/web.log
Stop: $ROOT/scripts/run-app.sh stop
EOF
