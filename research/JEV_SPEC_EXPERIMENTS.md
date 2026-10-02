# Jev experiments for the World Borders specification

This report records live Jev experiments used to design the project specification on 2 October 2026. The main deliverable is [the detailed specification](../SPEC.md). The [machine-readable ledger](jev-spec-experiments.json) preserves authored fixture inputs, typed outputs, probability distributions, provider/model details, and available timing/usage. These experiments changed the design; they did not implement AI viewer features or establish historical truth.

## Method and limits

Before the final completion gate, 44 live tool calls ran through OpenRouter using `typesafe/jev-1.13`: 18 screens, 8 classification batches, 3 verification batches, 3 Noul batches, 3 comparisons, 2 rankings, 2 searches, 2 bounded decisions, one extraction, one audit, and one draft review. The final gate is recorded in the ledger after completion. Tool counts are not individual model-question counts: tools can ask several judgments internally for each item.

Official TypeSafe and OpenRouter documentation was fetched and screened before use. Screen records retain their URLs and results; full third-party pages are not copied into this artifact. Some screens flagged ordinary documentation instructions for inspection. Those pages were inspected as technical data, not as agent authority. The composite-scoring page received `skip` for low relevance and was not consumed. The Score primitive documentation independently supported separate dimensions and code-owned combination.

Functional cases were authored, labeled probes. Date strings and short historical summaries are synthetic input fixtures, not citations establishing historical events. The labels were set before inspecting the routing results. Reversing the class catalog tested option-order sensitivity; it did not replace the original result or retry a judgment to obtain acceptance.

The first requirements-verification batch contained one `invalid_response`. It remains a recorded protocol failure. Direct inspection of the user's request establishes scope and live-call authorization; model judgments are not authorization.

The initial draft review was truncated because the document exceeded the review tool's input cap. It returned `escalate`, composite 0.89725, `safe_to_apply` 0.62, and limiting blast-radius confidence 0.12. That is not a passed review. The spec was tightened and the final gate receives the full document within the per-file cap. The final result is retained without retrying an unchanged gate.

## Findings and resulting decisions

| Experiment | Observed result | Decision in the spec |
| --- | --- | --- |
| Architecture choice | Hybrid offline curation plus optional semantic service: probability 0.95, confidence 0.93; checked requirements supported | Keep the manual static viewer independent of model service. Proposed runtime semantic actions use a trusted service. |
| Broad feature classification | Only 6 of 21 items met automatic thresholds. Invented-boundary proposal incorrectly leaned core-data at probability 0.45/confidence 0.26, review | Product constraints and publication policy reject invented geometry regardless of semantic relevance. Broad scope labels do not authorize features. |
| First command routing | 21 of 24 labels matched expected. All 19 auto decisions matched expected; 5 required review | Useful prototype signal, not production readiness. Preserve abstention and test final actions separately. |
| Reversed routing catalog | Two top labels changed: conditional stop moved from review to play; spelled-out year moved from review to seek. Ambiguous 'Show Canada' remained focus but rose to probability 0.88/confidence 0.86, auto | Add positive argument-presence and ambiguity checks. Require held-out evaluation and order perturbations before automatic execution. |
| Single-before versus compare | Broad router misread 'Show Canada before Newfoundland joined' as compare, review. Literal probes put explicit two-date comparison at 0.03 and single-time navigation at 0.96 | Decompose intent and required fields. Before-event navigation is not automatically comparison. |
| Missing evidence | Search for verified 1776 control coordinates returned partial, existence 0.42, with an irrelevant winner | Partial search cannot establish support. Do not accept a winner when candidate evidence does not answer the actual assertion. |
| Relevant evidence | Newfoundland-specific search returned answered, existence 0.96, selecting the correct authored passage | Retrieval can find candidate evidence; a separate support check remains necessary. |
| Verbatim date selection | Correct authored administrative and signing dates, confidence 1.0; coordinates not found | Select source spans; code parses, compares, and validates dates. Missing coordinates stay missing. |
| Extraction audit | All 3 planted bad/omitted records flagged; 2 correct records accepted | Audit off-target roles, fabrication, and omission before using values. Do not mistake textual audit for map/pixel verification. |
| Representation classification | All 6 authored cases matched: control, claim, dispute, treaty-as-claim, insufficient, mixed | Keep independent representation fields and mixed extents; treaties alone do not establish administration. |
| Polity alignment | Clear aliases/successions distinguished; undated Canada/Upper Canada pair suggested succession 0.68, review | Human review and explicit time constraints control identity merging. |
| Source screening | Hostile source blocked at injection 0.99. Clean source and attributed historical directive passed | Exclude blocked material from evidence processing. Preserve distinction between historical quotations and agent-directed instructions. |
| Coordinate evidence comparison | Coordinate-accuracy assertions contradicted at probability 0.99; ownership comparison remained uncertain | Ownership documents cannot validate all polygon coordinates. Review aspects independently. |
| Release readiness | Wrong owner, unknown license, missing date sent to quarantine; control overclaim leaned quarantine but required review | Deterministic failures override preference scores. Curator approval remains required for consequential publication. |
| Argument selection | Six cases correctly selected explicit Alaska/Hawaii, or not-stated for unknown place, unresolved pronoun, alternatives, and negation | Use closed arguments and presence checks in addition to route selection. |
| Visual journey ranking | Available Hawaii states ranked first; unsupported 1898 still received relevance 0.14 | Filter eligibility before ranking. A small score is not permission to include unsupported geometry. |
| Creative choice | Visual threads and comparison-first tied 0.50/0.50, confidence 0.41 | Rollout order unresolved. Build shared eligible-state/comparison foundations and prototype both interactions. |
| Repo facts verification | Seven positive current-state claims verified automatically; planted interval/SDK/runtime-AI claims were contradicted or unsupported | Label proposed integrations as future work. Preserve actual four-year coverage and source grades. |

## Test catalog for implementation

The spec requires twelve seams: time controller, coverage resolver, asset loader, spherical geometry, data/provenance build, historical ownership/representation, provider adapter, judgment policy, semantic action contract, visual sequence/comparison, browser viewer, and release statements.

The experiment ledger seeds regression fixtures, especially confident ambiguous focus, before-event misrouting, absent evidence with a partial winner, date-role confusion, fabricated coordinates, skipped values, predecessor identity, option-order sensitivity, and invalid provider answers. Additional tests must cover stale UI state, malformed distributions, unknown answer IDs, timeout/rate errors, disabled AI, and actual source conflicts.

Use replayed recorded outputs for ordinary tests and explicit live runs for evaluations. Development and held-out sets must be separate. Record false automatic actions, coverage/abstention, per-intent errors, contradiction misses, latency and token/cost usage. Zero errors on this small probe set would not prove deployment safety.

## Usage

The ledger records the token usage returned by each tool. The provider cost field was not returned by these MCP results, so this report does not invent a dollar amount. Final totals can be computed directly from the ledger, including the final gate. Timings are available for batched calls where measured; concurrent timings are not additive end-to-end latency benchmarks.

## Publication status

The spec is saved in the project repository. Issue publication with `ready-for-agent` is pending because the repository has no remote or project tracker configuration. The invoked to-spec skill directs `/setup-matt-pocock-skills` for this missing configuration. No unrelated tracker or repository was created.
