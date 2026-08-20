# card-case

A virtual case to store and track gift cards, flight credits, and other cash-like accounts.

## Development

### Backend

#### Requires

- [uv](https://docs.astral.sh/uv/)
- [Docker](https://www.docker.com/)
- [Make](https://www.gnu.org/software/make/)

#### Backend Server Setup

Move into the `backend` directory:

```
cd backend
```

Setup the project environment. This will install dependencies, create `.env` file, start local Postgres, and run migrations:

```
make setup
```

Start the Django server:

```
uv run manage.py runserver
```

#### Optional Dev Tools

To install a pre-commit hook that lints and formats staged files on each commit:

```
uv run pre-commit install
```

See [DESIGN.md](DESIGN.md) for the project spec.
