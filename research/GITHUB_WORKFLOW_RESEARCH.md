# GitHub workflows for world-borders: research and adoption plan

**Research date:** 2026-10-02

**Scope:** First-party GitHub Actions workflows, dependency update configuration, and contributor/PR guidance in seven public mapping and geospatial visualization repositories. The sample includes a direct React/TypeScript/Vite app, geospatial applications, the direct `react-globe.gl` dependency, and mapping-library references. Peer-repository citations point to fixed commit snapshots. The recommendations also use live first-party platform documentation and an inspected world-borders baseline.

**Recommendation:** adopt short PR branches and protected main, a small Linux/Node LTS pipeline that runs the existing unit/build/browser checks, weekly grouped Dependabot updates with reviewed merges, and Pages deployment of the tested main artifact after fixing subpath data URLs. Keep geographic source refresh in its own reviewed workflow. The sections below distinguish observed peer practices from our proposed policy; implementation is not part of this research.

## What the sample covers

Maputnik is a direct stack match in this sample: its README identifies it as a TypeScript and React map-style editor, and its manifest lists Vite, TypeScript, and Playwright. Pharos and GeoLibre are interactive geospatial applications/platforms with build and deployment workflows. Kepler.gl and TerriaJS provide larger data-mapping platform comparisons. `react-globe.gl` is the direct visualization dependency; MapLibre GL JS is a core library reference. Library release engineering is not directly comparable to deploying a small app.

The configurations show several distinct patterns: PR checks with separate deploy jobs, staging and production branches, test workloads split by cost, Dependabot update groups, and manual or release-triggered publishing. These are observations about repository files, not claims about branch protection or required checks.

### Inspected source snapshots

| Repository                                                                                                                | Role in this comparison                     | Default-branch commit inspected (commit date, UTC) |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------- |
| [maplibre/maputnik](https://github.com/maplibre/maputnik/commit/e172e6c6fcde4b39ff529f23236c6d2ced48346e)                 | React/TypeScript/Vite/Playwright map editor | `e172e6c` (2026-10-02)                             |
| [vasturiano/react-globe.gl](https://github.com/vasturiano/react-globe.gl/commit/6dbcf2113880d6fa0c68d6e8932e2bb4fb2df0ba) | Direct globe visualization dependency       | `6dbcf21` (2026-05-16)                             |
| [Juliusolsson05/pharos-ai](https://github.com/Juliusolsson05/pharos-ai/commit/3c56e90057531b118c36e2a740f9ecf270d6659f)   | Geopolitical monitoring app                 | `3c56e90` (2026-05-16)                             |
| [opengeos/GeoLibre](https://github.com/opengeos/GeoLibre/commit/8d2b2f5e7a828050a7d2f1f4383ae37ff2187cfb)                 | Geospatial platform                         | `8d2b2f5` (2026-10-02)                             |
| [keplergl/kepler.gl](https://github.com/keplergl/kepler.gl/commit/e55768c72231d4b79bdedd25b5b1fe5f37487b19)               | Geospatial data-analysis tool               | `e55768c` (2026-09-30)                             |
| [TerriaJS/terriajs](https://github.com/TerriaJS/terriajs/commit/12eca3795bc0f6acc514c90ae987e59c7a13e0e8)                 | 2D/3D geospatial platform                   | `12eca37` (2026-09-30)                             |
| [maplibre/maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js/commit/c842c3bd6cf90288a4d7056304400ceb4b6465d1)     | Core map-rendering library reference        | `c842c3b` (2026-10-02)                             |

### GitHub Actions referenced

This table records action references in the inspected workflows. For SHA-pinned references, the table reports the action name and the YAML's version comment; the linked workflow contains the exact commit SHA.

| Repository       | Action references observed                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Maputnik         | `actions/checkout` v7.0.1, `actions/setup-node` v7.0.0, `actions/upload-artifact` v7.0.1, `codecov/codecov-action` v7.1.1, `peaceiris/actions-gh-pages` v4.1.0, `docker/login-action` v4.6.0; actions are SHA-pinned. [CI](https://github.com/maplibre/maputnik/blob/e172e6c6fcde4b39ff529f23236c6d2ced48346e/.github/workflows/ci.yml) · [deploy](https://github.com/maplibre/maputnik/blob/e172e6c6fcde4b39ff529f23236c6d2ced48346e/.github/workflows/deploy.yml)                       |
| `react-globe.gl` | No GitHub Actions workflows were present in the inspected repository tree. Its package scripts build the library with Rollup. [package manifest](https://github.com/vasturiano/react-globe.gl/blob/6dbcf2113880d6fa0c68d6e8932e2bb4fb2df0ba/package.json) · [tree](https://github.com/vasturiano/react-globe.gl/tree/6dbcf2113880d6fa0c68d6e8932e2bb4fb2df0ba)                                                                                                                            |
| Pharos           | `actions/checkout@v4`, `actions/setup-node@v4`; tags, not SHAs. [CI](https://github.com/Juliusolsson05/pharos-ai/blob/3c56e90057531b118c36e2a740f9ecf270d6659f/.github/workflows/ci.yml)                                                                                                                                                                                                                                                                                                  |
| GeoLibre         | `actions/checkout@v7`, `actions/setup-node@v7`, `actions/cache@v6`, `actions/upload-artifact@v7`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`; the desktop test workflow also uses SHA-pinned Tauri and Rust setup actions. [CI](https://github.com/opengeos/GeoLibre/blob/8d2b2f5e7a828050a7d2f1f4383ae37ff2187cfb/.github/workflows/ci.yml) · [Pages](https://github.com/opengeos/GeoLibre/blob/8d2b2f5e7a828050a7d2f1f4383ae37ff2187cfb/.github/workflows/pages.yml) |
| Kepler.gl        | `actions/checkout@v4`, `volta-cli/action@v4`, `actions/cache@v4`; the test workflow also references `coverallsapp/github-action@master`. [test workflow](https://github.com/keplergl/kepler.gl/blob/e55768c72231d4b79bdedd25b5b1fe5f37487b19/.github/workflows/test.yml)                                                                                                                                                                                                                  |
| TerriaJS         | `actions/checkout` v7.0.0, `actions/setup-node` v6.4.0, `pnpm/action-setup` v6.1.0, and Google auth/GKE actions v3; these are SHA-pinned with version comments. [CI](https://github.com/TerriaJS/terriajs/blob/12eca3795bc0f6acc514c90ae987e59c7a13e0e8/.github/workflows/ci.yml) · [deploy](https://github.com/TerriaJS/terriajs/blob/12eca3795bc0f6acc514c90ae987e59c7a13e0e8/.github/workflows/deploy.yml)                                                                             |
| MapLibre GL JS   | SHA-pinned `actions/checkout` v7.0.1, `actions/setup-node` (annotated v4), and `actions/upload-artifact` v7.0.1; Dependabot automation uses SHA-pinned `dependabot/fetch-metadata` v3.1.0. [tests](https://github.com/maplibre/maplibre-gl-js/blob/c842c3bd6cf90288a4d7056304400ceb4b6465d1/.github/workflows/test-all.yml) · [auto-merge](https://github.com/maplibre/maplibre-gl-js/blob/c842c3bd6cf90288a4d7056304400ceb4b6465d1/.github/workflows/auto-merge-dependabot.yml)          |

## Repository findings

### Maputnik — React, TypeScript, Vite map editor

The CI workflow runs on pull requests and pushes to `main`. It builds and lints on Ubuntu, Windows, and macOS, runs unit tests, and runs Playwright browser tests both against the dev server and a Docker container. It uploads build artifacts, coverage, and the Playwright report. A separate workflow deploys the `main` build to GitHub Pages and pushes a container image to GHCR. [CI](https://github.com/maplibre/maputnik/blob/e172e6c6fcde4b39ff529f23236c6d2ced48346e/.github/workflows/ci.yml) · [deploy](https://github.com/maplibre/maputnik/blob/e172e6c6fcde4b39ff529f23236c6d2ced48346e/.github/workflows/deploy.yml)

Dependabot checks npm packages and GitHub Actions daily. It groups React and Vitest updates and applies cooldowns. A separate workflow approves and enables squash auto-merge for Dependabot PRs. The README describes a manual release process: update the changelog, dispatch a version-bump workflow that opens a PR, then merge that PR to trigger the release and asset upload. [Dependabot config](https://github.com/maplibre/maputnik/blob/e172e6c6fcde4b39ff529f23236c6d2ced48346e/.github/dependabot.yml) · [auto-merge workflow](https://github.com/maplibre/maputnik/blob/e172e6c6fcde4b39ff529f23236c6d2ced48346e/.github/workflows/auto-merge-dependabot.yml) · [release and development guide](https://github.com/maplibre/maputnik/blob/e172e6c6fcde4b39ff529f23236c6d2ced48346e/README.md)

Its PR checklist asks for a change summary, linked issues, before/after images for visual changes, tests for new behavior, and a changelog entry. The README documents `npm run test` for Playwright, `npm run test-unit` for Vitest, plus lint and production-build commands. [PR template](https://github.com/maplibre/maputnik/blob/e172e6c6fcde4b39ff529f23236c6d2ced48346e/.github/PULL_REQUEST_TEMPLATE.md) · [package scripts and contributor guide](https://github.com/maplibre/maputnik/blob/e172e6c6fcde4b39ff529f23236c6d2ced48346e/package.json)

### `react-globe.gl` — direct visualization dependency

At the inspected commit, the package manifest lists `globe.gl` as a runtime dependency and Rollup build/prepare scripts. The repository tree contains no `.github/workflows` files or Dependabot/Renovate config. This gives a useful library-scale contrast: a small reusable globe package exposes a build-and-publish package surface, while the application peers below declare PR test and deployment pipelines. [package manifest](https://github.com/vasturiano/react-globe.gl/blob/6dbcf2113880d6fa0c68d6e8932e2bb4fb2df0ba/package.json) · [repository tree at this commit](https://github.com/vasturiano/react-globe.gl/tree/6dbcf2113880d6fa0c68d6e8932e2bb4fb2df0ba)

### Pharos — real-time geopolitical map and dashboard

Pharos documents a `staging` to `main` promotion path: contributors branch from `staging`, open PRs to `staging`, and merge to `main` after verifying staging. PR CI to either branch installs with `npm ci`, runs lint, TypeScript checking, and a production build, then applies database migrations to a clean Postgres service and checks schema drift. Pushes to `staging` or `main` run separate migration workflows for the corresponding environment. [contribution procedure](https://github.com/Juliusolsson05/pharos-ai/blob/3c56e90057531b118c36e2a740f9ecf270d6659f/CONTRIBUTING.md) · [CI](https://github.com/Juliusolsson05/pharos-ai/blob/3c56e90057531b118c36e2a740f9ecf270d6659f/.github/workflows/ci.yml) · [staging deploy](https://github.com/Juliusolsson05/pharos-ai/blob/3c56e90057531b118c36e2a740f9ecf270d6659f/.github/workflows/deploy-staging.yml) · [production deploy](https://github.com/Juliusolsson05/pharos-ai/blob/3c56e90057531b118c36e2a740f9ecf270d6659f/.github/workflows/deploy-production.yml)

A separate workflow runs on a 12-hour schedule or manual dispatch to publish a database snapshot as GitHub release assets. The contributor guide asks for focused PRs, a clear description, green CI, and `Fixes #…` / `Closes #…` issue references; it documents database migration creation and verification. [snapshot workflow](https://github.com/Juliusolsson05/pharos-ai/blob/3c56e90057531b118c36e2a740f9ecf270d6659f/.github/workflows/publish-db-snapshot.yml) · [contribution procedure](https://github.com/Juliusolsson05/pharos-ai/blob/3c56e90057531b118c36e2a740f9ecf270d6659f/CONTRIBUTING.md)

No Dependabot or Renovate configuration appeared in the repository tree inspected at this commit. That is a repository-file observation, not proof that GitHub security updates are disabled in repository settings.

### GeoLibre — multi-part geospatial platform

Its CI runs on PRs, pushes to `main`, and manual dispatch. Checks are split into jobs for production-dependency audit, lint and type checks, core Playwright E2E, citation metadata, container smoke tests, app entrypoint checks, and build/test work. A separate Pages workflow builds the application and documentation for PRs, but only deploys when the event is not a PR. A separate labeled or manual workflow builds desktop artifacts for review without publishing them. [CI](https://github.com/opengeos/GeoLibre/blob/8d2b2f5e7a828050a7d2f1f4383ae37ff2187cfb/.github/workflows/ci.yml) · [Pages build and deploy](https://github.com/opengeos/GeoLibre/blob/8d2b2f5e7a828050a7d2f1f4383ae37ff2187cfb/.github/workflows/pages.yml) · [desktop test builds](https://github.com/opengeos/GeoLibre/blob/8d2b2f5e7a828050a7d2f1f4383ae37ff2187cfb/.github/workflows/test-build.yml)

Dependabot runs weekly for npm workspaces, two Python projects, Cargo, and GitHub Actions. It groups security updates separately from routine minor/patch updates. It explicitly ignores a major `bincode` update due to compatibility concerns with persisted files. The contribution guide says to branch from `main`, use Conventional Commits, run pre-commit checks, and use either `npm run ci:web` for frontend-only changes or `npm run ci` for the full gate before opening a PR to `main`. [Dependabot config](https://github.com/opengeos/GeoLibre/blob/8d2b2f5e7a828050a7d2f1f4383ae37ff2187cfb/.github/dependabot.yml) · [contributor guide](https://github.com/opengeos/GeoLibre/blob/8d2b2f5e7a828050a7d2f1f4383ae37ff2187cfb/CONTRIBUTING.md)

### Kepler.gl — geospatial data analysis tool

The main CI workflow runs on pushes and PRs to `master`. On Ubuntu it installs the Yarn workspaces and standalone example/site dependencies, checks circular dependencies, runs TypeScript checks, linting, SQLRooms tests, and test/coverage jobs. Its Vite examples are typechecked in a separate workflow after the npm publish workflow succeeds, or on manual dispatch; the matrix covers the getting-started and DuckDB Vite examples. [test workflow](https://github.com/keplergl/kepler.gl/blob/e55768c72231d4b79bdedd25b5b1fe5f37487b19/.github/workflows/test.yml) · [Vite example typecheck](https://github.com/keplergl/kepler.gl/blob/e55768c72231d4b79bdedd25b5b1fe5f37487b19/.github/workflows/typecheck-vite-examples.yml)

The npm publishing workflow is triggered by creation of a GitHub release and publishes all workspaces. Its developer guide documents a fork plus upstream remote, Yarn/Volta setup, commit-message format, a version-bump and changelog PR, then merging and creating a GitHub release to trigger npm publishing. It describes website preview/prod publishing through Netlify on PR create/update and merge to `master`. [npm publish workflow](https://github.com/keplergl/kepler.gl/blob/e55768c72231d4b79bdedd25b5b1fe5f37487b19/.github/workflows/npmpublish.yml) · [developer guide](https://github.com/keplergl/kepler.gl/blob/e55768c72231d4b79bdedd25b5b1fe5f37487b19/contributing/DEVELOPERS.md)

No Dependabot or Renovate configuration appeared in the repository tree inspected at this commit. Like Pharos, this does not establish the status of GitHub-managed security-update settings.

### TerriaJS — geospatial 2D/3D data platform

CI runs on pushes and PRs, installs the locked pnpm workspace, checks formatting and README parity, builds/lints, then runs Firefox tests under Xvfb. Its deploy workflow runs on pushes and deploys TerriaMap to Google Kubernetes Engine, guarded to the canonical `TerriaJS` repository owner. [CI](https://github.com/TerriaJS/terriajs/blob/12eca3795bc0f6acc514c90ae987e59c7a13e0e8/.github/workflows/ci.yml) · [deploy](https://github.com/TerriaJS/terriajs/blob/12eca3795bc0f6acc514c90ae987e59c7a13e0e8/.github/workflows/deploy.yml)

Dependabot checks GitHub Actions weekly and npm dependencies daily only under `/packages/terriajs-server`; it targets `main` for the Actions entry and `master` for the server packages. The PR template asks for related issues, a description, reviewer test instructions, unit tests, documentation and `CHANGES.md` updates. The contributor guide requires changes to go through PRs, discourages direct commits to `master`, and recommends small changes and tests. The checked repository default branch is `main`, so the guide's references to `master` are stale relative to that metadata snapshot. [Dependabot config](https://github.com/TerriaJS/terriajs/blob/12eca3795bc0f6acc514c90ae987e59c7a13e0e8/.github/dependabot.yml) · [PR template](https://github.com/TerriaJS/terriajs/blob/12eca3795bc0f6acc514c90ae987e59c7a13e0e8/.github/PULL_REQUEST_TEMPLATE.md) · [contributor guide](https://github.com/TerriaJS/terriajs/blob/12eca3795bc0f6acc514c90ae987e59c7a13e0e8/CONTRIBUTING.md)

### MapLibre GL JS — core mapping library reference

The test workflow runs on pushes to `main`, all PRs, and manual dispatch. It runs code hygiene, unit, integration, render, build, and benchmark jobs; larger render jobs are split across operating systems and shards. Dependabot checks npm, GitHub Actions, and docker-compose daily, with grouping and cooldowns. A separate workflow approves and enables squash auto-merge for Dependabot PRs. [test workflow](https://github.com/maplibre/maplibre-gl-js/blob/c842c3bd6cf90288a4d7056304400ceb4b6465d1/.github/workflows/test-all.yml) · [Dependabot config](https://github.com/maplibre/maplibre-gl-js/blob/c842c3bd6cf90288a4d7056304400ceb4b6465d1/.github/dependabot.yml) · [auto-merge workflow](https://github.com/maplibre/maplibre-gl-js/blob/c842c3bd6cf90288a4d7056304400ceb4b6465d1/.github/workflows/auto-merge-dependabot.yml)

Its contributor guide recommends opening an issue for significant bugs and new features; a minor fix can go directly to a PR. For a bug, it describes a failing test in a draft PR, followed by the fix and marking the PR ready. Contributors fork, add the canonical repository as upstream, create a branch, and can rebase onto `main` when needed. Its PR checklist calls for tests, public API documentation, a changelog entry, and before/after visuals for visual changes. [contribution guide](https://github.com/maplibre/maplibre-gl-js/blob/c842c3bd6cf90288a4d7056304400ceb4b6465d1/CONTRIBUTING.md) · [PR template](https://github.com/maplibre/maplibre-gl-js/blob/c842c3bd6cf90288a4d7056304400ceb4b6465d1/.github/PULL_REQUEST_TEMPLATE.md)

This is a library workflow reference: its matrix, benchmark, release, and dependency automation are evidence of the library's needs and scale, not an application-sized default.

## Cross-project observations

- App and platform repositories commonly define PR validation separately from production deployment. Maputnik runs CI on PRs and pushes to `main`, while a separate Pages/GHCR workflow runs on `main` pushes; GeoLibre builds a Pages artifact on PRs but skips deployment; Pharos separates PR validation from branch-specific database migration deployment.
- Several projects split slower or specialized checks from routine PR checks. GeoLibre runs core E2E on PRs and reserves the broader feature suite for scheduled/on-demand/labeled runs. Kepler checks published Vite examples after release rather than on every PR. MapLibre spreads large render testing over OS and shard matrices.
- Update volume is controlled with grouping, open-PR caps, and cooldowns in Maputnik/MapLibre; GeoLibre separates security bumps from grouped routine bumps across its different ecosystems. No Dependabot or Renovate config appeared in the inspected Pharos or Kepler.gl trees, which does not establish their GitHub security-update settings.
- Contributor procedures vary with project scale. The app examples emphasize a feature branch, a focused PR, CI, and issue linkage. The library and data-platform examples add changelogs, release/version steps, benchmarks, database migrations, or explicit review choreography.

## Limits of this evidence

The seven repositories are a purposive comparison, not a survey of all React/globe/map projects. Workflow files and contributor docs were inspected at the linked commits as of 2026-10-02. Workflow YAML establishes declared triggers and steps; it does not establish repository rulesets, required status checks, merge settings, whether runs are green, or how often workflows actually run. Absence of a Dependabot/Renovate file does not establish absence of security alerts or GitHub-managed security updates. Contributor documents may lag behind repository settings or current practice; TerriaJS's `master`/`main` mismatch is one observed example.

## Research method

Firecrawl searches were used to discover candidate map/globe applications and repository workflow pages. Firecrawl scraped primary source files for Maputnik, Pharos, GeoLibre, Kepler.gl, TerriaJS/MapLibre and `react-globe.gl` where available; GitHub's repository API was used to enumerate workflow/config paths and retrieve immutable file contents where Firecrawl indexing/rate limits prevented a complete scrape. Retrieved external text was screened with Jev before inspection. Jev reranked the candidate set and selected the balanced six-project comparison group (0.96 probability); `react-globe.gl` was added as a direct-dependency check. Batched Jev verification checked selected factual workflow claims against retrieved source text. The phrase “closest stack match” was excluded because Jev marked that comparative superlative for review.

### Jev validation record

The source screens recommended pass for the project metadata and source files used here; irrelevant search results were skipped. Jev's selection decision preferred the balanced app/platform/library comparison group over an apps-only set (0.96 vs. 0.04). Eight checked workflow claims had a verified verdict; the only confidence-review result was the word “closest,” which was removed. A follow-up verification pass returned verified for all seven action-reference groups, and a separate pass verified the `react-globe.gl` manifest/tree observation. The immutable GitHub links are the durable peer-source ledger. Local verification artifacts are described below.

## Our repository at the start of this research

The baseline is commit [bc46cb9](https://github.com/nicolas-found42/world-borders/tree/bc46cb9467693fffa0f2036f48c565dfc319e314). The table combines tracked files with authenticated, read-only GitHub API observations on 2026-10-02. Repository settings can change independently of Git commits.

| Area                    | Observed state                                                                                                                                      | Consequence                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| App and package manager | React 19, TypeScript 6, Vite 8, react-globe.gl/Three.js, Turf and d3-geo; npm with package-lock.json                                                | Preserve this stack and lockfile; peers using pnpm/Yarn are examples of process, not a reason to migrate. |
| Existing checks         | Eight Node unit/data tests; build runs TypeScript then Vite; one Playwright scenario covers globe/playback/scrubbing/sources/camera/mobile controls | These commands can become CI checks immediately. There is no configured lint/format script yet.           |
| CI and main             | Actions API returned zero workflows; rulesets API returned an empty list; branch-protection API returned “Branch not protected”                     | Local checks currently provide no enforced GitHub merge gate.                                             |
| Merge settings          | Merge, squash, and rebase all enabled; automatic branch deletion disabled                                                                           | Pick a consistent merge policy.                                                                           |
| Updates and security    | No Dependabot/Renovate file; Dependabot security updates disabled; secret scanning and push protection enabled                                      | Add version updates and enable security updates; preserve the existing secret protection.                 |
| Deployment              | GitHub reports Pages disabled; Vite has no custom base; app fetches root-relative data URLs                                                         | A Pages project deployment needs code and configuration changes first.                                    |
| Runtime                 | No Node pin; local run used Node 26.9.0                                                                                                             | Establish a shared supported CI runtime rather than letting “latest” drift.                               |
| Geographic inputs       | Build-data downloads upstream sources on cache misses, records hashes, and writes committed snapshots                                               | Treat geographic refresh as a reviewed content change, separate from package updates.                     |

File evidence: [package/scripts](https://github.com/nicolas-found42/world-borders/blob/bc46cb9467693fffa0f2036f48c565dfc319e314/package.json), [Playwright configuration](https://github.com/nicolas-found42/world-borders/blob/bc46cb9467693fffa0f2036f48c565dfc319e314/playwright.config.ts), [Vite configuration](https://github.com/nicolas-found42/world-borders/blob/bc46cb9467693fffa0f2036f48c565dfc319e314/vite.config.ts), [data fetches](https://github.com/nicolas-found42/world-borders/blob/bc46cb9467693fffa0f2036f48c565dfc319e314/src/App.tsx), [data builder](https://github.com/nicolas-found42/world-borders/blob/bc46cb9467693fffa0f2036f48c565dfc319e314/scripts/build-data.mjs). API observations used `gh api repos/nicolas-found42/world-borders`, plus `/rulesets`, `/branches/main/protection`, and `/actions/workflows`.

A fresh local run passed `npm test` (8 tests), `npm run build`, and `npm run test:e2e` (1 scenario, 18.0 seconds total). The build warned about its large JavaScript chunk: 2,072.38 kB uncompressed / 594.37 kB gzip. These results used existing local dependencies on macOS/Node 26.9.0; they do not establish a clean `npm ci` result or Linux/Node 24 compatibility. The first CI implementation must establish both.

## Recommended adoption

These are recommendations for world-borders, not settings changed by this research. The initial design should take Maputnik's PR/build/browser/deploy pattern, the peers' focused contribution process, and their explicit dependency maintenance, scaled to our current app.

### 1. Use short branches and protected main

Keep the existing start-of-task rule: inspect/preserve work, switch to `main`, and `git pull --ff-only origin main`. Then create a short task branch such as `codex/add-ci`; continuing an existing PR stays on its task branch. Use the issue-authoring skill for tickets and the PR skill for the description and evidence.

Use this sequence:

1. Open or link an issue for substantive work; make the acceptance criteria observable.
2. Branch from current main and make one coherent change.
3. Open a draft PR early when useful. Include why, the concrete before/after, actual checks, and before/after captures for visual behavior.
4. Require green checks on the current PR merge candidate and require the branch to be current with main.
5. Squash merge, delete the branch, then verify the resulting main checks and deployment. Record the deployed commit so a rollback can identify the prior artifact or revert commit.

Configure a main ruleset with PRs required, required checks, conversation resolution, linear history, and blocked force pushes/deletion. Initially use zero mandatory external approvals: a solo maintainer cannot supply an independent human approval for their own PR. Maintainer review still applies; add a required independent reviewer when there is a real second reviewer. Enable squash merge and automatic branch deletion. Avoid a permanent develop/staging branch until the product actually needs multiple release tracks.

GitHub Flow documents short branches, PR review, merging and deletion. GitHub rulesets explicitly allow requiring a PR without requiring approval, distinguish strict/up-to-date checks, and tie linear history to squash/rebase. These support the mechanism; choosing squash and the initial reviewer count is our recommendation. [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow) · [ruleset rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)

### 2. Establish a small, real CI gate

Start with Ubuntu and Node 24 LTS, reading `24` from a shared `.node-version` or equivalent file. The release page inspected on the research date identifies Node 24 as LTS and Node 26 as Current. Record the resolved runtime in logs; review the LTS major intentionally rather than using an unbounded `lts/*` selector. [Node release policy/status](https://nodejs.org/en/about/previous-releases)

Run on `pull_request` into main and `push` to main, with manual dispatch available. A stable job named `verify` should run:

```sh
npm ci
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e -- --reporter=line,html
```

Playwright already starts a fresh production preview, so build must precede browser testing. Retain the one-worker/SwiftShader setup initially and confirm it on the Linux runner. Upload the HTML report and failure traces even when tests fail, with a short retention period such as 14 days. That retention is a proposed policy, not a peer measurement. The Playwright documentation supplies the install/browser/run/report pattern. [Playwright GitHub Actions guide](https://playwright.dev/docs/ci-intro)

| Action or mechanism                | Proposed role                                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `actions/checkout`                 | Check out the tested commit.                                                                                   |
| `actions/setup-node`               | Select the shared Node major and cache npm's download cache.                                                   |
| `actions/upload-artifact`          | Preserve Playwright report and failure diagnostics.                                                            |
| `actions/dependency-review-action` | On PRs, reject newly introduced high/critical vulnerabilities across runtime, development, and unknown scopes. |
| `actions/configure-pages`          | Configure Pages deployment metadata when Pages is adopted.                                                     |
| `actions/upload-pages-artifact`    | Package the tested `dist/` for Pages.                                                                          |
| `actions/deploy-pages`             | Deploy that artifact from the main-only deployment job.                                                        |

Select a supported stable release of each Action, verify its commit in the owning repository, and pin the full commit SHA with a release-version comment. Peer version numbers in this report are observations, not a promise that they remain current. GitHub recommends immutable SHA pins and minimal token permissions. Start with `contents: read`; grant Pages write/OIDC permissions only to the deployment job. Use unprivileged PR workflows for executing contributions. [GitHub Actions security guidance](https://docs.github.com/en/actions/reference/security/secure-use)

The Node action supports version-file selection and caches package-manager data rather than `node_modules`. [setup-node usage](https://github.com/actions/setup-node#usage)

Make `verify` and the PR `dependencies` check required after they have actually run successfully. Keep those workflow triggers present for every PR; path-filtered required workflows can remain pending forever. Use timeouts and cancel superseded PR runs. If future jobs depend on earlier jobs, ensure the final required status reports prerequisite failures instead of becoming a successful skipped job. [Required-check behavior](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)

The dependency-review severity/scopes policy is a proposed starting point. The action supports these settings, and its default scope is runtime; explicitly including development dependencies matters for a build-based app. It checks the dependency change, while Dependabot alerts cover existing dependencies. [Dependency review action options](https://github.com/actions/dependency-review-action#configuration)

Add lint/format checks only after introducing and validating the corresponding configuration and scripts. Enable CodeQL default setup as a follow-on once the first workflow is stable; this public repository is eligible when Actions is enabled. A full OS/browser matrix, benchmark suite, coverage gate, Docker publishing, and npm release automation can wait for a demonstrated need. [CodeQL default setup](https://docs.github.com/en/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning)

### 3. Use Dependabot first; keep its PRs reviewable

For this one-package npm app, recommend Dependabot for `npm` and `github-actions`, rather than installing two bots or migrating package managers. Renovate is a credible alternative if we later need richer package rules, runtime-version updates, or deliberate lockfile maintenance. It exposes release-age controls, package rules, automerge and lockfile maintenance; that flexibility is useful when the repository needs it. [Dependabot options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference) · [Renovate options](https://docs.renovatebot.com/configuration-options/)

Proposed policy:

- Check version updates weekly, with a small open-PR limit.
- Group compatible families: React/runtime types; Three/globe; build/test tooling. Leave majors outside the minor/patch groups.
- Apply an explicit seven-day cooldown to routine npm version updates. Enable security updates separately; Dependabot's cooldown does not apply to security updates.
- Review rendering and geometry changes manually, including Three's 0.x updates. Our single browser scenario cannot establish full rendering compatibility.
- Initially review all merges. Reconsider narrow patch/digest automerge only after required checks have proved useful; a bot label or approval alone is not adequate evidence.
- Review the Node LTS baseline during maintenance; a Dependabot npm entry does not by itself maintain our proposed Node major file.

This is an illustrative configuration to validate in an implementation PR:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 5
    cooldown:
      default-days: 7
    groups:
      react:
        patterns: ['react', 'react-dom', '@types/react', '@types/react-dom']
        update-types: ['minor', 'patch']
      graphics:
        patterns: ['three', '@types/three', 'react-globe.gl']
        update-types: ['minor', 'patch']
      tooling:
        patterns: ['vite', '@vitejs/plugin-react', 'typescript', '@playwright/test']
        update-types: ['minor', 'patch']
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 3
    groups:
      actions:
        patterns: ['*']
        update-types: ['minor', 'patch']
```

The group definitions default to version updates. Security groups use a separate `applies-to: security-updates` setting if we choose to group those too. Security PRs are not delayed by the version-update cooldown. The seven-day delay and group sizes are our tradeoff between update noise and freshness; they are not guarantees of package safety. [Dependabot groups and cooldown](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)

### 4. Deploy the static app from a tested main artifact

Recommend GitHub Pages for the first production deployment because the current app is a public static bundle with committed data. Use a deployment job in the same workflow as validation, with `needs: verify`, restricted to a push to main. Give it the `github-pages` environment, deploy-specific permissions and serialized deployment concurrency. Upload/deploy the artifact that browser tests exercised. Avoid adding a second unchecked build path that can publish while the checks fail. Vite's guide identifies the official Pages Actions and configuration. [Vite static deployment](https://vite.dev/guide/static-deploy.html#github-pages)

For `https://nicolas-found42.github.io/world-borders/`, the implementation needs:

1. Vite base `/world-borders/`.
2. A shared data URL helper based on `import.meta.env.BASE_URL`, used for manifest, land, selected snapshot and prefetch requests.
3. Browser testing of the production build under that prefix, including all data fetches and the favicon.
4. A post-deployment smoke check for the actual URL, data availability, and expected deployed commit.

The source inspection and a URL-resolution check establish the current issue: `/data/manifest.json` resolves to `https://nicolas-found42.github.io/data/manifest.json`, bypassing the repository prefix. This is a deployment prerequisite inferred from code and URL behavior, not a claim that an existing deployment has failed.

If per-PR visual preview URLs become central to the review process, choose Vercel or Netlify Git integration instead; the Vite deployment guide covers both. The required CI gates still apply. We currently have no evidence of a hosting preference, custom domain, or need for a server, so adding containers or Kubernetes would introduce infrastructure without serving the present app.

### 5. Separate software updates from geographic source updates

Keep ordinary CI and deploys on the committed data. Start a manual `workflow_dispatch` refresh procedure that obtains fresh upstream inputs, regenerates the bundle, checks geometry/provenance/licensing, and opens a data PR. Include old/new source hashes, coverage changes, known exclusions and before/after maps. Review historical interpretation before publishing.

Before adding a schedule, validate cache invalidation and repeatability: the current script reuses `.data-cache`, so a persistent cached run may not observe upstream changes. A later scheduled source-change check can open a PR when changes exist; it should not silently replace and publish boundaries. Current geometry and selected ownership tests are useful but do not prove complete historical correctness. [Existing data builder](https://github.com/nicolas-found42/world-borders/blob/bc46cb9467693fffa0f2036f48c565dfc319e314/scripts/build-data.mjs) · [documented coverage limits](https://github.com/nicolas-found42/world-borders/blob/bc46cb9467693fffa0f2036f48c565dfc319e314/README.md#historical-coverage)

Use Jev to screen fetched source text, assess whether claims are supported, and flag semantic changes for review. Preserve its input/evidence and probability distributions. Required build and test checks should remain deterministic. If AI features need live evaluation, run trusted manual/scheduled evaluations with replay fixtures for normal PRs; that avoids requiring provider secrets on every public fork PR. TypeSafe's citation cookbook separates exact quote presence from contextual support, and its confidence guidance says thresholds need domain-specific evaluation. [Citation checks](https://docs.typesafe.ai/cookbooks/citation_check.md) · [Confidence](https://docs.typesafe.ai/confidence.md)

## Implementation order and acceptance criteria

| Step                                     | Proposed changes                                                                                                                          | Completion evidence                                                                                                                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. CI foundation                         | Shared Node 24 selection; PR/main workflow; locked install, current tests/build/browser scenario; report artifacts                        | A clean Linux install and successful checks on the proposed commit; an intentional failure in a temporary validation branch is reported as failure; report/trace downloads work. |
| 2. Main protection and dependency policy | Required checks after first success; squash/branch deletion policy; Dependabot npm/Actions config and security updates; dependency review | A failing PR cannot merge through the normal path; a representative bot PR runs the same checks; settings are read back after application.                                       |
| 3. Deployment                            | Pages base-aware URLs, prefix browser test, main-only deploy of tested artifact, smoke check                                              | PR does not deploy production; successful main artifact deploys; failed validation prevents deployment; production data URLs and visible globe work.                             |
| 4. Contribution and data process         | CONTRIBUTING, issue templates and PR template aligned with existing authoring skills; manual reviewed data refresh                        | A new contributor can follow the documented branch/test/PR procedure; a sample data refresh has source-hash and visual evidence and reproducible output.                         |
| 5. Further checks justified by evidence  | Lint/format baseline, CodeQL, independent E2E cases, measured bundle regression budget, wider browser coverage when needed                | Checks detect a demonstrated failure and have clear owners/response steps; avoid arbitrary thresholds that fail the existing baseline.                                           |

These steps describe future implementation work. No workflow, bot, branch rule, hosting setting, or app behavior was changed by this research.

## Recommendation decisions and verification

Jev was used throughout discovery and synthesis: source screening, peer relevance/selection, seven bounded adoption decisions, claim verification, and final document review. The TypeSafe citation and confidence documentation was read to guide how judgments were used. The judgments are advice based on supplied evidence, not probabilities that the proposed system will work.

| Decision                     | Jev recommendation                                                    | Returned confidence |
| ---------------------------- | --------------------------------------------------------------------- | ------------------- |
| Initial CI coverage          | One Linux/Node LTS pipeline with real browser checks                  | 1.00                |
| Dependency bot               | Dependabot initially                                                  | 1.00                |
| Git/merge procedure          | Short PR branches and squash merges                                   | 0.99                |
| Initial host recommendation  | GitHub Pages after base-path fixes                                    | 0.89                |
| Geographic data maintenance  | Separate, reviewed refresh                                            | 1.00                |
| Jev in future checks         | Evidence review and trusted evaluations alongside deterministic gates | 1.00                |
| Dependency-merge enforcement | Review first; consider narrow automerge later                         | 1.00                |

The first parent verification batch checked 12 claims; two composite claims were marked for review. The Pages claim was split and checked against an actual URL-resolution command, and the CodeQL eligibility claim was narrowed to the exact documented prerequisite. Both follow-up claims returned verified without review. No unsupported or contradicted claim was retained on that basis. Source-screen review results were inspected for concrete redirection attempts; legitimate documentation examples were treated as data. A broad TypeSafe index result marked irrelevant was skipped in favor of targeted official pages.

The local audit files are under `artifacts/workflow-research/` (already ignored by Git): retrieved platform-source text, Jev decisions/verifications, URL-resolution proof, and the actual local test/build output. The durable deliverable is this one Markdown report. Peer behavior was not executed locally; cited workflows describe their declared procedure, while our reported test results concern only world-borders.

The remaining implementation uncertainties are concrete: clean Linux installation and Node 24 compatibility, WebGL behavior on the hosted runner, production subpath behavior, the real merge-blocking settings, and a tested data-refresh cache policy. The acceptance criteria above are intended to resolve them.
