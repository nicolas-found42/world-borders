# World Borders detailed project specification

This specification defines the historical border globe, the North America pilot, and its expansion into a world timeline. It also defines extensive Jev and TypeSafe use in data preparation, evaluation, and optional visual interaction. It separates the working prototype from requirements for subsequent releases. The audience is the project owner, implementers, data contributors, and reviewers.

Status: implementation specification prepared on 2 October 2026. GitHub Issues, triage labels, required PR checks, source-refresh review, and GitHub Pages deployment verification are configured (issue #1; merged PRs #2, #7 and #14). The first temporal milestone retains the baseline and adds partial Canada 1949 reference coverage; 1776 geometry and independent boundary review remain incomplete. This document specifies future work and does not claim that the proposed AI integrations or expanded historical coverage already exist.

## Problem Statement

The user wants to experience how the world's borders change over time through an attractive, interactive 3D globe. They want to orbit freely, move through a scrollable timeline, and play or pause the passage of time. The experience should communicate through geography, color, and motion, without educational essays, narration, or a history chatbot.

Historical integrity is essential: convincing outlines can assign the wrong polity or date, confuse claims with control, or hide gaps. Sparse maps cannot establish every intervening year. Uncertainty must remain visible.

The first geographic scope is the United States, Canada, and Mexico, including their relevant predecessor polities, mainland territory, Alaska, Hawaii, and nearby islands. A successful pilot must establish a reusable temporal model, rendering approach, source-review process, and testing strategy before expansion to the world. Complete nearby-island coverage is a target; it is not yet achieved.

Use Jev extensively for semantic source work and visual interaction. Code owns arithmetic, geometry, state, and execution. Model confidence is not historical evidence.

## Solution

Build a dark, minimalist globe with a large visible date, restrained territory colors, a compact legend, and a timeline anchored beneath it. The camera belongs to the viewer. Time can advance automatically or be scrubbed manually; manual time navigation pauses playback. Scrolling over the globe zooms, while scrolling over the timeline moves through time.

Start with a small, clearly described North America dataset. Display only geometry supported for the selected time and representation. Where coverage is unavailable, show neutral physical land and a concise coverage status, with a way to jump to an available moment. Source and accuracy details remain accessible in an optional panel.

The Jev data workflow screens text, selects evidence and verbatim values, suggests polity relationships, classifies representations, surfaces contradictions, prioritizes review, and verifies release statements. Preserve typed answers and distributions. Deterministic checks and curators determine publication.

Optional semantic tools select supplied actions, entities, and events from short viewer commands after domain evaluation. Code checks arguments and coverage. The manual globe works when the service is disabled or unavailable.

Creative additions include visual threads through reviewed moments, a comparison of two sourced states, and subtle highlighting of actual changed geometry. These additions use dates, names, colors, and optional evidence metadata rather than educational narration. They are planned features, not changes delivered by this specification task.

## User Stories

### Globe and camera

1. As a viewer, I want a full 3D globe, so that I can experience border changes spatially.
2. As a viewer, I want the initial view centered on North America, so that the pilot is immediately visible.
3. As a viewer, I want to drag to orbit the globe, so that I can inspect any side of it.
4. As a viewer, I want to scroll over the globe to zoom, so that I can move between continental and regional views.
5. As a viewer, I want bounded zoom, so that I cannot lose the globe through accidental scrolling.
6. As a viewer, I want playback to preserve my camera, so that time changes do not interrupt my exploration.
7. As a viewer, I want a reset-view control, so that I can return to a useful North America framing.
8. As a viewer, I want Alaska, Hawaii, and islands to render correctly, so that offshore territory is represented alongside the mainland.
9. As a viewer, I want subtle lighting and readable territory colors, so that the globe remains visually appealing and understandable.
10. As a viewer, I want territory names on hover or focus, so that I can identify the visible polity without an explanatory overlay.
11. As a viewer, I want to emphasize a polity through the legend, so that I can distinguish its territory from neighboring shapes.
12. As a viewer, I want to toggle border outlines, so that I can choose the visual presentation I prefer.

### Timeline and playback

13. As a viewer, I want a timeline starting in 1776 and extending to the release's present, so that I can navigate the intended historical range.
14. As a viewer, I want the selected year displayed prominently, so that the scene always has a clear temporal context.
15. As a viewer, I want to drag the timeline, so that I can move directly to a chosen time.
16. As a viewer, I want scrolling over the timeline to scrub time, so that I can explore without dragging a small control.
17. As a viewer, I want scrubbing to pause playback, so that the selected time stays where I put it.
18. As a viewer, I want play and pause controls, so that I can watch changes or inspect a scene.
19. As a viewer, I want selectable chronological speeds, so that I can choose how quickly years pass.
20. As a viewer, I want playback speed to correspond to elapsed time, so that animation performance does not redefine chronology.
21. As a viewer, I want playback to stop at the end of the range, so that it does not run beyond the available timeline.
22. As a viewer, I want pressing play at the end to restart from the beginning, so that I can begin another pass.
23. As a viewer, I want previous and next available-state controls, so that I can inspect changes even when coverage is sparse.
24. As a viewer, I want visible available-state markers, so that I can distinguish published data from selectable gaps.
25. As a viewer, I want to enter a year directly, so that I can navigate without locating it on the timeline.
26. As a viewer, I want invalid or out-of-range year input handled predictably, so that incomplete typing does not cause an unexpected jump.
27. As a keyboard user, I want play, year-step, and available-state shortcuts, so that I can explore without a mouse.
28. As a viewer returning from a background tab, I want to avoid a large time jump, so that the scene remains comprehensible.

### Historical coverage and evidence

29. As a viewer, I want only temporally supported polygons to appear, so that a neighboring snapshot is not mistaken for evidence about my selected year.
30. As a viewer, I want gaps identified plainly, so that missing borders cannot look like complete historical coverage.
31. As a viewer, I want to jump from a gap to the nearest available state, so that I can continue exploring.
32. As a viewer, I want predecessor polities identified by their period-appropriate identity, so that modern countries do not appear before their formation.
33. As a viewer, I want territorial claims and effective control distinguished, so that the rendering does not imply unsupported administration.
34. As a viewer, I want a sourced dispute overlay when available, so that competing claims can be seen without hiding uncertainty.
35. As a viewer, I want generalized reference geometry identified, so that polished rendering is not mistaken for exact boundary validation.
36. As a viewer, I want optional source, license, and coverage details, so that I can inspect the basis of a scene.
37. As a viewer, I want neutral physical land to remain visible in gaps, so that the globe stays navigable without implying historical sovereignty.
38. As a viewer, I want unsupported years and regions to remain unsupported, so that AI does not manufacture missing history.
39. As a viewer, I want changes to be shown at supported temporal precision, so that a year-level source does not imply a known day of transfer.
40. As a viewer, I want world coverage added consistently after the pilot, so that the same controls and evidence conventions apply beyond North America.

### Optional semantic visual tools

41. As a viewer, I want to request a known place in ordinary language, so that I can frame it without manually orbiting across the globe.
42. As a viewer, I want to request a moment relative to a known event, so that I can navigate without knowing the exact year.
43. As a viewer, I want exact-date requests separated from approximate available moments, so that a sparse snapshot is not silently substituted for an event date.
44. As a viewer, I want to say that playback is too fast, so that the application can select a supported slower speed.
45. As a viewer, I want ambiguous commands to offer a small clarification or candidate choice, so that the app does not guess a camera or date change.
46. As a viewer, I want to dismiss a semantic suggestion, so that I remain in control of the scene.
47. As a viewer, I want a visual thread through reviewed moments matching a theme, so that I can experience related changes without an explanatory lesson.
48. As a viewer, I want sparse jumps in a visual thread identified, so that a curated sequence is not mistaken for continuous chronology.
49. As a viewer, I want to compare two sourced moments, so that the changed territory is easier to perceive.
50. As a viewer, I want changed regions highlighted from actual geometry, so that visual emphasis corresponds to real differences in the selected dataset.
51. As a viewer, I want explicit control over camera focus during a visual thread, so that a discovery tool does not take over ordinary playback.
52. As a viewer, I want the manual globe to work when Jev is unavailable, so that a provider outage does not prevent exploration.

### Contributor and curator workflow

53. As a data contributor, I want imported sources screened before semantic processing, so that embedded instructions cannot redirect the evidence workflow.
54. As a curator, I want evidence passages ranked against a specific claim, so that review begins with relevant material.
55. As a curator, I want missing evidence reported explicitly, so that an irrelevant top-ranked passage is not accepted as support.
56. As a curator, I want effective dates selected verbatim from source candidates, so that signing, publication, and administration dates remain distinct.
57. As a curator, I want extracted values audited against their source, so that fabricated or omitted fields are surfaced before use.
58. As a curator, I want aliases distinguished from predecessor relationships, so that related polities are not merged into one identity.
59. As a curator, I want control, claims, and disputes classified separately, so that an assertion's representation remains explicit.
60. As a curator, I want contradictions and unsupported claims held for review, so that a model cannot resolve a historical conflict by confidence alone.
61. As a curator, I want unknown or incompatible licensing to prevent publication, so that the bundle remains redistributable under its stated terms.
62. As a curator, I want review priorities based on separate evidence and usefulness signals, so that visual appeal cannot compensate for a serious data failure.
63. As a contributor, I want geometry and provenance validation, so that malformed islands, holes, or source links cannot silently enter a release.
64. As a curator, I want review decisions and limitations attached to each boundary state, so that viewers receive honest metadata.
65. As a maintainer, I want recorded Jev inputs, versions, outputs, and usage, so that experiment results can be inspected and reproduced.
66. As a maintainer, I want held-out evaluation and option-order tests, so that apparently confident model errors are caught before automation.
67. As a maintainer, I want deterministic replay in normal tests, so that CI does not depend on a paid model call.
68. As a maintainer, I want explicit live-evaluation commands, so that costs and provider access occur intentionally.
69. As a maintainer, I want credentials confined to trusted server or build processes, so that viewer bundles contain no API secrets.
70. As a maintainer, I want several clear test seams, so that temporal, geometry, semantic, and browser failures can be diagnosed separately.
71. As an open-source contributor, I want source code, eligible data, and licensing information available, so that I can run and extend the project.
72. As a release reviewer, I want completion claims checked against actual artifacts and logs, so that documentation does not overstate delivered features.

## Implementation Decisions

### Scope and release sequence

The product starts in 1776, covers North America before the world, and provides orbit, scrubbing, and play/pause. A small-data milestone is distinct from a complete atlas. Proposed Jev features are future work.

| Stage                        | Deliverable                                                                                                      | Completion condition                                                                                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing baseline            | Interactive globe and four published pilot years                                                                 | Preserve the working controls and explicit coverage gaps. Existing data remains labeled with its actual review status.                                                 |
| Pilot data foundation        | Correctly sourced 1776 starting state, reviewed North America transfers, explicit validity and polity identities | Named evidence and geometric review support every newly published state; excluded wrong-owner shapes stay excluded until replaced.                                     |
| Jev curation pipeline        | Screen, retrieve, extract, audit, classify, reconcile, prioritize, and release checks                            | Recorded judgments, deterministic validation, curator review queue, replay tests, and domain evaluation operate on versioned evidence.                                 |
| Optional semantic navigation | Short commands selecting allowed actions and supplied arguments                                                  | Held-out command tests and action-policy tests pass; errors and unavailable service leave the manual viewer functional.                                                |
| Creative visual tools        | Comparison, changed-region emphasis, and curated visual threads                                                  | Only approved available states are selected; sparse jumps are visible; no narration or unrequested camera motion.                                                      |
| World expansion              | Additional region packs using the same contracts                                                                 | Each pack has independent source, licensing, representation, temporal, and geometry review. No global-completeness claim until an explicit coverage audit supports it. |

Stages express dependencies, not calendar estimates. The current 1880, 1938, 1960, and 2010 states have limited checks, not complete control validation.

### First temporal milestone

The first delivery establishes a versioned boundary-state contract in the static viewer while retaining the four legacy snapshots and their actual review grades. The contract records stable polity and state IDs, geometry source and input hashes, region, representation, temporal precision, evidence links, curator disposition, and limitations. Legacy records remain year-only; migration does not establish effective control or upgrade their review grade.

Validate manifests and every GeoJSON asset at the loader boundary, including source joins, safe local asset paths, finite closed polygon rings, temporal bounds, and publication eligibility. Invalid data produces a recoverable loading error and pauses playback. The viewer clears geometry immediately on a date change and rejects obsolete responses even if a transport ignores cancellation. The dataset revision includes canonical JSON digests for all output geometry assets; the loader verifies them before caching. Versioned caching never joins geometry from a different dataset revision. Errors and loading are distinct from coverage gaps.

Coverage is resolved independently for the requested region and representation. Year-only snapshots match the floored selected year; explicitly evidenced intervals include their start and exclude their end. Missing regions/layers are explicit. Ambiguous overlapping assertions are held as conflicts rather than resolved by list order. Tests use the existing coverage, asset-loader, geometry/ownership, judgment-policy, and browser seams described below, with deterministic fixtures and no paid calls in CI.

The owner selected partial Canada 1949 reference coverage and authorized bounded curator review, an explicit 1776 gap, and delivery. Default political-source viewing includes legacy source-political snapshots and the new legal-affiliation reference. Control, claims and disputes are separately selectable; unavailable geometry stays neutral. Region selection supports North America and Canada/Newfoundland. US/Mexico geometry is absent at 1949; no other year is substituted.

The official NRCan 1949 layer contains fourteen Canadian divisions, including Newfoundland/Labrador, with start/end attributes both 1949. Fetch unsimplified geometry, dissolve the national outline, then apply Douglas–Peucker ring simplification starting at 0.03 degrees, with finer or unsimplified fallback until canonical self-union preserves every component, hole and ring boundary. The selected 1949 tolerance is 0.01 degrees; retain source boundary points and small rings. Simplifying provinces before dissolution left seams and was rejected. Legal membership and the 1927 extent evidence do not independently validate coordinates. The published state remains generalized `official-source` reference geometry.

The union event has day precision at March 31, 1949. The year-only viewer identifies the 1949 map as a post-entry annual reference; it does not assert membership for every day in that year. Exact-day resolution returns a gap. No real interval is published. Source details disclose temporal precision, legal representation, curator disposition, missing regions, attribution/license, transformations and evidence.

Curator disposition is bound to the reviewed raw-input SHA-256 and a publication-scope SHA-256 over the state, evidence, transformation and generated geometry digest, with reviewer authority, representation, evidence IDs, transformation, limitations and conflicts. Changed input requires new review. Unknown licensing, absent approval, ownership conflicts and unsupported time/representation fail publication checks regardless of model scores. Real Jev source judgments and negative/held outcomes are retained for offline replay. This bounded work is not the complete curation service or held-out historical-domain evaluation.

Tickets: #8 (contract/loader); #9 (coverage, blocked by #8); #11 (1949 import, blocked by #9); #12 (curator/replay, contract dependency and publication prerequisite); #13 (release, blocked by #9/#11/#12). The 1776 source blocker is tracked separately. Release requires Standards + Spec review, green required PR checks, main Pages deployment and exact-revision public data/browser verification.

### Interface and interaction

- Keep a dark full-screen globe stage, prominent year, compact polity legend, small utility controls, and a bottom timeline. Source details and keyboard help use dismissible panels rather than permanent explanatory content.
- Dragging the globe orbits; wheel input over it zooms. Wheel input over the timeline seeks and pauses. Horizontal and vertical trackpad deltas and line/page wheel units are normalized by code.
- Play advances chronological time at 0.5, 1, 4, or 12 years per second in the initial interface. Speed changes preserve the current time and camera. Loading must not advance time through unseen states; a hard loading failure pauses playback.
- Manual seek, year entry, marker selection, and previous/next navigation pause. The year input maintains a draft until Enter or blur, clamps valid numeric input to the supported range, and restores the current year for empty or invalid input.
- Ordinary playback never changes the camera. Reset drains residual orbit inertia before returning to North America. Semantic focus and any visual-thread camera movement require an explicit viewer request and can be interrupted by manual orbit.
- The existing pilot starts at 1880 so useful geometry is immediately visible. The timeline starts at 1776. Once a reviewed 1776 state exists, the initial-date choice can move to 1776; until then, selecting it shows a gap.
- Present is a release-specific end year: 2026 in the current prototype. A new year must not imply new geographic coverage. Range configuration and available geometry remain separate.
- Available-state stepping currently moves among four snapshots. With verified interval and event support, it moves among published changes. Do not relabel sparse snapshots as actual event dates.
- Playback stops at the end; pressing play there restarts at the beginning. Background-tab resume avoids a large elapsed-time jump. Visual fade can soften appearance but must not create intermediate sovereignty shapes.
- Initial reset target is latitude 35, longitude -103, with altitude 2.15 on desktop and 2.65 on narrow viewports. These are current prototype values, not geographic correctness criteria.
- Provide keyboard controls, labeled buttons, visible focus, touch orbit and timeline interaction, and layouts without horizontal overflow. Reduced-motion mode suppresses optional fades and should avoid decorative camera easing. Full WebGL-free geographic accessibility is a separate future undertaking.

### Domain and temporal contracts

The root `GLOSSARY.md` records the shared domain vocabulary. Use the following contracts consistently:

Definitions are maintained in `GLOSSARY.md`; these temporal and publication rules constrain implementation.

Expand the manifest with a new schema version while preserving the existing year-only records. Each boundary state identifies its polity, geometry asset, source references, geographic coverage, representation, supported time extent, precision, review grade, and limitations. Use stable IDs rather than names as joins.

The resolver accepts time, region, requested representation, enabled layers, and dataset revision. It returns eligible state references and a structured coverage result: covered, partial, gap, loading, or error. Partial coverage must identify missing regions or layers. Loading and error are not historical gaps.

Existing snapshots match the floor of the selected year only; they must not be carried into later years. Explicit intervals may persist only within their documented extent. Where sources disagree or overlap, retain separate assertions and require a recorded resolution. Do not choose sovereignty by row order, model ranking, or latest download.

Events store the stated date, precision, event kind, affected polity IDs, before/after state references, and evidence links. Unknown date components remain absent. Code normalizes date components and performs all ordering, range, interval, and proximity calculations. A request for an exact unsupported event date returns a gap with optional available alternatives; it never silently substitutes the closest year.

### Historical data and geographic rendering

Preserve React, TypeScript, Vite, react-globe.gl, and Three.js. Keep the temporal resolver and published data independent of the renderer. MapLibre remains a contingency if measured globe limitations make the agreed interactions unworkable; a stack rewrite is not part of this spec's initial implementation.

Use GeoJSON Polygon and MultiPolygon in longitude/latitude coordinates, preserving islands and holes. Adapt ring winding to the renderer's spherical convention without rewriting source coordinate positions. Test antimeridian and polar cases. Provincial/state outlines are not part of the international-border pilot and must be dissolved where necessary.

Modern physical land is neutral geographic context; it does not establish historic coastlines or sovereignty. Unknown regions do not mean uninhabited or unclaimed. Distinct control, claims, and dispute layers need distinct provenance and visual conventions. Until reviewed dispute geometry exists, show the layer as unavailable rather than manufacturing outlines from text.

Publish simplified geometry appropriate to the globe's scale with the transformation documented. Preserve input URLs, raw-input hashes, source versions where available, authors, licenses, modifications, and review decisions. Rebuilding against changed upstream input is a new data review, not an automatic upgrade.

Known candidate exclusions remain regression cases: 1783, 1800, and 1815 reference maps assigned Jacksonville to the US before the documented Florida transfer; 1815 and 1900 assigned Newfoundland to Canada before entry. A text ownership check tests assignment at selected locations; it does not validate an entire boundary.

### Module responsibilities

- **Viewer state and time controller:** owns playback, seeks, speed, panel state, focus, and user action application.
- **Coverage resolver:** owns year-only and explicit-interval selection, region/layer coverage, date precision, and eligible published states.
- **Geometry loader:** owns manifest loading, runtime schema validation, caching, cancellation, asset errors, retries, and prevention of stale date/geometry pairs.
- **Globe renderer and camera adapter:** owns materials, polygon adaptation, viewport sizing, orbit, zoom, explicit focus/reset, and changed-region presentation.
- **Data import and release pipeline:** owns source acquisition, transformations, hashes, license checks, topology checks, ownership regressions, and release construction.
- **Evidence and polity catalog:** owns named passages, source scope, alias/succession candidates, event candidates, and provenance links.
- **Jev judgment adapter:** owns provider calls, typed response validation, batching, retries, versions, usage, and replayable results.
- **Judgment policy and review queue:** owns thresholds, hard exclusions, uncertainty routing, conflict records, curator decisions, and publish eligibility.
- **Semantic action service:** owns candidate preparation and a constrained command interpretation endpoint; it never performs arbitrary tool execution.
- **Visual sequence selector:** combines optional Jev relevance judgments with deterministic eligibility, chronological order, diversity constraints, and manual camera rules.
- **Evaluation harness:** owns labeled fixtures, option-order perturbations, held-out datasets, deterministic policy replay, live runs, and acceptance reports.

Extract existing interface responsibilities at these boundaries as features grow.

### Jev and TypeSafe integration

Use the TypeSafe JavaScript SDK from trusted Node processes and an optional backend. Configure OpenRouter explicitly with `OPENROUTER_API_KEY`, base URL `https://openrouter.ai/api`, and model `typesafe/jev-1.13`. The SDK calls the System One endpoint. Requests contain model, state, and typed questions; responses contain model, answers, and usage. Provider metadata and reported cost should be retained when available. Model discovery uses the OpenRouter Models API directly because its response differs from the SDK's model-listing contract. These contracts are supported by the [official compatibility guide](https://openrouter.ai/docs/guides/community/typesafe-sdk) and [TypeSafe JavaScript SDK](https://docs.typesafe.ai/sdk/javascript).

Choice selects one supplied option and returns the distribution and confidence. Noul returns a yes-probability without a separate confidence. Score uses independently described ordered levels and returns a probability-weighted position; it is not an estimator of exact dates, areas, coordinates, or numeric change magnitude. Read and validate all consumed answers, not just the selected label. See [TypeSafe primitives](https://docs.typesafe.ai/primitives) and [confidence guidance](https://docs.typesafe.ai/confidence).

Batch independent questions over compact state. Consume speculative arguments only for their applicable action. Later requests follow changed retrieval or candidates. No inference runs per frame, per scroll event, or for arithmetic.

The following workflows are in scope for the planned integration:

| Workflow                  | Jev role                                                                         | Code and reviewer responsibility                                                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| External text intake      | Screen agent-directed instructions, substantive content, and relevance           | Preserve raw provenance, isolate source content from instructions, hold blocks and inspect review cases. Screening is not historical truth verification. |
| Evidence retrieval        | Find/rerank passages against a named assertion                                   | Retrieve candidates first; require actual evidence existence and subsequent support checks.                                                              |
| Citation validation       | Classify support, contradiction, or silence for each claim                       | Check quoted-span presence deterministically; preserve source context and separate coordinate, identity, date, and control assertions.                   |
| Date and value extraction | Choose verbatim spans or enumerated components                                   | Generate complete candidates, copy selected text, parse and compare dates in code; preserve not-stated.                                                  |
| Extraction audit          | Detect hallucinated, off-target, incomplete, or omitted values                   | Reject fabricated fields and require source review; two text artifacts agreeing does not verify pixels.                                                  |
| Polity reconciliation     | Suggest alias, succession, unrelated, or review                                  | Apply time/identity constraints; curator approves merges and relationships.                                                                              |
| Representation review     | Classify claims, administration evidence, disputes, mixed assertions, or unknown | Keep geometry and asserted extents separate; never infer polygons from narrative.                                                                        |
| License triage            | Identify relevant license clauses and ambiguity                                  | Use reviewed license allowlists and explicit compatibility decisions; the model cannot grant permission.                                                 |
| Contradiction discovery   | Compare independent source aspects                                               | Retain competing assertions and curator disposition, with no confidence-based historical winner.                                                         |
| Review prioritization     | Score evidence completeness and review usefulness independently                  | Hard failures override all weighted preferences; calculations and queue weights stay in code.                                                            |
| Coverage planning         | Rank bounded research targets against pilot needs                                | Real coverage, geometry deltas, and source eligibility are computed or reviewed separately.                                                              |
| Semantic navigation       | Select allowed intent, argument candidates, and explicit-presence signals        | Validate action, context, coverage, state revision, and every required argument before execution.                                                        |
| Gazetteer focus           | Select a supplied known place matching explicit viewer intent                    | Resolve bounds and animate camera in code; bare or negated mentions are not focus authorization.                                                         |
| Visual threads            | Rank reviewed moments by requested visual theme                                  | Remove unsupported moments first, sort time in code, label sparse jumps, obey camera preferences.                                                        |
| Comparison selection      | Match a phrase to two approved states                                            | Compute actual geometry differences and synchronize manual camera; do not infer dates or causality.                                                      |
| Release verification      | Check coverage and completion statements against artifacts and logs              | Real tests run first; hold contradicted claims and expose unresolved review.                                                                             |

Screening, extraction, citation checks, function routing, and entity alignment follow the shapes in the official [citation cookbook](https://docs.typesafe.ai/cookbooks/citation_check), [value-selection cookbook](https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook), [function-calling cookbook](https://docs.typesafe.ai/cookbooks/function_calling), and [entity-alignment cookbook](https://docs.typesafe.ai/cookbooks/entity_alignment). Their thresholds and results are examples, not historical-domain validation.

### Judgment records and uncertainty policy

Each judgment record contains workflow and fixture IDs, evidence IDs and hashes, state revision, candidate IDs, question/catalog version, model requested and returned, full typed answers, provider metadata, elapsed time where measured, usage, and the code/reviewer disposition. Cache keys include every input capable of changing meaning: normalized relevant state, evidence version, question version, candidates and their order, provider/model configuration, and representation policy.

Code controls automatic action. Unknown licenses, wrong ownership, unsupported time/representation, invalid topology, stale results, missing arguments, and unapproved data are hard checks. Other scores cannot compensate.

Experimental starting values for reversible viewer suggestions are top probability at least 0.90, Choice confidence at least 0.85, and top-to-runner-up margin at least 0.50, together with argument-presence and ambiguity checks. These are proposed thresholds to evaluate, not values proven to solve the observed errors. Until held-out acceptance passes, semantic commands show suggestions rather than applying automatically. Consequential publication and polity-identity decisions continue to require deterministic validation and curator approval regardless of model confidence.

Unknown, review, invalid response, timeout, and contradicted evidence are distinct states. An invalid provider response must never become a successful empty result. Bounded retries address transport/rate failures only; they must not retry a valid ambiguous answer until it becomes confident. Preserve uncertain outcomes and gather new evidence or use human reasoning.

No-match must be available in every selection where candidates can be insufficient. Evidence search additionally checks whether the query is answered at all. A partial search result or ranked winner is not claim support. Literal argument-presence judgments accompany broad command routing because the experiments exposed confident routing errors.

### Service and deployment contracts

The static viewer and bundled geographic assets remain deployable without a backend. The optional semantic service is an independently configured capability. Application code and eligible data remain open source; this spec does not claim that hosted Jev model weights or infrastructure are open source. The earlier open-source requirement and later explicit Jev request are reconciled by keeping the service optional and documenting its external dependency. If open model weights become a strict deployment requirement, the Jev-backed deployment cannot claim to satisfy it without verified licensing and a suitable provider.

A proposed command endpoint accepts bounded command text, current viewer state, dataset revision, and eligible candidate IDs. It returns accepted, needs-choice, unsupported, or unavailable status, plus a structured allowed action or suggestion, consumed judgment signals, and matching state revision. It never returns executable code, arbitrary URLs, arbitrary geometry, or unrestricted tool names.

Allowed actions are seek, play, pause, supported speed change, explicit place focus, view reset, supported layer change, source inspection, reviewed comparison, and reviewed visual-thread selection. Arguments refer to known IDs or bounded literal values validated by code. Before/after requests resolve against a reviewed event catalog; missing references trigger a small choice UI. Exact requests remain distinct from suggestions such as nearest available before-event snapshot.

Manual actions invalidate pending semantic results. An explicit Stop control cancels a visual thread. Timeline seek pauses it. User orbit cancels any requested automatic focus transition. Camera state remains independent from data and judgment updates.

Credentials exist only in server/build environments and are never placed in client-exposed environment variables. Apply endpoint request limits, input-size limits, per-session budgets, timeouts, and a circuit breaker. A public deployment must not become an unrestricted proxy for the owner's API key. Avoid sending personal data; historical source text and minimal app state are sufficient. These deployment controls belong to the optional service, not additional steps in the viewer's ordinary flow.

### Creative visual tools

- **Visual threads:** Jev ranks eligible moments matching a theme such as island identity or continental expansion. Code assembles chronological date chips and a sequence with explicit sparse transitions. Hawaii 1880/1938 and Newfoundland 1938/1960 are useful prototype pairs; they do not supply exact transfer-day geometry. The thread can retain the current camera or focus only when requested.
- **Compare moments:** two published states share one manual camera, using alternating display or a minimal comparison control. Show gained/lost areas computed from geometry, while retaining source and simplification caveats. New comparison rendering must be tested for holes and antimeridian artifacts.
- **Change emphasis:** pulse or outline actual changed geometry when supported; this highlights the dataset's difference and does not assert the cause of a historical event. Reduced-motion mode uses a static emphasis.
- **Semantic place lens:** map an explicit place request to a known gazetteer entry; offer a known place if the input is ambiguous. Bounds and camera positioning come from geometry code, not model-generated coordinates.
- **Evidence-aware discovery:** constrain suggested moments by coverage and review grade before semantic ranking. Ranking can adapt to a theme without rerunning geographic calculations or hiding less-reviewed source status.

The experiment comparing visual threads with comparison-first returned an even 0.50/0.50 split and confidence 0.41. This spec therefore treats their rollout order as unresolved. Build the shared comparison and eligible-moment foundations first; evaluate both lightweight interactions before choosing which becomes the primary discovery control. Do not describe Jev as having established a winning creative direction.

### Performance and resilience

Cache loaded geometry, prefetch only likely adjacent states, cancel obsolete requests, and clear stale territory while a newly selected state loads. Runtime validation rejects malformed manifests and assets before rendering. Cached judgment results and imported raw data are versioned independently from the viewer cache.

Keep camera interaction and chronological animation outside model latency. Measure startup, frame responsiveness, geometry loading, memory growth, and semantic latency on a named reference machine/browser rather than asserting an unmeasured universal performance target. Establish a baseline during the next implementation milestone and fail material regressions against it. The existing large JavaScript bundle warning is a known optimization concern.

Document WebGL-unavailable behavior as a recoverable capability message with available controls/source information. Verify reduced-motion and error recovery separately. Never present a network failure as proof that historical borders did not exist.

## Testing Decisions

The owner explicitly requested more testing seams after the initial browser-plus-data proposal. Use the following focused contracts, with browser tests retaining responsibility for the composed viewer behavior. Good tests assert external results, visible states, domain invariants, and invalid-action rejection rather than matching component structure or copying implementation logic.

| Seam                                    | Behaviors to verify                                                                                                                                            | Prior art and additions                                                                                                                     |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Time controller                         | Elapsed-time speed, seek pause, bounds, end restart, hidden-tab resume, input commit                                                                           | Existing timeline unit checks and playback browser scenario; add transition tests with a controlled clock.                                  |
| Coverage resolver                       | Year-only semantics, explicit interval boundaries, partial region/layer coverage, overlapping assertions, supported precision, gap versus error                | Existing unsupported-year and sparse-step tests; add contract fixtures for new interval schema.                                             |
| Asset loader                            | Cancellation, out-of-order completion, malformed manifest/GeoJSON, retry, cache version, prefetch failure                                                      | Existing loading logic; new tests with controlled fetch responses and visible result assertions.                                            |
| Geometry adapter                        | Ring orientation, holes, antimeridian and polar cases, multi-island ownership, bounded triangulation                                                           | Existing hole/date-line tests and Canadian vertex-count regression. Preserve source points.                                                 |
| Data build and provenance               | Input hashes, licenses, transformation record, valid closed rings, declared extent, reproducible bundle                                                        | Existing provenance/ring checks; add fixture-based importer and release-contract tests.                                                     |
| Historical ownership and representation | Reviewed before/after point containment, excluded wrong-owner cases, claim/control distinction, successor identity                                             | Existing Hawaii/Newfoundland checks; add primary-evidence-reviewed cases for every new transfer. Spot checks do not certify whole geometry. |
| Jev provider adapter                    | Correct request shape, typed response validation, missing answers, unknown choices, malformed distributions, abort, timeout, 429/5xx behavior, no exposed key  | New adapter contract tests using recorded/mock transport; separately opt-in live SDK smoke test.                                            |
| Judgment policy                         | Hard exclusions, uncertainty route, no-match, cache identity, curator approval requirement, no score compensation                                              | New deterministic replay tests using real experiment outputs, including failures and invalid response.                                      |
| Semantic action contract                | Allowed action and arguments, positive argument presence, before versus compare, unknown place, ambiguous referent, negation, unsupported command, stale state | Recorded 24-command experiments and six argument-presence fixtures; add independent held-out phrases and action-result assertions.          |
| Visual sequence and comparison          | Eligible moments only, chronological order, sparse labels, real changed regions, camera independence, interruption                                             | New integration tests with curated small geometry packs; never use model-generated event dates as ground truth.                             |
| Browser viewer                          | Orbit, zoom, reset inertia, camera preservation, play/pause, speed, wheel regions, keyboard, gaps, dialogs, mobile layout, reduced motion, runtime errors      | Existing production-preview Playwright scenario; split into focused journeys with shared setup rather than one long fragile chain.          |
| Release statements                      | Coverage claims, AI capability claims, test evidence, source grades, licensing statements, excluded data                                                       | Jev verification against actual artifact/log evidence plus deterministic manifest checks. Advisory review does not replace tests.           |

### Model evaluation

Keep synthetic experiments, real documentary evaluation, and user-interaction evaluation separate. The experiments supporting this spec are small authored probes with expected labels; they are not a representative benchmark of historical truth, geographic accuracy, or production routing safety.

Before semantic automatic execution, create a held-out command set covering each action, ambiguous or omitted arguments, negation, conflicting intent, relative events, sparse coverage, and stale-state races. Evaluate both routing and final applied behavior. Measure label accuracy, false automatic actions, abstention/clarification rate, per-intent errors, option-order stability, end-to-end latency, and reported token usage/cost. Any false automatic action in the safety-critical fixture set blocks enabling that automatic branch; a small zero-error sample is not a universal guarantee.

Before curatorial automation, evaluate against independently reviewed source passages and deliberately difficult identity/representation pairs. Measure missed contradictions, falsely supported claims, mistaken aliases, date-role confusion, missing evidence, and false confidence. Publication remains curator-controlled. Build thresholds on a development split and assess once on a separate held-out split; do not tune on the cases used to report acceptance.

Normal CI uses deterministic recorded answers. Live experiments are explicit, bounded, versioned runs with no production actions. They record all variants and do not overwrite a failure with a later pleasing response. Compare concise and overly broad state, paraphrases, option ordering, literal instructions, missing candidates, distractors, and malformed service responses. Count and arithmetic stay in code.

### Acceptance cases

1. Selecting 1776 in the current bundle shows a gap and neutral land, with no carried-over 1880 polygons.
2. Selecting 1880 loads the matching state and appropriate polity legend; selecting another year never shows stale 1880 territory with the new date.
3. Playback advances at the selected chronological speed while camera position stays within the established numerical tolerance after orbit inertia settles.
4. Timeline wheel/drag seeks and pauses; wheel over the globe zooms without seeking.
5. Reset returns to the intended North America framing after a drag, without residual orbit drift.
6. Year entry is not clamped on each keystroke; committed out-of-range input clamps, empty input restores, and focus pauses playback.
7. A sourced interval's start is included and its end excluded; adjacent snapshot spacing creates no interval.
8. A claim-only state cannot appear labeled as verified effective control. An unavailable dispute layer creates no outline.
9. Invalid or unknown licensing and confirmed ownership conflicts prevent publication even when all visual scores are high.
10. The date extractor selects the administrative-transfer span from signing, ratification, publication, and unrelated dates; code handles ordering.
11. 'Show Canada before Newfoundland joined' resolves as one-time navigation or a clarification; it does not become an automatic two-state comparison.
12. 'Show Canada' without explicit focus/time intent offers choices, even if a broad routing answer confidently selects focus.
13. Unknown places, pronouns without antecedents, negated target mentions, and missing event candidates do not execute a guessed action.
14. A request for an unsupported exact event date shows a gap or asks the viewer to choose an available alternative; no silent substitution.
15. A late semantic response after manual seek is discarded; it cannot move the timeline or camera back.
16. Provider timeout, missing answers, invalid responses, and disabled AI leave manual controls operational.
17. Visual threads contain only eligible published moments, disclose sparse jumps, and stop on manual seek; camera movement is explicitly requested.
18. Comparison highlights match geometric differences, retain holes/islands, and do not extend across the antimeridian incorrectly.
19. Mobile layouts keep play, year navigation, and panel dismissal usable without horizontal overflow; keyboard focus and reduced motion are verified.
20. Release notes distinguish reference geometry, reviewed geometry, missing coverage, and planned features, with supporting artifacts for each delivered claim.

## Out of Scope

- Complete atlas reconstruction, a general live curation service, or semantic/creative viewer features beyond the bounded temporal milestone.
- Claiming continuous 1776-to-present coverage or completed world coverage from the current four snapshots.
- Educational essays, generated historian narration, a default history chatbot, or an account/social feed.
- Generated historical coordinates, interpolation presented as sovereignty evidence, invented disputed polygons, or automatic historical reconciliation based solely on confidence.
- Mandatory live AI in the render loop, timeline calculations, initial globe loading, or manual exploration.
- State/provincial and Indigenous boundary reconstruction in the international-border pilot. The architecture reserves independent layers; their future work requires separate evidence and appropriate domain review.
- Overseas dependencies outside the agreed first pilot, survey-grade geometry, or historic coastlines and river reconstruction.
- Monetization, payments, user accounts, collaboration systems and automated social publishing. Existing GitHub Pages hosting remains the delivery path.
- A guarantee that hosted Jev infrastructure or model weights are open source.
- A complete WebGL-free globe renderer or native mobile app in the first implementation stages.

## Further Notes

### Current baseline and evidence limitations

The four prototype snapshots retain their original grades. The temporal milestone adds partial Canada 1949 at official-source reference grade and a separately evidenced union event. None is promoted to independently verified boundaries.

The earlier build had eight passing unit/data tests and a passing browser scenario. Those results describe the prototype before this specification; they do not validate features proposed here. No code tests were rerun merely to write this document. New integrations require the acceptance work above.

### Jev experiment findings

The first 43 recorded calls used Jev through OpenRouter: document screening, feature ranking/classification, command routing, evidence search, claim verification, extraction/audit, source comparison, representation and identity classification, risk probes, and bounded architecture choices. Full inputs for authored fixtures, outputs, distributions, usage, and dispositions accompany this spec in the research artifacts. Final document review is recorded separately as part of the same run.

- Architecture choice favored offline curation plus optional semantic viewer service: selected probability 0.95, confidence 0.93. This is advisory support for the proposed design, not a correctness proof.
- The first 24-command routing set matched 21 expected labels. Its 19 auto decisions matched expected labels, but the reversed-order run automatically chose focus for ambiguous 'Show Canada' with top probability 0.88 and confidence 0.86. Broad confidence thresholds alone are therefore insufficient.
- An absent-evidence query returned `partial` with existence probability 0.42, despite no candidate establishing verified 1776 control coordinates. This result is held; retrieval presence is not treated as evidence verification.
- Verbatim date extraction selected the authored effective and signing dates correctly and returned not-found for coordinates. The audit flagged all three planted bad/omitted records and accepted two correct records. These are fixture results, not actual historical adjudication.
- Six authored representation cases were classified as expected. An undated polity pair still suggested succession at probability 0.68, decision review; no merge is allowed from that suggestion.
- The hostile-source fixture was blocked at injection probability 0.99 and excluded from the evidence workflow. Ordinary historical quoted directives passed. Some official documentation screens required agent inspection; one low-relevance page was skipped.
- A broad feature-fit batch mislabeled an invented-boundary idea as a low-confidence core-data candidate. Deterministic product constraints reject that idea regardless of classification. Feature relevance never authorizes inclusion or publication.
- A requirements-verification probe returned one `invalid_response`. It remains an operational failure in the record, not a pass. Direct human instruction establishes authorization; a model verdict does not.
- Visual threads versus comparison-first remained tied at 0.50 each, confidence 0.41. Their rollout order remains unresolved and requires a focused interaction prototype.

TypeSafe's [Jev 1.13 limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13) motivate literal criteria, compact state, option-order tests, code-owned arithmetic, and selection rather than generation. Reassess when models, questions, catalogs, or providers change.

### Publication

The configured tracker is GitHub Issues for `nicolas-found42/world-borders`; issue and triage guidance lives in `docs/agents/`. Delivery infrastructure is complete in issue #1 and merged PRs #2, #7 and #14. Publish milestone tickets with `ready-for-agent`, link actual dependencies, and verify PR checks, merge, issue closure, and the deployed commit. Reuse the existing source-review and Pages pipeline.

Source availability, control/dispute reconstruction, semantic calibration, model licensing, creative-tool order, and device performance remain explicit release concerns. They do not authorize guessed data.
