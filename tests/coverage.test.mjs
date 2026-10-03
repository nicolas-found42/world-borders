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
  assert.equal(bundle.snapshots.length, 5);
  const selected = bundle.states.find((s) => s.id === 'canada-1949');
  assert.equal(selected.time.kind, 'snapshot');
  assert.equal(selected.representation, 'legal-affiliation');
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
    (m) => {
      m.states = [];
    },
    (m) => {
      m.states[0].time.year = 1881;
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
    (m) => {
      m.features[0].geometry.coordinates[0][1].push(Infinity);
    },
  ]) {
    const copy = structuredClone(valid);
    mutate(copy);
    assert.throws(() => validateGeometry(copy), /Invalid boundary data/);
  }
});

test('evidenced intervals are start inclusive and end exclusive; annual geometry cannot answer exact days', async () => {
  const { resolveCoverage } = await import('../src/coverage.mjs');
  assert.equal(resolveCoverage(manifest, { time: 1776 }).status, 'gap');
  assert.equal(resolveCoverage(manifest, { time: 1880.9 }).states.length, 5);
  assert.equal(resolveCoverage(manifest, { time: 1881 }).status, 'gap');
  assert.equal(resolveCoverage(manifest, { time: 1880, precision: 'day' }).status, 'gap');
  const fixture = structuredClone(manifest);
  fixture.snapshots = [];
  fixture.events = [];
  fixture.states = [
    {
      ...fixture.states[0],
      coverage: 'covered',
      evidenceIds: ['period'],
      disposition: {
        status: 'approved-reference',
        reviewer: 'Fixture',
        reason: 'Test only',
        conflicts: [],
      },
      regions: ['canada'],
      time: {
        kind: 'interval',
        start: 1949,
        end: 1950,
        precision: 'year',
        evidenceIds: ['period'],
      },
    },
  ];
  fixture.evidence = [
    {
      id: 'period',
      sourceId: 'nrcan',
      assertion: 'Explicit interval fixture',
      text: 'Fixture only: 1949 inclusive to 1950 exclusive',
      sha256: 'a'.repeat(64),
    },
  ];
  validateManifest(fixture);
  assert.equal(resolveCoverage(fixture, { time: 1948.99, regions: ['canada'] }).status, 'gap');
  assert.equal(resolveCoverage(fixture, { time: 1949, regions: ['canada'] }).status, 'covered');
  assert.equal(resolveCoverage(fixture, { time: 1949.99, regions: ['canada'] }).states.length, 1);
  assert.equal(resolveCoverage(fixture, { time: 1950, regions: ['canada'] }).status, 'gap');
  assert.deepEqual(
    resolveCoverage(fixture, { time: 1949, regions: ['canada', 'mexico'] }).missingRegions,
    ['mexico'],
  );
  assert.equal(
    resolveCoverage(fixture, {
      time: 1949,
      regions: ['canada'],
      representation: 'effective-control',
      layers: ['control'],
    }).status,
    'gap',
  );
  assert.deepEqual(
    resolveCoverage(fixture, { time: 1949, regions: ['canada'], layers: ['political', 'dispute'] })
      .missingLayers,
    ['dispute'],
  );
  const overlap = { ...fixture.states[0], id: 'conflicting' };
  fixture.states.push(overlap);
  assert.equal(resolveCoverage(fixture, { time: 1949, regions: ['canada'] }).status, 'error');
  assert.equal(resolveCoverage(fixture, { time: 1949, revision: 'obsolete' }).status, 'error');
  fixture.states[0].time.evidenceIds = [];
  assert.throws(() => validateManifest(fixture), /interval/);
});

test('Canada1949 is an annual post-entry reference and cannot supply the exact union date or other regions', async () => {
  const { resolveCoverage } = await import('../src/coverage.mjs');
  const coverage = resolveCoverage(manifest, { time: 1949 });
  assert.equal(coverage.status, 'partial');
  assert.deepEqual(
    coverage.states.map((state) => state.id),
    ['canada-1949'],
  );
  assert(coverage.missingRegions.includes('usa'));
  assert(coverage.missingRegions.includes('mexico'));
  assert.equal(resolveCoverage(manifest, { time: 1949, precision: 'day' }).status, 'gap');
  assert.equal(resolveCoverage(manifest, { time: 1950 }).status, 'gap');
  assert.deepEqual(manifest.events[0].date, { year: 1949, month: 3, day: 31 });
  assert.equal(resolveCoverage(manifest, { time: 1949, regions: ['mexico'] }).status, 'gap');
});

test('available-state navigation uses interval starts without jumping backward on next', async () => {
  const { adjacentAvailableMoment } = await import('../src/coverage.mjs');
  const fixture = {
    ...manifest,
    states: [
      {
        ...manifest.states[0],
        regions: ['north-america'],
        time: { kind: 'interval', start: 1949.25, end: 1950, precision: 'day' },
      },
      { ...manifest.states[1], time: { kind: 'snapshot', year: 1960, precision: 'year' } },
    ],
  };
  assert.equal(adjacentAvailableMoment(fixture, 1949.5, 1), 1960);
  assert.equal(adjacentAvailableMoment(fixture, 1949.5, -1), null);
  assert.equal(adjacentAvailableMoment(fixture, 1949, 1), 1949.25);
  assert.equal(adjacentAvailableMoment(manifest, 1960.5, -1), 1949);
});
