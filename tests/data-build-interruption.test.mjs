import test from 'node:test';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, utimes } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stagedDataBuild } from '../scripts/staged-data-build.mjs';

const child = (root, point) =>
  fork(new URL('./fixtures/data-build-child.mjs', import.meta.url), [root, point], {
    stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
  });
async function start(root) {
  for (const name of ['cache', 'output']) {
    await mkdir(join(root, name));
    await writeFile(join(root, name, 'version'), 'old');
  }
}
async function expireLeases(root) {
  const old = new Date(Date.now() - 180000);
  for (const name of (await readdir(root)).filter((n) => n.endsWith('.build-lock')))
    await utimes(join(root, name), old, old);
}

test(
  'real killed processes recover at initialization, staging, install and commit boundaries',
  { timeout: 30000 },
  async () => {
    for (const point of [
      'locked',
      'initialized',
      'planned-0',
      'staged-0',
      'planned-1',
      'staged-1',
      'installing',
      'backed-up-0',
      'installed-0',
      'backed-up-1',
      'installed-1',
      'committed',
    ]) {
      const root = await mkdtemp(join(tmpdir(), 'world-borders-killed-'));
      let process;
      try {
        await start(root);
        process = child(root, point);
        assert.deepEqual((await once(process, 'message'))[0], { point });
        const stopped = once(process, 'exit');
        process.kill('SIGKILL');
        await stopped;
        // Advance lease age deterministically; no arbitrary waiting for a dead owner.
        await expireLeases(root);
        await stagedDataBuild(join(root, 'cache'), join(root, 'output'), async () => {
          for (const name of ['cache', 'output'])
            assert.equal(
              await readFile(join(root, name, 'version'), 'utf8'),
              point === 'committed' ? 'new' : 'old',
              point,
            );
        });
        assert.deepEqual((await readdir(root)).sort(), ['cache', 'output']);
      } finally {
        if (process && process.exitCode === null && process.signalCode === null)
          process.kill('SIGKILL');
        await rm(root, { recursive: true, force: true });
      }
    }
  },
);

test(
  'two recoverers serialize even with a reused live PID; empty legacy markers recover',
  { timeout: 10000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'world-borders-recoverers-'));
    let first;
    let second;
    try {
      await start(root);
      const marker = join(root, '.cache.transaction.json');
      await writeFile(
        marker,
        JSON.stringify({ pid: globalThis.process.pid, phase: 'building', entries: [] }),
      );
      first = child(root, 'recovered');
      assert.deepEqual((await once(first, 'message'))[0], { point: 'recovered' });
      second = child(root, 'recovered');
      const rejected = (await once(second, 'message'))[0];
      assert.equal(rejected.code, 'ELOCKED');
      const firstDone = once(first, 'message');
      first.send('continue');
      assert.deepEqual((await firstDone)[0], { done: true });
      await writeFile(marker, '');
      await stagedDataBuild(join(root, 'cache'), join(root, 'output'), async () => {});
      assert.deepEqual((await readdir(root)).sort(), ['cache', 'output']);
    } finally {
      for (const process of [first, second])
        if (process && process.exitCode === null && process.signalCode === null)
          process.kill('SIGKILL');
      await rm(root, { recursive: true, force: true });
    }
  },
);
