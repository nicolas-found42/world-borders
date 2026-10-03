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
