import test from 'node:test';
import assert from 'node:assert/strict';
import { compareBundles } from '../scripts/data-report.mjs';

test('data change reports identify additions, removals and changed bytes, preserving coverage evidence', () => {
  const before = {
    files: { kept: { sha256: 'a' }, removed: { sha256: 'b' }, changed: { sha256: 'c' } },
    coverage: [{ year: 1880 }],
    exclusions: ['1800'],
  };
  const after = {
    files: { kept: { sha256: 'a' }, added: { sha256: 'd' }, changed: { sha256: 'e' } },
    coverage: [{ year: 1938 }],
    exclusions: ['1800', '1880'],
  };
  const report = compareBundles(before, after);
  assert.deepEqual(report.changedFiles.sort(), ['added', 'changed', 'removed']);
  assert.deepEqual(report.before.coverage, [{ year: 1880 }]);
  assert.deepEqual(report.after.exclusions, ['1800', '1880']);
  assert.deepEqual(compareBundles(before, before).changedFiles, []);
});
