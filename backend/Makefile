.PHONY: setup check-uv-installed check-docker-installed initialize-dot-env-file install-dependencies docker-compose-up migrate-db start-django-server

setup: migrate-db

check-uv-installed:
	@command -v uv >/dev/null 2>&1 || { \
		echo "uv is not installed: https://docs.astral.sh/uv/getting-started/installation/"; \
		exit 1; \
	}

check-docker-installed: check-uv-installed
	@command -v docker >/dev/null 2>&1 || { \
		echo "docker is not installed: https://www.docker.com/"; \
		exit 1; \
	}
	@docker info >/dev/null 2>&1 || { \
		echo "docker is installed but not running - start Docker Desktop and try again"; \
		exit 1; \
	}

initialize-dot-env-file: check-docker-installed
	@test -f .env || cp .env.example .env

install-dependencies: initialize-dot-env-file
	uv sync

docker-compose-up: install-dependencies
	docker compose up -d --wait

migrate-db: docker-compose-up
	uv run manage.py migrate

start-django-server:
	uv run manage.py runserver
