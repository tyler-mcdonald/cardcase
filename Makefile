.PHONY: setup setup-backend setup-web dev-backend dev-web up down logs
.NOTPARALLEL:

compose = docker compose --env-file backend/.env.example

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
	@set -- $$(python3 scripts/available_ports.py 2) && \
	WEB_PORT=$$1 BACKEND_PORT=$$2 $(compose) up -d --build --wait && \
	echo "==> App running at http://localhost:$$1" && \
	echo "==> Backend running at http://localhost:$$2"

down:
	$(compose) down -v

logs:
	$(compose) logs -f
