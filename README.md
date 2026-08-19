# card-case
A virtual case to store and track gift cards, flight credits, and other cash-like accounts. 

## Development

Requires [uv](https://docs.astral.sh/uv/) and [Docker](https://www.docker.com/).

```
cd backend
make setup
```

This installs dependencies, copies `.env.example` to `.env`, starts local Postgres, runs migrations, and starts the dev server. Visit `/admin` to confirm it's running.

Optionally, run `uv run pre-commit install` in `backend/` to lint and format staged files on each commit.

See [DESIGN.md](DESIGN.md) for the project spec.
