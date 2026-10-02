import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { snapshotForYear, adjacentSnapshot, advanceTime, clampYear } from '../src/timeline.mjs';
const manifest = JSON.parse(await readFile(new URL('../public/data/manifest.json', import.meta.url)));

test('Unsupported years never inherit an earlier territorial state', () => {
  for (const year of [1776, 1782.9, 1784, 1848, 1881, 2000, 2026]) assert.equal(snapshotForYear(manifest.snapshots, year), null);
  assert.equal(snapshotForYear(manifest.snapshots, 1880.9).year, 1880);
});
test('Snapshot stepping respects sparse coverage and range edges', () => {
  assert.equal(adjacentSnapshot(manifest.snapshots, 1880.5, 1), 1938);
  assert.equal(adjacentSnapshot(manifest.snapshots, 1960, -1), 1938);
  assert.equal(adjacentSnapshot(manifest.snapshots, 1776, -1), null);
  assert.equal(adjacentSnapshot(manifest.snapshots, 2026, 1), null);
});
test('Chronological playback respects speed, bounds and negative frame deltas', () => {
  assert.equal(advanceTime(1880, 0.5, 4), 1882);
  assert.equal(advanceTime(2025.9, 1, 12), 2026);
  assert.equal(advanceTime(1880, -1, 12), 1880);
  assert.equal(clampYear(1500), 1776);
});
