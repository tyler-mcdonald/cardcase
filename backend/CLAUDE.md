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
