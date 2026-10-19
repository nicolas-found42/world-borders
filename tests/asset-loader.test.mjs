import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createAssetLoader } from '../src/asset-loader.mjs';
const manifest = JSON.parse(
  await readFile(new URL('../public/data/manifest.json', import.meta.url)),
);
const data = JSON.parse(
  await readFile(new URL('../public/data/snapshot-1880.geojson', import.meta.url)),
);
test('cancellation suppresses an obsolete response even if transport ignores the abort', async () => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const loader = createAssetLoader({
    fetcher: async () => {
      await gate;
      return { ok: true, json: async () => data };
    },
  });
  const controller = new AbortController();
  const pending = loader.loadStates(
    manifest,
    manifest.states.filter((s) => s.time.year === 1880),
    controller.signal,
  );
  controller.abort();
  release();
  await assert.rejects(pending, { name: 'AbortError' });
});

test('failed or malformed assets can be retried and cached assets belong to one revision', async () => {
  let calls = 0;
  const states = manifest.states.filter((s) => s.time.year === 1880);
  const loader = createAssetLoader({
    fetcher: async () => {
      calls++;
      if (calls === 1) return { ok: false, status: 503 };
      if (calls === 2)
        return { ok: true, json: async () => ({ type: 'FeatureCollection', features: [] }) };
      return { ok: true, json: async () => data };
    },
  });
  await assert.rejects(loader.loadStates(manifest, states), /503/);
  await assert.rejects(loader.loadStates(manifest, states), /nonempty/);
  assert.equal((await loader.loadStates(manifest, states)).length, 5);
  assert.equal((await loader.loadStates(manifest, states)).length, 5);
  assert.throws(() => {
    data.features[0].geometry.coordinates[0][0][1][0] += 0.01;
  }, TypeError);
  assert.equal(calls, 3);
  await loader.loadStates({ ...manifest, revision: 'changed' }, states);
  assert.equal(calls, 4);
});

test('unknown polity metadata in an otherwise valid asset cannot enter the cache', async () => {
  const altered = structuredClone(data);
  altered.features[0].properties.sourceId = 'unknown-source';
  const loader = createAssetLoader({
    fetcher: async () => ({ ok: true, json: async () => altered }),
  });
  await assert.rejects(
    loader.loadStates(
      manifest,
      manifest.states.filter((s) => s.time.year === 1880),
    ),
    /metadata mismatch/,
  );
});

test('changed output changes the revision and stale geometry fails the digest check', async () => {
  const { finalizeAssetRevision } = await import('../scripts/boundary-manifest.mjs');
  const states = manifest.states.filter((s) => s.time.year === 1880);
  const altered = structuredClone(data);
  const ring = altered.features[0].geometry.coordinates[0][0];
  ring[1][0] += 0.001;
  const changed = finalizeAssetRevision(
    structuredClone(manifest),
    new Map([['snapshot-1880.geojson', altered]]),
  );
  assert.notEqual(changed.revision, manifest.revision);
  let supplied = data;
  let calls = 0;
  const loader = createAssetLoader({
    fetcher: async () => {
      calls++;
      return { ok: true, json: async () => supplied };
    },
  });
  await loader.loadStates(manifest, states);
  await assert.rejects(
    loader.loadStates({ ...changed, revision: manifest.revision }, states),
    /digest mismatch/,
  );
  await assert.rejects(loader.loadStates(changed, states), /digest mismatch/);
  supplied = altered;
  const loaded = await loader.loadStates(changed, states);
  assert.deepEqual(loaded[0].geometry, altered.features[0].geometry);
  assert.equal(calls, 3);
});

test('boot rejects a manifest whose contents do not match its declared revision', async () => {
  const land = JSON.parse(await readFile(new URL('../public/data/land.geojson', import.meta.url)));
  let supplied = manifest;
  const loader = createAssetLoader({
    fetcher: async (path) => ({
      ok: true,
      json: async () => (path.endsWith('manifest.json') ? supplied : land),
    }),
  });
  assert.equal((await loader.boot()).manifest.revision, manifest.revision);
  supplied = structuredClone(manifest);
  supplied.limitations.push('Changed without a new revision');
  await assert.rejects(loader.boot(), /manifest revision mismatch/);
});

test('network retries revalidate the HTTP cache for manifests and geometry', async () => {
  const requests = [];
  const land = JSON.parse(await readFile(new URL('../public/data/land.geojson', import.meta.url)));
  const loader = createAssetLoader({
    fetcher: async (path, options) => {
      requests.push(options);
      return {
        ok: true,
        json: async () =>
          path.endsWith('manifest.json') ? manifest : path.endsWith('land.geojson') ? land : data,
      };
    },
  });
  await loader.boot();
  await loader.loadStates(
    manifest,
    manifest.states.filter((s) => s.time.year === 1880),
  );
  assert.equal(requests.length, 3);
  assert(requests.every((r) => r.cache === 'no-cache'));
});
