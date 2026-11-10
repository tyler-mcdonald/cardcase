.PHONY: setup setup-backend setup-web dev-backend dev-web up down logs
.NOTPARALLEL:

project = $(shell b=$$(git symbolic-ref --short -q HEAD || git rev-parse --short HEAD) && h=$$(git rev-parse --show-toplevel | git hash-object --stdin | cut -c1-7) && printf 'cardcase-%s-%s' "$$b" "$$h" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_-]/-/g')
compose = docker compose -p $(or $(project),$(error Could not derive the compose project name from git)) --env-file backend/.env.example

free_ports = python3 -c 'import socket; s = [socket.socket() for _ in range(2)]; [x.bind(("127.0.0.1", 0)) for x in s]; print(*(x.getsockname()[1] for x in s))'

setup: setup-backend setup-web

setup-backend:
	@echo "==> Setting up backend"
	@$(MAKE) --no-print-directory -C backend setup

setup-web:
	@echo "==> Setting up web"
	@$(MAKE) --no-print-directory -C web setup

dev-backend:
	@$(MAKE) --no-print-directory -C backend dev

dev-web:
	@$(MAKE) --no-print-directory -C web dev

up:
	@ports=$$($(free_ports)) && set -- $$ports && \
	WEB_PORT=$$1 BACKEND_PORT=$$2 $(compose) up -d --build --wait && \
	echo "==> App running at http://localhost:$$1"

down:
	$(compose) down -v

logs:
	$(compose) logs -f
