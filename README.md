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
- [Make](https://www.gnu.org/software/make/)

#### Frontend Setup

Change into the `web` directory:

```
cd web
```

Setup the project environment. This will create a `.env` file and install dependencies:

```
make setup
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
