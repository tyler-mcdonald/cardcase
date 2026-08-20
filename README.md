# card-case
A virtual case to store and track gift cards, flight credits, and other cash-like accounts. 

## Development

Requires:
- [uv](https://docs.astral.sh/uv/)
- [Docker](https://www.docker.com/)
- [Make](https://www.gnu.org/software/make/)

```
cd backend
make setup
```

This installs dependencies, copies `.env.example` to `.env`, starts local Postgres, and runs migrations. Then start the dev server with:

```
uv run manage.py runserver
```

Optionally, run `uv run pre-commit install` in `backend/` to lint and format staged files on each commit.

See [DESIGN.md](DESIGN.md) for the project spec.
