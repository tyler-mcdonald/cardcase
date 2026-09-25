---
name: open-pr
description: Use when opening all pull requests (PRs) yourself or as directed by the user.
---

# Open PR

Follow these conventions for every PR opened in this repo, including when a PR is opened as the final step of
another workflow.

PRs into `main` are squashed and merged, landing as a single commit. As such, the PR title should follow
the Conventional Commit style.

- Always open PRs as drafts (`gh pr create --draft`). Never mark a PR as ready for review — the user does that manually.
- Use Conventional Commits for all PR titles, scoped according to where the changes were made in the repo:
  - Examples:
    - `fix(backend): serve static assets with whitenoise`
    - `feat(backend): add user authentication`
    - `docs: update claude instructions for PR titles`
- Do not add a description other than "Closes #x" to reference the issue, unless explicitly requested by the user.
- PR Titles should not exceed 50 characters.
