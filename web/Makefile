.PHONY: setup check-node-installed check-pnpm-installed install-dependencies
.NOTPARALLEL:

require = $(1) >/dev/null 2>&1 || { echo "$(2)"; exit 1; }

setup: check-node-installed check-pnpm-installed .env install-dependencies

check-node-installed:
	@echo "==> Checking if Node.js is installed"
	@$(call require,command -v node,Node.js is not installed: https://nodejs.org/)

check-pnpm-installed:
	@echo "==> Checking if pnpm is installed"
	@$(call require,command -v pnpm,pnpm is not installed: https://pnpm.io/)

.env: | .env.example
	@echo "==> Copying .env.example to .env"
	cp .env.example .env

install-dependencies:
	@echo "==> Installing dependencies"
	pnpm install
