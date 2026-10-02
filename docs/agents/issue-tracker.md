# Issue tracker: GitHub

Issues and specs for this repo live in GitHub Issues at
`nicolas-found42/world-borders`. Use `gh` from this repo for issue operations.

## Conventions

- Create: `gh issue create --title "..." --body-file <file>`
- Read: `gh issue view <number> --comments`
- List: `gh issue list --state open`, adding label or state filters as needed
- Comment: `gh issue comment <number> --body-file <file>`
- Label: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`
- Close: `gh issue close <number> --comment "..."`

When a skill says to publish to the issue tracker, create a GitHub issue.
When it says to fetch a ticket, read that issue and its comments.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## Wayfinding

For `/wayfinder`, use one issue labeled `wayfinder:map` for the map and
GitHub sub-issues for child tickets. If sub-issues are unavailable, link
children in a task list in the map and put `Part of #<map>` in each child.
Use `wayfinder:<type>` labels for `research`, `prototype`, `grilling`,
and `task`.

Record blockers with GitHub issue dependencies. If those are unavailable,
put `Blocked by: #<n>, #<n>` at the top of the child issue. The frontier
is the first open, unassigned child in map order with no open blockers.
Claim by assigning the issue to yourself. Resolve by posting the answer,
closing the child, and adding a short answer and link to the map.
