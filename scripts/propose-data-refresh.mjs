import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' }).trim();
const report = JSON.parse(await readFile('artifacts/data-review/evidence.json', 'utf8'));
if (!report.changedFiles.length) {
  console.log('No changed data; review artifacts retained without creating a PR.');
} else {
  const fingerprint = createHash('sha256')
    .update(JSON.stringify(report.after.files))
    .digest('hex')
    .slice(0, 12);
  const branch = `codex/data-refresh-${fingerprint}`;
  const existing = JSON.parse(
    gh('pr', 'list', '--state', 'open', '--head', branch, '--json', 'url'),
  );
  if (existing.length) {
    console.log(`An open proposal already covers these output bytes: ${existing[0].url}`);
  } else {
    // A closed proposal is not reopened or overwritten by the scheduler.
    const closed = JSON.parse(
      gh('pr', 'list', '--state', 'closed', '--head', branch, '--json', 'url'),
    );
    if (closed.length) {
      console.log(
        `Previously reviewed proposal for identical output: ${closed[0].url}. Maintainer must decide whether to retry.`,
      );
    } else {
      const remoteBranch = git('ls-remote', '--heads', 'origin', `refs/heads/${branch}`);
      if (remoteBranch) {
        // Recover a successful push followed by an interrupted/failed PR creation.
        git('fetch', 'origin', `refs/heads/${branch}`);
        const remoteFiles = git('ls-tree', '-r', '--name-only', 'FETCH_HEAD', '--', 'public/data')
          .split('\n')
          .filter(Boolean)
          .map((path) => path.slice('public/data/'.length))
          .sort();
        if (JSON.stringify(remoteFiles) !== JSON.stringify(Object.keys(report.after.files).sort()))
          throw new Error('Existing proposal branch has an unexpected data file set');
        for (const [file, expected] of Object.entries(report.after.files)) {
          const raw = execFileSync('git', ['show', `FETCH_HEAD:public/data/${file}`]);
          if (createHash('sha256').update(raw).digest('hex') !== expected.sha256)
            throw new Error(`Existing proposal branch has unexpected data: ${file}`);
        }
      } else {
        git('switch', '-c', branch);
        git('config', 'user.name', 'github-actions[bot]');
        git('config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com');
        git('add', '--', 'public/data');
        git('commit', '-m', 'chore(data): propose fresh geographic sources');
        git('push', 'origin', branch);
      }
      const details = await readFile('artifacts/data-review/report.md', 'utf8');
      const body = `## Summary\n\nFresh source inputs changed the committed geographic bundle. This is a draft for historical and licensing review.\n\nConceptual diff:\n\n\`\`\`diff\n- committed input hashes and polygons\n+ fresh input hashes and regenerated polygons (files listed in evidence)\n\`\`\`\n\n## Evidence\n\n${details}\n\n[Download before/after maps, hash/coverage report and advisory Jev input/results](${process.env.EVIDENCE_URL}). Artifact retention is 30 days; rerun if expired before review. Linux unit/data/build/bundle/browser checks and byte-identical cached replay passed before this proposal.\n\nA maintainer must inspect historical interpretation and mark ready for review to trigger normal PR checks. GITHUB_TOKEN-created draft PRs do not start those checks automatically. No automatic merge or publication occurs.\n\n## Merge Danger\n\nTwo-way technical rollback by reverting this PR, but inaccurate historical claims could mislead visitors while published. Review each affected year, exclusions, licenses and primary evidence; Jev is advisory.\n`;
      await writeFile('artifacts/data-review/pr-body.md', body);
      console.log(
        gh(
          'pr',
          'create',
          '--draft',
          '--base',
          'main',
          '--head',
          branch,
          '--title',
          'chore(data): review fresh geographic sources',
          '--body-file',
          'artifacts/data-review/pr-body.md',
        ),
      );
    }
  }
}
