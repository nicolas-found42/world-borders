import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkBundle } from '../scripts/check-bundle.mjs';

test('bundle budget counts every JS chunk and rejects missing or oversized builds', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'world-borders-budget-'));
  try {
    await assert.rejects(checkBundle(directory, 1000), /No JavaScript/);
    await writeFile(join(directory, 'a.js'), 'console.log(1)');
    const first = await checkBundle(directory, 1000);
    await writeFile(join(directory, 'b.js'), 'console.log(2)');
    await assert.rejects(checkBundle(directory, first.total), /exceeds budget/);
    assert.equal((await checkBundle(directory, 1000)).files.length, 2);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
