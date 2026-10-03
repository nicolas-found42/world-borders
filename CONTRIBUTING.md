# Contributing

## Start from current main

Inspect `git status` and preserve existing work. Then run:

```sh
git switch main
git pull --ff-only origin main
git switch -c codex/describe-the-change
```

Use short-lived branches and small pull requests. Use Node 24 (see `.node-version`),
`npm ci`, and the committed lockfile. Run `npm run format`, `npm run check`,
`npx playwright install chromium`, then `npm run test:e2e`. Development and preview
URLs use `/world-borders/`; `APP_BASE_PATH=/` supports root hosting.

## Issues and pull requests

Use GitHub Issues and the five [triage labels](docs/agents/triage-labels.md).
Agents follow the `issue-authoring` skill for issues and the `pr` skill for PRs.
Describe the need, before/after behavior, acceptance criteria and real verification.
Do not claim a screenshot, command or hosted check passed unless inspected.

Before merge, inspect the final diff and remote checks. Main requires `verify` and
`dependencies`, an up-to-date branch, a pull request and resolved conversations.
There is no external-review count requirement for this solo-maintained project.
Use conventional commit titles (`feat`, `fix`, `chore`, `ci`, `test`, `refactor`,
`doc`, `perf`, `build`, `style`, `revert`) and squash merge. GitHub deletes merged
branches. Verify the merge commit, main CI/deployment and linked issue state.

## Checks and deployment

Every PR runs the same Ubuntu/Node 24 lint, formatting, unit/data, production build,
bundle budget and Chromium checks. Dependency review rejects newly introduced high
or critical vulnerabilities. Browser tests run serially with no retry; failures
retain traces/screenshots and an HTML report for 14 days. Weekly/manual Firefox
runs provide compatibility evidence without delaying every PR.

A successful main build uploads the tested `dist` artifact and deploys that exact
artifact to GitHub Pages. Deployment verifies `build-info.json` matches the commit,
fetches every snapshot and exercises the public globe. Deployments are serialized.
To roll back, revert the offending PR through another checked PR; this creates an
inspectable new revision and redeploys it. Do not force-push main.

Actions are pinned to full commit SHAs. Workflow tokens default to read-only;
Pages deploy alone receives Pages write and OIDC permissions. CodeQL uses GitHub's
default setup. Never expose secrets to a PR workflow or execute fork code in
`pull_request_target`.

## Dependencies and bundle size

Dependabot checks npm and Actions weekly. Minor/patch version updates are grouped;
major npm updates need individual review. npm version updates have a seven-day
cooldown; security updates are separate. Review release notes, diff and all CI
results before merging. Keep automatic merges disabled until representative bot
updates have passed this process. Commit package and lockfile changes together.

The aggregate gzip size of built JavaScript must stay below the budget in
`bundle-budget.json`. Its baseline is the initial globe build. A budget increase
requires measured before/after sizes and an explanation in the PR. A passing size
budget does not replace runtime or browser checks.

## Geographic data

Source updates require provenance, licensing, coverage/exclusion review and visual
comparison for every affected year. Historical ownership and disputed boundaries
need primary evidence; a model judgment or upstream hash alone cannot establish
historical correctness. Keep unsupported dates empty. Published data changes go
through a reviewed PR and the normal checks before deployment.
