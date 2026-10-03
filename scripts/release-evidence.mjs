import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { githubQuery, validateClosingIssues, isDependencyBot } from './pr-metadata.mjs';

const acceptable = new Set(['SUCCESS', 'NEUTRAL', 'SKIPPED']);
export function releaseProblems(evidence, { phase, reviewedHead, reviewNote }) {
  const problems = [];
  const { pr } = evidence;
  if (reviewedHead !== pr.headRefOid || !reviewNote?.trim())
    problems.push(
      'Confirm review completion for the current head with --reviewed-head and --review-note',
    );
  if (pr.reviewThreads.nodes.some((t) => !t.isResolved)) problems.push('Unresolved review threads');
  if (pr.reviewDecision === 'CHANGES_REQUESTED') problems.push('Changes requested');
  const checks = pr.commits.nodes[0]?.commit.statusCheckRollup?.contexts.nodes || [];
  const required = new Set(evidence.requiredChecks);
  for (const check of checks) {
    const name = check.name || check.context;
    required.delete(name);
    if (
      check.__typename === 'CheckRun'
        ? check.status !== 'COMPLETED' || !acceptable.has(check.conclusion)
        : check.state !== 'SUCCESS'
    )
      problems.push(`Check not successful: ${name}`);
  }
  if (required.size) problems.push(`Missing required checks: ${[...required].join(', ')}`);
  if (phase === 'premerge') {
    if (
      pr.state !== 'OPEN' ||
      pr.isDraft ||
      pr.mergeable !== 'MERGEABLE' ||
      pr.mergeStateStatus !== 'CLEAN'
    )
      problems.push('PR is not a clean, mergeable, ready open PR');
    if (!evidence.upToDate) problems.push('PR does not contain current main');
  } else {
    if (pr.state !== 'MERGED' || !pr.mergeCommit) problems.push('PR is not merged');
    if (!evidence.integrated) problems.push('Current main does not contain the merged PR');
    if (evidence.deployedSha !== evidence.mainSha)
      problems.push('Deployed SHA differs from current main');
    if (
      !evidence.mainRuns.some(
        (r) => r.name === 'CI' && r.status === 'completed' && r.conclusion === 'success',
      )
    )
      problems.push('Main CI and deployment have not succeeded');
    if (
      evidence.mainRuns.some(
        (r) => r.status !== 'completed' || !['success', 'skipped'].includes(r.conclusion),
      )
    )
      problems.push('Pending or failing main workflows');
    for (const check of evidence.mainChecks || []) {
      if (
        check.head !== evidence.mainSha ||
        check.status !== 'completed' ||
        !['success', 'neutral', 'skipped'].includes(check.conclusion)
      )
        problems.push(`Main check not successful: ${check.name}`);
    }
    if (evidence.issues.some((i) => i.state !== 'CLOSED' || i.stateReason !== 'COMPLETED'))
      problems.push('Declared completed issues are not closed as completed');
  }
  return problems;
}
export function newReviewActivity(current, previous) {
  const knownComments = new Map(
    previous.pr.reviewThreads.nodes
      .flatMap((thread) => thread.comments?.nodes || [])
      .map((comment) => [comment.id, comment.updatedAt]),
  );
  const comments = current.pr.reviewThreads.nodes
    .flatMap((thread) => thread.comments?.nodes || [])
    .filter((comment) => knownComments.get(comment.id) !== comment.updatedAt);
  const stamp = (review) =>
    JSON.stringify([review.state, review.submittedAt, review.updatedAt, review.commit?.oid]);
  const knownReviews = new Map(
    (previous.pr.reviews?.nodes || []).map((review) => [review.id, stamp(review)]),
  );
  const reviews = (current.pr.reviews?.nodes || []).filter(
    (review) => knownReviews.get(review.id) !== stamp(review),
  );
  const knownThreads = new Set(previous.pr.reviewThreads.nodes.map((thread) => thread.id));
  const threads = current.pr.reviewThreads.nodes.filter((thread) => !knownThreads.has(thread.id));
  return { comments, reviews, threads };
}
async function collect(number) {
  const repository = process.env.GITHUB_REPOSITORY || 'nicolas-found42/world-borders';
  const [owner, name] = repository.split('/');
  const query = `query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){defaultBranchRef{target{oid}} pullRequest(number:$number){url body author{login __typename} state isDraft headRefOid baseRefOid mergeable mergeStateStatus mergedAt reviewDecision mergeCommit{oid} closingIssuesReferences(first:100){nodes{number state stateReason repository{nameWithOwner}} pageInfo{hasNextPage}} reviewThreads(first:100){nodes{id isResolved comments(last:100){nodes{id url createdAt updatedAt path} pageInfo{hasPreviousPage}}} pageInfo{hasNextPage}} reviews(last:100){nodes{id updatedAt author{login __typename} state submittedAt commit{oid} url} pageInfo{hasPreviousPage}} commits(last:1){nodes{commit{oid statusCheckRollup{contexts(first:100){nodes{__typename ... on CheckRun{name status conclusion detailsUrl} ... on StatusContext{context state targetUrl}} pageInfo{hasNextPage}}}}}}}}}`;
  const { repository: data } = githubQuery(query, { owner, name, number });
  const pr = data.pullRequest;
  if (
    !pr ||
    pr.reviewThreads.pageInfo.hasNextPage ||
    pr.reviewThreads.nodes.some((thread) => thread.comments.pageInfo.hasPreviousPage) ||
    pr.reviews.pageInfo.hasPreviousPage ||
    pr.closingIssuesReferences.pageInfo.hasNextPage ||
    pr.commits.nodes[0]?.commit.statusCheckRollup?.contexts.pageInfo.hasNextPage
  )
    throw new Error('Incomplete paginated evidence; inspect the full GitHub state');
  validateClosingIssues(pr.body, pr.closingIssuesReferences.nodes, repository, {
    dependencyBot: isDependencyBot(pr.author),
  });
  const api = (endpoint) => JSON.parse(execFileSync('gh', ['api', endpoint], { encoding: 'utf8' }));
  const rules = api(`repos/${repository}/rules/branches/main`);
  const requiredChecks = rules
    .filter((r) => r.type === 'required_status_checks')
    .flatMap((r) => r.parameters.required_status_checks.map((c) => c.context));
  const mainSha = data.defaultBranchRef.target.oid;
  const runs = api(`repos/${repository}/actions/runs?head_sha=${mainSha}&per_page=100`);
  if (runs.total_count > 100)
    throw new Error('Incomplete main workflow evidence; paginate before completion');
  const seen = new Set();
  const mainRuns = runs.workflow_runs
    .filter((run) => {
      if (seen.has(run.workflow_id)) return false;
      seen.add(run.workflow_id);
      return true;
    })
    .map(({ id, name, status, conclusion, html_url }) => ({
      id,
      name,
      status,
      conclusion,
      url: html_url,
    }));
  const mainChecks = api(
    `repos/${repository}/commits/${mainSha}/check-runs?filter=latest&per_page=100`,
  );
  if (mainChecks.total_count > 100) throw new Error('Incomplete main check evidence');
  let deployedSha = null;
  let deploymentError = null;
  try {
    const response = await fetch(`https://${owner}.github.io/${name}/build-info.json`, {
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    deployedSha = (await response.json()).commit;
  } catch (error) {
    deploymentError = error.message;
  }
  const integrated = pr.mergeCommit
    ? api(`repos/${repository}/compare/${pr.mergeCommit.oid}...${mainSha}`).merge_base_commit
        .sha === pr.mergeCommit.oid
    : false;
  const upToDate =
    api(`repos/${repository}/compare/${mainSha}...${pr.headRefOid}`).merge_base_commit.sha ===
    mainSha;
  return {
    collectedAt: new Date().toISOString(),
    repository,
    pr,
    requiredChecks,
    mainSha,
    mainRuns,
    mainChecks: mainChecks.check_runs.map(({ name, status, conclusion, head_sha, html_url }) => ({
      name,
      status,
      conclusion,
      head: head_sha,
      url: html_url,
    })),
    deploymentError,
    deployedSha,
    upToDate,
    integrated,
    issues: pr.closingIssuesReferences.nodes,
    limitations: [
      'External reviewers without a completion API require explicit review confirmation for this head. This read is a point-in-time observation; rerun immediately before merge and before reporting completion.',
    ],
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      phase: { type: 'string', default: 'premerge' },
      'reviewed-head': { type: 'string' },
      'review-note': { type: 'string' },
      output: { type: 'string' },
      previous: { type: 'string' },
    },
  });
  const number = Number(positionals[0]);
  if (
    !Number.isSafeInteger(number) ||
    number <= 0 ||
    !['premerge', 'complete'].includes(values.phase)
  )
    throw new Error(
      'Usage: npm run release:evidence -- PR --phase premerge|complete --reviewed-head SHA --review-note NOTE',
    );
  const evidence = await collect(number);
  evidence.reviewConfirmation = { head: values['reviewed-head'], note: values['review-note'] };
  evidence.problems = releaseProblems(evidence, {
    phase: values.phase,
    reviewedHead: values['reviewed-head'],
    reviewNote: values['review-note'],
  });
  if (values.previous) {
    const previous = JSON.parse(await readFile(values.previous, 'utf8'));
    evidence.newReviewActivity = newReviewActivity(evidence, previous);
    if (Object.values(evidence.newReviewActivity).some((items) => items.length))
      evidence.problems.push(
        'New or edited review activity since previous inspection; disposition and repeat inspection required',
      );
  }
  const output = values.output || `artifacts/release-evidence/pr-${number}-${values.phase}.json`;
  const { dirname } = await import('node:path');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(evidence, null, 2));
  console.log(
    JSON.stringify(
      {
        output,
        head: evidence.pr.headRefOid,
        main: evidence.mainSha,
        deployed: evidence.deployedSha,
        problems: evidence.problems,
        limitations: evidence.limitations,
      },
      null,
      2,
    ),
  );
  if (evidence.problems.length) process.exitCode = 1;
}
