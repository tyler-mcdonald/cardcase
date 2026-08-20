.PHONY: setup check-uv-installed check-docker-installed initialize-dot-env-file install-dependencies docker-compose-up migrate-db

# Force `setup` to call each command in order, since `migrate-db` is the last command.
setup: migrate-db

check-uv-installed:
	@echo "==> Checking if uv is installed"
	@command -v uv >/dev/null 2>&1 || { \
		echo "uv is not installed: https://docs.astral.sh/uv/getting-started/installation/"; \
		exit 1; \
	}

check-docker-installed: check-uv-installed
	@echo "==> Checking if Docker is installed"
	@command -v docker >/dev/null 2>&1 || { \
		echo "docker is not installed: https://www.docker.com/"; \
		exit 1; \
	}
	@echo "==> Checking if Docker is running"
	@docker info >/dev/null 2>&1 || { \
		echo "docker is installed but not running - start Docker Desktop and try again"; \
		exit 1; \
	}

initialize-dot-env-file: check-docker-installed
	@if [ -f .env ]; then \
		echo "==> .env already exists, skipping"; \
	else \
		echo "==> Copying .env.example to .env"; \
		cp .env.example .env; \
	fi

install-dependencies: initialize-dot-env-file
	@echo "==> Installing dependencies"
	uv sync

docker-compose-up: install-dependencies
	@echo "==> Bringing up Docker containers"
	docker compose up -d --wait

migrate-db: docker-compose-up
	@echo "==> Running Django migrations"
	uv run manage.py migrate
