import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateManifest, validateGeometry } from '../src/boundary-contract.mjs';

const manifest = JSON.parse(
  await readFile(new URL('../public/data/manifest.json', import.meta.url)),
);
test('the published manifest validates without upgrading snapshot review grades', () => {
  const bundle = validateManifest(manifest);
  assert.equal(bundle.schemaVersion, 2);
  assert.equal(bundle.snapshots.length, 4);
  assert(bundle.states.some((s) => s.review === 'official-source'));
  assert(bundle.states.some((s) => s.review === 'source-snapshot'));
  assert(bundle.states.every((s) => s.time.kind === 'snapshot'));
});

test('invalid source joins, licenses, paths and geometry fail before rendering', () => {
  for (const mutate of [
    (m) => {
      m.states[0].sourceIds = ['missing'];
    },
    (m) => {
      m.sources.find((s) => s.id === m.states[0].sourceIds[0]).license = 'Unknown';
    },
    (m) => {
      m.states[0].file = '../credentials.json';
    },
    (m) => {
      m.states[0].disposition.conflicts = ['unresolved owner'];
    },
    (m) => {
      m.states[0].representation = 'effective-control';
    },
  ]) {
    const copy = structuredClone(manifest);
    mutate(copy);
    assert.throws(() => validateManifest(copy), /Invalid boundary data/);
  }
  const valid = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [2, 0],
              [2, 2],
              [0, 0],
            ],
          ],
        },
      },
    ],
  };
  assert.equal(validateGeometry(valid), valid);
  for (const mutate of [
    (m) => {
      m.features[0].geometry.coordinates[0][1][0] = Infinity;
    },
    (m) => {
      m.features[0].geometry.coordinates[0].pop();
    },
    (m) => {
      m.features[0].geometry.coordinates = [];
    },
  ]) {
    const copy = structuredClone(valid);
    mutate(copy);
    assert.throws(() => validateGeometry(copy), /Invalid boundary data/);
  }
});
