import test from 'node:test';
import assert from 'node:assert/strict';
import { validateClosingIssues, isDependencyBot } from '../scripts/pr-metadata.mjs';
import {
  releaseProblems,
  newReviewActivity,
  applyPreviousObservation,
} from '../scripts/release-evidence.mjs';
const repo = 'nicolas-found42/world-borders';
const ref = (number) => ({ number, repository: { nameWithOwner: repo } });

test('GitHub parsed closing links must match one explicit declaration, even in negated prose', () => {
  assert.throws(
    () => validateClosingIssues('<!-- completed-issues: [] -->\nDoes not close #1', [ref(1)], repo),
    /GitHub parsed closing issues/,
  );
  assert.deepEqual(
    validateClosingIssues('<!-- completed-issues: [10] -->\nCloses #10', [ref(10)], repo),
    [10],
  );
  assert.throws(
    () => validateClosingIssues('Related #10', [], repo),
    /Declare completed issues once/,
  );
  assert.throws(
    () => validateClosingIssues('<!-- completed-issues: [10,10] -->', [], repo),
    /unique positive/,
  );
});
function fixture() {
  return {
    pr: {
      state: 'OPEN',
      isDraft: false,
      headRefOid: 'head',
      mergeable: 'MERGEABLE',
      mergeStateStatus: 'CLEAN',
      reviewThreads: { nodes: [] },
      commits: {
        nodes: [
          {
            commit: {
              statusCheckRollup: {
                contexts: {
                  nodes: [
                    {
                      __typename: 'CheckRun',
                      name: 'verify',
                      status: 'COMPLETED',
                      conclusion: 'SUCCESS',
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    },
    prChecks: [{ name: 'verify', bucket: 'pass' }],
    requiredChecks: ['verify'],
    upToDate: true,
    integrated: true,
    mainSha: 'merged',
    deployedSha: 'merged',
    mainRuns: [{ name: 'CI', status: 'completed', conclusion: 'success' }],
    issues: [{ state: 'CLOSED', stateReason: 'COMPLETED' }],
  };
}
const options = {
  phase: 'premerge',
  reviewedHead: 'head',
  reviewNote: 'Final diff reviewed; external reviewer completion checked.',
};
test('release evidence rejects stale review, late threads, pending or absent checks and stale main', () => {
  const e = fixture();
  assert.deepEqual(releaseProblems(e, options), []);
  assert.match(releaseProblems(e, { ...options, reviewedHead: 'old' }).join(), /current head/);
  e.pr.reviewThreads.nodes.push({ isResolved: false });
  assert.match(releaseProblems(e, options).join(), /Unresolved/);
  e.pr.reviewThreads.nodes = [];
  e.prChecks[0].bucket = 'pending';
  assert.match(releaseProblems(e, options).join(), /Check not successful/);
  e.prChecks = [];
  assert.match(releaseProblems(e, options).join(), /Missing required checks/);
  e.upToDate = false;
  assert.match(releaseProblems(e, options).join(), /current main/);
});
test('completion checks actual merge, deployed revision, successful main and issue completion', () => {
  const e = fixture();
  e.pr.state = 'MERGED';
  e.pr.mergeCommit = { oid: 'merged' };
  assert.deepEqual(releaseProblems(e, { ...options, phase: 'complete' }), []);
  e.deployedSha = 'old';
  e.issues[0].state = 'OPEN';
  e.mainRuns[0].status = 'in_progress';
  const errors = releaseProblems(e, { ...options, phase: 'complete' }).join();
  assert.match(errors, /Deployed SHA/);
  assert.match(errors, /closed as completed/);
  assert.match(errors, /Main CI/);
});

test('only the actual dependency bot may omit an empty declaration', () => {
  assert.equal(isDependencyBot({ login: 'dependabot', __typename: 'Bot' }), true);
  assert.equal(isDependencyBot({ login: 'dependabot', __typename: 'User' }), false);
  assert.deepEqual(
    validateClosingIssues('Automated update', [], repo, { dependencyBot: true }),
    [],
  );
  assert.throws(
    () =>
      validateClosingIssues('Automated update closes #1', [ref(1)], repo, { dependencyBot: true }),
    /GitHub parsed/,
  );
});

test('late replies and edited comments in an existing resolved thread require another inspection', () => {
  const previous = {
    pr: {
      reviewThreads: {
        nodes: [
          {
            id: 'thread',
            isResolved: true,
            comments: { nodes: [{ id: 'comment', updatedAt: 'before' }] },
          },
        ],
      },
      reviews: { nodes: [{ id: 'review', state: 'COMMENTED', submittedAt: 'before' }] },
    },
  };
  const current = structuredClone(previous);
  current.pr.reviewThreads.nodes[0].comments.nodes[0].updatedAt = 'after';
  current.pr.reviewThreads.nodes[0].comments.nodes.push({ id: 'late-reply', updatedAt: 'after' });
  current.pr.reviews.nodes[0].updatedAt = 'after';
  current.pr.reviews.nodes.push({ id: 'late-review', state: 'COMMENTED', submittedAt: 'after' });
  const activity = newReviewActivity(current, previous);
  assert.equal(activity.comments.length, 2);
  assert.equal(activity.reviews.length, 2);
  assert.equal(activity.threads.length, 0);
  assert.deepEqual(newReviewActivity(current, current), { comments: [], reviews: [], threads: [] });
});

test('completion preserves checks required at merge while premerge enforces current policy', () => {
  const e = fixture();
  e.pr.state = 'MERGED';
  e.pr.mergeCommit = { oid: 'merged' };
  e.requiredChecks = ['verify', 'metadata'];
  e.requiredChecksAtMerge = ['verify'];
  assert.deepEqual(releaseProblems(e, { ...options, phase: 'complete' }), []);
  assert.match(releaseProblems(e, options).join(), /Missing required checks: metadata/);
  e.prChecks[0].bucket = 'fail';
  assert.match(
    releaseProblems(e, { ...options, phase: 'complete' }).join(),
    /Required check did not pass: verify/,
  );
});

test('completion CLI requires the prior observation before contacting GitHub', async () => {
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(
    process.execPath,
    ['scripts/release-evidence.mjs', '14', '--phase', 'complete'],
    { encoding: 'utf8' },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Completion requires --previous/);
});

test('a second premerge inspection records current policy rather than older gates', () => {
  const previous = { ...fixture(), phase: 'premerge', problems: [], requiredChecks: ['verify'] };
  const current = { ...fixture(), requiredChecks: ['verify', 'metadata'] };
  current.requiredChecksAtMerge = current.requiredChecks;
  applyPreviousObservation(current, previous, 'premerge');
  assert.deepEqual(current.requiredChecksAtMerge, ['verify', 'metadata']);
  assert.match(releaseProblems(current, options).join(), /Missing required checks: metadata/);
  current.phase = 'premerge';
  current.problems = ['Missing required checks: metadata'];
  assert.throws(
    () => applyPreviousObservation(fixture(), current, 'complete'),
    /successful premerge/,
  );
});

test('only a successful premerge baseline can initialize historical requirements', () => {
  const previous = {
    ...fixture(),
    phase: 'premerge',
    problems: ['failed'],
    requiredChecks: ['verify'],
  };
  assert.throws(
    () => applyPreviousObservation(fixture(), previous, 'complete'),
    /successful premerge/,
  );
  previous.problems = [];
  const current = fixture();
  applyPreviousObservation(current, previous, 'complete');
  assert.deepEqual(current.requiredChecksAtMerge, ['verify']);
  current.phase = 'complete';
  current.problems = ['late review requires disposition'];
  const continuation = fixture();
  applyPreviousObservation(continuation, current, 'complete');
  assert.deepEqual(continuation.requiredChecksAtMerge, ['verify']);
  previous.requiredChecks = null;
  assert.throws(
    () => applyPreviousObservation(fixture(), previous, 'complete'),
    /valid merge-check/,
  );
});
