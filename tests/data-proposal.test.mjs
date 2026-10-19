import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('../scripts/propose-data-refresh.mjs', import.meta.url));

test('changed-data proposal pushes only a review branch and requests a draft; duplicate/no-change runs do not publish', async () => {
  const root = await mkdtemp(join(tmpdir(), 'world-borders-proposal-'));
  const cwd = join(root, 'checkout');
  const bin = join(root, 'bin');
  await mkdir(join(cwd, 'public/data'), { recursive: true });
  await mkdir(join(cwd, 'artifacts/data-review'), { recursive: true });
  await mkdir(bin);
  const git = (...args) =>
    execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const calls = join(root, 'gh-calls.jsonl');
  await writeFile(
    join(bin, 'gh'),
    `#!/usr/bin/env node\nconst fs = require('node:fs');\nconst args = process.argv.slice(2);\nfs.appendFileSync(process.env.CALLS, JSON.stringify(args)+'\\n');\nif (args[1] === 'create' && process.env.FAIL_CREATE) process.exit(23);\nconsole.log(args[1] === 'list' ? (process.env.PROPOSAL_EXISTS ? '[{"url":"https://example.test/pr/1"}]' : '[]') : 'https://example.test/pr/1');\n`,
    { mode: 0o755 },
  );
  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    CALLS: calls,
    EVIDENCE_URL: 'https://example.test/artifact/1',
  };
  const run = (extra) =>
    execFileSync(process.execPath, [script], { cwd, env: { ...env, ...extra }, encoding: 'utf8' });
  const reportPath = join(cwd, 'artifacts/data-review/evidence.json');
  try {
    git('init', '-b', 'main');
    git('config', 'user.name', 'Test');
    git('config', 'user.email', 'test@example.test');
    await writeFile(join(cwd, 'public/data/manifest.json'), '{}');
    git('add', 'public/data');
    git('commit', '-m', 'test: baseline');
    git('init', '--bare', join(root, 'remote.git'));
    git('remote', 'add', 'origin', join(root, 'remote.git'));
    git('push', 'origin', 'main');
    const main = git('rev-parse', 'main');
    await writeFile(reportPath, JSON.stringify({ changedFiles: [], after: { files: {} } }));
    assert.match(run(), /No changed data/);
    assert.equal(git('rev-parse', 'HEAD'), main);
    await writeFile(join(cwd, 'public/data/manifest.json'), '{"refreshed":true}');
    await writeFile(
      reportPath,
      JSON.stringify({
        changedFiles: ['manifest.json'],
        after: {
          files: {
            'manifest.json': {
              sha256: createHash('sha256').update('{"refreshed":true}').digest('hex'),
            },
          },
        },
      }),
    );
    await writeFile(join(cwd, 'artifacts/data-review/report.md'), 'Observed source evidence');
    assert.throws(() => run({ FAIL_CREATE: '1' }));
    const pushedHead = git('rev-parse', 'HEAD');
    run();
    assert.equal(git('rev-parse', 'HEAD'), pushedHead, 'Recovery must reuse the pushed commit');
    const branch = git('branch', '--show-current');
    assert.match(branch, /^codex\/data-refresh-[a-f0-9]{12}$/);
    assert.equal(git('rev-parse', 'origin/main'), main);
    assert.notEqual(git('rev-parse', `origin/${branch}`), main);
    const commands = (await readFile(calls, 'utf8')).trim().split('\n').map(JSON.parse);
    assert(commands.some((args) => args[1] === 'create' && args.includes('--draft')));
    const head = git('rev-parse', 'HEAD');
    assert.match(run({ PROPOSAL_EXISTS: '1' }), /already covers/);
    assert.equal(git('rev-parse', 'HEAD'), head);
    // Main may advance after push; proposal validation uses its own historical base.
    git('switch', 'main');
    await writeFile(join(cwd, 'public/data/main-advanced.json'), '{}');
    git('add', 'public/data');
    git('commit', '-m', 'test: main advances');
    git('push', 'origin', 'main');
    git('switch', branch);
    assert.match(run(), /example.test/);
    await writeFile(join(cwd, 'unrelated-app.js'), 'unreviewed');
    git('add', 'unrelated-app.js');
    git('commit', '-m', 'test: unrelated remote change');
    git('push', 'origin', branch);
    assert.throws(() => run(), /unexpected changes outside/);
    git('rm', 'unrelated-app.js');
    git('commit', '-m', 'test: remove unrelated change');
    git('push', 'origin', branch);
    await writeFile(join(cwd, 'public/data/unexpected.json'), '{}');
    git('add', 'public/data');
    git('commit', '-m', 'test: unexpected remote file');
    git('push', 'origin', branch);
    assert.throws(() => run(), /unexpected data file set/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
