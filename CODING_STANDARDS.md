# Review standards

Read these during Standards review, alongside `CONTRIBUTING.md`. Lint, types,
formatting and tests enforce mechanical rules.

## State across multiple operations

For filesystem or remote changes that persist across several operations, identify
what commits the complete change. Review interruption recovery, retries, concurrent
ownership, and the full scope of the resulting diff. Require behavior evidence for
the failure paths affected by the patch. A passing happy path or an internally
consistent subset of files does not establish that the whole operation is safe.

Review data publication against the evidence for the entire published set, including
missing/deleted files and unrelated branch changes. Preserve historical uncertainty
and require curator approval under the data policy in `CONTRIBUTING.md`.

## Evidence and completion

Match each outcome statement to its actual execution evidence and revision. For
visual evidence, confirm data readiness before capture. A timer is rendering settle
time, not evidence that a request completed. Review model validation failures with
the preserved response, separately from transport failure.

Confirm the final diff and review disposition for the latest PR head. Consult
`docs/agents/release.md` before merging and before reporting completion.
