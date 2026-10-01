# Card Case

![status](https://img.shields.io/badge/status-under%20construction-yellow)

> 🚧 This project is under active development and not yet feature-complete.

A virtual case to store and track gift cards 🎁, flight credits ✈️, and other cash-like accounts 💸.

## Development

- This project uses [Make](https://www.gnu.org/software/make/) for local setup.
- The backend uses [uv](https://docs.astral.sh/uv/) for package management and [Docker](https://www.docker.com/) for local Postgres.
- The frontend uses the [pnpm](https://pnpm.io/) package manager. 

### Environment Setup

From the repo's root, set up both the backend and the web frontend:

```
make setup
```

Or set up just one:

```
make setup-backend
make setup-web
```

Seed the database

```
uv run --directory backend manage.py seed_dev --email you@example.com
```

Start the Django server

```
uv run --directory backend manage.py runserver
```

Start the web dev server

```
pnpm --dir web dev
```

### Git Hooks

To install a pre-commit hook that lints and formats staged files on each commit, for both the backend and the web frontend, run from the repo root:

```
uv run --project backend pre-commit install
```
