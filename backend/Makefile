.PHONY: setup check-uv env sync up migrate run

setup: check-uv env sync up migrate run

check-uv:
	@command -v uv >/dev/null 2>&1 || { \
		echo "uv is not installed: https://docs.astral.sh/uv/getting-started/installation/"; \
		exit 1; \
	}

env:
	@test -f .env || cp .env.example .env

sync:
	uv sync

up:
	docker compose up -d --wait

migrate:
	uv run manage.py migrate

run:
	uv run manage.py runserver
