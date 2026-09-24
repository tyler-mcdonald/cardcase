.PHONY: setup check-node-installed check-pnpm-installed initialize-dot-env-file install-dependencies

# Force `setup` to call each command in order, since `install-dependencies` is the last command.
setup: install-dependencies

check-node-installed:
	@echo "==> Checking if Node.js is installed"
	@command -v node >/dev/null 2>&1 || { \
		echo "Node.js is not installed: https://nodejs.org/"; \
		exit 1; \
	}

check-pnpm-installed: check-node-installed
	@echo "==> Checking if pnpm is installed"
	@command -v pnpm >/dev/null 2>&1 || { \
		echo "pnpm is not installed: https://pnpm.io/"; \
		exit 1; \
	}

initialize-dot-env-file: check-pnpm-installed
	@if [ -f .env ]; then \
		echo "==> .env already exists, skipping"; \
	else \
		echo "==> Copying .env.example to .env"; \
		cp .env.example .env; \
	fi

install-dependencies: initialize-dot-env-file
	@echo "==> Installing dependencies"
	pnpm install
