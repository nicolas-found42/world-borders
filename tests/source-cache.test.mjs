import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fetchSource } from '../scripts/source-cache.mjs';

test('fresh inputs bypass cache, cached replay is identical, invalid refresh preserves good cache', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'world-borders-cache-'));
  let status = 200;
  let body = JSON.stringify({ type: 'FeatureCollection', features: [{ version: 1 }] });
  let requests = 0;
  const server = createServer((req, res) => {
    requests++;
    res.writeHead(status);
    res.end(body);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/data`;
  try {
    const first = await fetchSource('source.json', url, { directory });
    body = JSON.stringify({ type: 'FeatureCollection', features: [{ version: 2 }] });
    assert.deepEqual(await fetchSource('source.json', url, { directory }), first);
    assert.equal(requests, 1);
    const fresh = await fetchSource('source.json', url, { directory, refresh: true });
    assert.notEqual(fresh.hash, first.hash);
    assert.equal(fresh.data.features[0].version, 2);
    assert.deepEqual(await fetchSource('source.json', url, { directory }), fresh);
    body = '<html>outage</html>';
    await assert.rejects(fetchSource('source.json', url, { directory, refresh: true }));
    status = 503;
    await assert.rejects(fetchSource('source.json', url, { directory, refresh: true }), /503/);
    assert.deepEqual(await fetchSource('source.json', url, { directory }), fresh);
    await assert.rejects(fetchSource('../outside', url, { directory }), /Invalid/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
