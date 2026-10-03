import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stagedDataBuild } from '../scripts/staged-data-build.mjs';

test('a later source failure preserves the complete active cache and bundle; success replaces both', async () => {
  const root = await mkdtemp(join(tmpdir(), 'world-borders-transaction-'));
  const cache = join(root, 'cache');
  const output = join(root, 'output');
  await mkdir(cache);
  await mkdir(output);
  await writeFile(join(cache, 'first.json'), 'old input');
  await writeFile(join(output, 'manifest.json'), 'old output');
  try {
    await assert.rejects(
      stagedDataBuild(cache, output, async (stagedCache, stagedOutput) => {
        await writeFile(join(stagedCache, 'first.json'), 'fresh first source');
        await writeFile(join(stagedOutput, 'manifest.json'), 'partial new output');
        throw new Error('Later source failed');
      }),
      /Later source failed/,
    );
    assert.equal(await readFile(join(cache, 'first.json'), 'utf8'), 'old input');
    assert.equal(await readFile(join(output, 'manifest.json'), 'utf8'), 'old output');
    assert.deepEqual((await readdir(root)).sort(), ['cache', 'output']);
    await stagedDataBuild(cache, output, async (stagedCache, stagedOutput) => {
      await writeFile(join(stagedCache, 'first.json'), 'all fresh');
      await writeFile(join(stagedOutput, 'manifest.json'), 'complete new output');
    });
    assert.equal(await readFile(join(cache, 'first.json'), 'utf8'), 'all fresh');
    assert.equal(await readFile(join(output, 'manifest.json'), 'utf8'), 'complete new output');
    assert.deepEqual((await readdir(root)).sort(), ['cache', 'output']);
    await assert.rejects(
      stagedDataBuild(cache, join(cache, 'nested'), () => {}),
      /non-nested/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('interruption at each directory rename boundary is recovered before the next build', async () => {
  const { spawnSync } = await import('node:child_process');
  const { rename } = await import('node:fs/promises');
  const deadPid = spawnSync(process.execPath, ['-e', '']).pid;
  for (const completedRenames of [0, 1, 2, 3, 4, 5]) {
    const root = await mkdtemp(join(tmpdir(), 'world-borders-interrupted-'));
    const cache = join(root, 'cache');
    const output = join(root, 'output');
    const entries = [cache, output].map((target, i) => ({
      target,
      stage: join(root, `stage-${i}`),
      backup: join(root, `backup-${i}`),
      hadOriginal: true,
    }));
    try {
      for (const entry of entries) {
        await mkdir(entry.target);
        await mkdir(entry.stage);
        await writeFile(join(entry.target, 'version'), 'old');
        await writeFile(join(entry.stage, 'version'), 'new');
      }
      await writeFile(
        join(root, '.cache.transaction.json'),
        JSON.stringify({
          pid: deadPid,
          phase: completedRenames === 5 ? 'committed' : 'installing',
          entries,
        }),
      );
      const operations = entries.flatMap((e) => [
        [e.target, e.backup],
        [e.stage, e.target],
      ]);
      for (const [from, to] of operations.slice(0, completedRenames)) await rename(from, to);
      await assert.rejects(
        stagedDataBuild(cache, output, async () => {
          assert.equal(
            await readFile(join(cache, 'version'), 'utf8'),
            completedRenames === 5 ? 'new' : 'old',
          );
          assert.equal(
            await readFile(join(output, 'version'), 'utf8'),
            completedRenames === 5 ? 'new' : 'old',
          );
          throw new Error('Stop after verified recovery');
        }),
        /Stop after verified recovery/,
      );
      assert.deepEqual((await readdir(root)).sort(), ['cache', 'output']);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
});

test('symlink targets and aliases cannot bypass directory separation', async () => {
  const { symlink } = await import('node:fs/promises');
  const root = await mkdtemp(join(tmpdir(), 'world-borders-paths-'));
  try {
    const cache = join(root, 'cache');
    await mkdir(cache);
    const alias = join(root, 'alias');
    await symlink(cache, alias, 'dir');
    await assert.rejects(
      stagedDataBuild(cache, alias, () => {}),
      /not symlinks/,
    );
    const parentAlias = join(root, 'parent-alias');
    await symlink(root, parentAlias, 'dir');
    await assert.rejects(
      stagedDataBuild(cache, join(parentAlias, 'cache'), () => {}),
      /non-nested/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
