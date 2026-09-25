.PHONY: setup check-uv-installed check-docker-installed install-dependencies docker-compose-up migrate-db
.NOTPARALLEL:

require-command = command -v $(1) >/dev/null 2>&1 || { echo "$(2)"; exit 1; }

setup: check-uv-installed check-docker-installed .env install-dependencies docker-compose-up migrate-db

check-uv-installed:
	@echo "==> Checking if uv is installed"
	@$(call require-command,uv,uv is not installed: https://docs.astral.sh/uv/getting-started/installation/)

check-docker-installed:
	@echo "==> Checking if Docker is installed"
	@$(call require-command,docker,docker is not installed: https://www.docker.com/)
	@echo "==> Checking if Docker is running"
	@docker info >/dev/null 2>&1 || { \
		echo "docker is installed but not running - start Docker Desktop and try again"; \
		exit 1; \
	}

.env: | .env.example
	@echo "==> Copying .env.example to .env"
	cp .env.example .env

install-dependencies:
	@echo "==> Installing dependencies"
	uv sync --locked

docker-compose-up:
	@echo "==> Bringing up Docker containers"
	docker compose up -d --wait

migrate-db:
	@echo "==> Running Django migrations"
	uv run manage.py migrate
