# Card Case

![status](https://img.shields.io/badge/status-under%20construction-yellow)

> 🚧 This project is under active development and not yet feature-complete.

A virtual case to store and track gift cards 🎁, flight credits ✈️, and other cash-like accounts 💸.

## Development

### Backend

#### Requires

- [uv](https://docs.astral.sh/uv/)
- [Docker](https://www.docker.com/)
- [Make](https://www.gnu.org/software/make/)

#### Backend Setup

Change into the `backend` directory:

```
cd backend
```

Setup the project environment. This will install dependencies, create a `.env` file, start local Postgres, and run migrations:

```
make setup
```

Start the Django server:

```
uv run manage.py runserver
```

### Web Frontend

#### Requires

- [Node.js](https://nodejs.org/) (see `web/.nvmrc` for the version)
- [pnpm](https://pnpm.io/)

#### Frontend Setup

Change into the `web` directory:

```
cd web
```

Copy the example env file:

```
cp .env.example .env
```

Install dependencies:

```
pnpm install
```

Start the dev server (the backend must also be running for login to work):

```
pnpm dev
```

### Git Hooks

To install a pre-commit hook that lints and formats staged files on each commit, for both the backend and the web frontend, run from the repo root:

```
uv run --project backend pre-commit install
```

This is the repo's single hook manager — it runs `ruff` on staged backend files and `lint-staged` on staged web files.

See [DESIGN.md](DESIGN.md) for the project spec, and [docs/](docs/) for other documentation.
