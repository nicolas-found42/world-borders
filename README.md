# World Borders

A visual globe and timeline for historical borders. The first pilot covers the
United States, Canada, Mexico, and selected predecessor territories. Application
code is GPL-3.0-only; geographic data retains its individual source licenses.

## Run locally

```sh
npm install
npm run dev
```

The four snapshot files are included, so the app needs no historical data service,
API key, account, or AI call at runtime. Fonts are served locally.

## Project specification

See [SPEC.md](SPEC.md) for the detailed product, data, architecture, Jev/TypeSafe,
testing, and release requirements. Planned AI features are separate from the
current static prototype. The [Jev experiment report](research/JEV_SPEC_EXPERIMENTS.md)
and [recorded results](research/jev-spec-experiments.json) document the live probes
used to develop the specification, including failures and unresolved judgments.

## Controls

- Drag the globe to orbit; scroll over the globe to zoom.
- Drag or scroll the timeline to scrub and pause.
- Play/pause advances time chronologically at the selected years-per-second speed.
- Previous/next jumps between available snapshots.
- Space toggles playback; arrow keys step years; Shift + arrow steps ten years.
- The camera stays under your control during playback.
- Sources and coverage opens the exact coverage and attribution details.

## Historical coverage

The timeline runs from 1776 to 2026, but the pilot contains only **1880, 1938,
1960, and 2010** snapshots. Unsupported years intentionally show
neutral physical land with no historical territory polygons. This is a working
renderer and data-pipeline milestone, not a completed historical atlas.

Only the **1880 Canada and Newfoundland** polygons come from the official Natural
Resources Canada historical GIS service. Provincial geometries are dissolved so
internal boundaries are not drawn. Other regions use generalized Historical
Basemaps reference geometry and have not undergone complete independent boundary
review. Early colonial shapes represent claims; they do not establish effective
control or erase Indigenous territories. A verified disputed-border layer and
complete nearby-island coverage remain future work.

Ownership checks independently confirm Hawaii is outside the US in 1880 and
inside it in 1938, and Newfoundland is outside Canada in 1880/1938 and inside it
in 1960/2010. The checks do not establish survey-grade coordinate accuracy.

The 1783, 1800 and 1815 candidates were excluded because their polygons place
Jacksonville, Florida within the US before the 1821 transfer. The 1815 and 1900
candidates also place Newfoundland within Canada before it joined in 1949.
Exclusions and primary evidence links are recorded in the manifest. These dates
remain unavailable until correctly sourced geometry can replace them.

See [DATA_SOURCES.md](DATA_SOURCES.md) and `public/data/manifest.json` for provenance,
licenses, input URLs and SHA-256 hashes. Source polygons retain their coordinates;
the renderer adapts ring orientation to D3's spherical convention, including holes
and date-line crossings. No intermediate historical boundary is generated.

## Development

```sh
npm test
npm run build
npm run test:e2e
```

Browser tests use a fresh production preview on port 5187, with one worker and no
reuse of an existing server. A Playwright Chromium installation is required for
browser tests. Unit tests cover unsupported dates, temporal bounds, holes,
date-line wrapping, Canadian triangulation size, provenance and sourced ownership
checks. Browser tests exercise real playback, camera movement and preservation,
wheel gestures, snapshot selection, dialogs and a narrow viewport.

To rebuild the geographic bundle, run `npm run data:build`. Verbatim downloads
are cached in `.data-cache/`. Published snapshot files and input hashes are tracked
in Git. Deleting the cache and rebuilding may fetch newer upstream versions;
review the resulting changes before accepting them. Source revisions may change,
and the service cannot be presumed available indefinitely.

## Architecture

React, TypeScript and Vite own the interface and time state. `react-globe.gl`
and Three.js render the globe. A data manifest keeps geometry and coverage
independent of the renderer, allowing additional countries, valid intervals and
separate boundary layers to be added without changing camera controls. The first
release is entirely static.
