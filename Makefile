.PHONY: setup setup-backend setup-web dev-backend dev-web up down reset logs
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

# Run the full stack in Docker on unused ports so several copies can run side by side.
# Each copy gets its own *.localhost hostname, since browsers share localhost cookies across ports.
up: .docker-build.stamp
	@set -- $$(python3 scripts/available_ports.py 2) && host=cardcase-$$1.localhost && \
	APP_HOST=$$host WEB_PORT=$$1 BACKEND_PORT=$$2 $(compose) up -d --renew-anon-volumes --wait && \
	echo "==> App running at http://$$host:$$1" && \
	echo "==> Backend running at http://$$host:$$2"

# Rebuild images only when their build inputs change, since source is bind-mounted.
.docker-build.stamp: compose.yml backend/Dockerfile backend/.dockerignore backend/pyproject.toml backend/uv.lock \
	web/Dockerfile web/.dockerignore web/package.json web/pnpm-lock.yaml
	BUILDX_NO_DEFAULT_ATTESTATIONS=1 $(compose) build
	@touch $@

down:
	$(compose) down

reset:
	$(compose) down -v

logs:
	$(compose) logs -f
