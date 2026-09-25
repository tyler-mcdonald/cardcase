# Card Case

![status](https://img.shields.io/badge/status-under%20construction-yellow)

> 🚧 This project is under active development and not yet feature-complete.

A virtual case to store and track gift cards 🎁, flight credits ✈️, and other cash-like accounts 💸.

## Development

### Requires

- [uv](https://docs.astral.sh/uv/)
- [Docker](https://www.docker.com/)
- [Node.js](https://nodejs.org/) (see `web/.nvmrc` for the version)
- [pnpm](https://pnpm.io/)
- [Make](https://www.gnu.org/software/make/)

### Setup

From the repo root, set up both the backend and the web frontend:

```
make setup
```

Or set up just one:

```
make setup-backend
make setup-web
```

Backend setup creates a `.env` file, installs dependencies, starts local Postgres, and runs migrations. Web setup creates a `.env` file and installs dependencies.

### Seed dev data

Seed a user with sample accounts. Log in with that email; the login code is printed to the runserver console:

```
cd backend
uv run manage.py seed_dev --email you@example.com
```

### Running

Start the Django server:

```
cd backend
uv run manage.py runserver
```

Start the web dev server (the backend must also be running for login to work):

```
cd web
pnpm dev
```

### Git Hooks

To install a pre-commit hook that lints and formats staged files on each commit, for both the backend and the web frontend, run from the repo root:

```
uv run --project backend pre-commit install
```
