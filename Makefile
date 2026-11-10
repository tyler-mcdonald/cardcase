.PHONY: setup setup-backend setup-web dev-backend dev-web up down logs
.NOTPARALLEL:

export COMPOSE_PROJECT_NAME := cardcase-$(shell git rev-parse --abbrev-ref HEAD | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_-]/-/g')

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
	@set -- $$($(free_ports)); \
	WEB_PORT=$$1 BACKEND_PORT=$$2 docker compose up -d --build --wait && \
	echo "==> App running at http://localhost:$$1"

down:
	docker compose down -v

logs:
	docker compose logs -f
