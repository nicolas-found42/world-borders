# Release evidence

Operational setup and maintenance procedures live in `CONTRIBUTING.md`; tracker
configuration lives in `docs/agents/issue-tracker.md`. `SPEC.md` describes product
requirements. When a phase changes setup assumptions, replace stale setup prose
with pointers to those sources and link the phase's verified delivery evidence.

## Before merge and completion

Run the read-only collector immediately before merging:

```sh
npm run release:evidence -- PR_NUMBER --phase premerge --reviewed-head HEAD_SHA --review-note 'Describe the final diff review and external reviewer completion evidence'
```

It records actual head/check identities, main, reviews, unresolved threads, required
checks, deployment and linked issues in `artifacts/release-evidence/`. It fails on
missing/pending/failed checks, unresolved threads, stale review confirmation, or a
PR that is not clean and up to date. Authenticate `gh` with read access.

After merge, main checks and deployment, run again:

```sh
npm run release:evidence -- PR_NUMBER --phase complete --reviewed-head HEAD_SHA --review-note 'Final head review disposition' --previous artifacts/release-evidence/pr-PR_NUMBER-premerge.json
```

New threads, replies, submitted reviews, and edited review comments since the earlier
inspection fail the command even after merge.
Inspect and disposition them, then save a new observation as the previous baseline
and repeat. Completion also requires the deployed SHA to match the checked current
main, an integrated merge and closed completed issues. The prior observation must
match the PR and head and originate in a successful premerge observation; completion
uses its saved merge requirements, retaining the
current policy separately. Adding a future gate does not invalidate an earlier
verified merge. Each premerge observation records the current requirements, even
when comparing review activity with an older observation. Completion observations
preserve the verified baseline for subsequent inspection. The JSON retains full evidence;
the terminal prints a compact result. Preserve the JSON with release evidence and link
reviewer-accessible GitHub runs and review dispositions in the issue/PR.

External review services without a completion API are a limitation: inspect their
review completion for the current head and supply the confirmation explicitly. A
comment on an older commit or an empty thread list is not completion evidence. If a
service is unavailable, record that gap and complete a separate final diff review;
never infer review completion from elapsed time. The collector is a point-in-time
observation, so repeat it at both boundaries. It cannot prevent later comments.

## PR issue declarations

The PR template contains `<!-- completed-issues: [] -->`. List only issue numbers
fully completed by the merge, and use `Closes #N` for those issues. Use `Related issue
#N` for partial work. `npm run check:pr -- PR_NUMBER` compares GitHub's parsed
`closingIssuesReferences` with the declaration. CI repeats this on body edits using
`pull_request_target`, read-only permissions and the base commit validator. PR code
is never executed by that workflow. Initial publication of this trusted workflow
is checked locally; enforce its required context once it exists on main.
Dependabot PRs may omit the declaration only when GitHub reports no closing links.
The draft geographic proposal declares an empty completed-issue list.

## Interrupted geographic builds

Builds acquire atomic heartbeat leases on both canonical destinations before any
journal recovery. Lease settings are fixed: 120 seconds stale, 5 seconds heartbeat.
An abruptly killed owner can briefly block a retry until its lease expires; it
cannot permanently block recovery through PID reuse. Do not remove an active lease
or use different lease timings. On compromised ownership the lock library terminates
the process rather than permitting installation. Switch versions only while builds
are idle; old versions used the journal itself as a PID lock.

Staging paths are recorded before creation, and journal replacement is atomic.
Both destinations identify pending transactions. If a different cache/output pair
is requested while recovery is pending, the build fails before mutation; recover
with the original pair first. After successful cleanup, destinations can be reused.
The interrupted-process tests coordinate through IPC rather than sleeps. Run
`node --test tests/data-build-interruption.test.mjs` to exercise kill/recovery and
competing owners. This tests local process/filesystem interruption; it does not claim
power-loss durability on every filesystem.

For source updates and human publication review, follow `CONTRIBUTING.md`.
