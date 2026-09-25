---
name: open-pr
description: Open a pull request in cardcase following the repo's PR conventions — draft only, Conventional Commit title scoped to the changed area, and a description limited to "Closes #x". Use whenever creating or opening a PR in this repo, including as the final step of other workflows.
---

# Open PR

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
