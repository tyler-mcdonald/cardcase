# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Installing new dependencies

All dependencies in this project are managed with `uv`.

Before adding a new dependency, always ask the user which version constraint
they want to use, per uv's `--bound` styles:

- **major** — allow any version within the same major version
- **minor** — allow any version within the same minor version
- **exact** — pin to the exact version
- **none** — no upper bound

Do not guess or default this — the user must choose.

Once the user has chosen, add the package with:

```
uv add <package> --bounds <major|minor|exact|none>
```

## Test layout

Tests live under `tests/`, mirroring the app structure (`tests/<app>/test_*.py`) —
not co-located inside each app. Project-level tests not owned by a single app live
directly under `tests/` (e.g. `tests/test_health.py`).

mypy is strict by default for everything under `tests/`, including shared test
infrastructure (helpers, not test cases) — there is no directory-based exemption,
so a misplaced or forgotten helper can't silently lose type coverage. Each actual
`test_*.py` file opts itself out of the annotation requirement (not the type
checking itself) with a header comment:

```python
# mypy: disable-error-code="no-untyped-def, no-untyped-call"
```

By convention, shared test infrastructure still lives under `tests/support/`
(mirroring app structure at any depth, e.g. `tests/support/users/helper.py`) to
keep it separate from test cases — but that's organizational only; it's not what
makes mypy strict there. Strictness comes from simply not adding the header.
