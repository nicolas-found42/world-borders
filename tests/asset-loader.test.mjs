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
