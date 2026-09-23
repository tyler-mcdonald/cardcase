#!/usr/bin/env bash
set -euo pipefail

DEV_SERVER_PATTERN='(^|/)(uv|pnpm)( |$)|manage\.py runserver|vite'

usage() {
  echo "usage: $0 owner|stop <port>" >&2
  exit 2
}

listening_pids() {
  lsof -nP -t -iTCP:"$1" -sTCP:LISTEN 2>/dev/null || true
}

cwd_of() {
  lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p'
}

command_of() {
  ps -o command= -p "$1" 2>/dev/null || true
}

server_tree() {
  local pid="$1" parent command
  echo "$pid"
  while :; do
    parent=$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ')
    [ -n "$parent" ] && [ "$parent" -gt 1 ] || return 0
    command=$(command_of "$parent")
    [[ $command =~ $DEV_SERVER_PATTERN ]] || return 0
    echo "$parent"
    pid="$parent"
  done
}

alive() {
  local pid survivors=""
  for pid in "$@"; do
    kill -0 "$pid" 2>/dev/null && survivors="$survivors $pid"
  done
  echo "$survivors"
}

wait_until_gone() {
  local port="$1" attempts="$2"
  shift 2
  for _ in $(seq "$attempts"); do
    [ -z "$(listening_pids "$port")" ] && [ -z "$(alive "$@")" ] && return 0
    sleep 0.5
  done
  return 1
}

owner() {
  local port="$1" pids pid
  pids=$(listening_pids "$port")
  if [ -z "$pids" ]; then
    echo "port $port: free"
    return
  fi
  for pid in $pids; do
    echo "port $port: pid=$pid cwd=$(cwd_of "$pid") cmd=$(command_of "$pid")"
  done
}

stop() {
  local port="$1" listeners tree pid survivors
  listeners=$(listening_pids "$port")
  if [ -z "$listeners" ]; then
    echo "port $port: already free"
    return
  fi
  owner "$port"
  tree=$(for pid in $listeners; do server_tree "$pid"; done | sort -u)

  kill -TERM $listeners 2>/dev/null || true
  if wait_until_gone "$port" 20 $tree; then
    echo "port $port: stopped"
    return
  fi

  survivors=$(alive $tree)
  echo "port $port: still running after SIGTERM to listener, sending SIGTERM to$survivors"
  kill -TERM $survivors 2>/dev/null || true
  if wait_until_gone "$port" 10 $tree; then
    echo "port $port: stopped"
    return
  fi

  survivors=$(alive $tree)
  echo "port $port: still running, sending SIGKILL to$survivors"
  kill -KILL $survivors 2>/dev/null || true
  if wait_until_gone "$port" 10 $tree; then
    echo "port $port: stopped"
    return
  fi

  echo "port $port: could not be freed" >&2
  owner "$port" >&2
  exit 1
}

[ $# -eq 2 ] || usage
case "$1" in
  owner) owner "$2" ;;
  stop) stop "$2" ;;
  *) usage ;;
esac
