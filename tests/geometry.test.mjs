import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { geoArea, geoContains } from 'd3-geo';
import { globeGeometry } from '../src/geometry.mjs';
globalThis.window = {};
const { default: ConicPolygonGeometry } = await import('three-conic-polygon-geometry');
const manifest = JSON.parse(await readFile(new URL('../public/data/manifest.json', import.meta.url)));
const snapshots = new Map();
for (const s of manifest.snapshots) snapshots.set(s.year, JSON.parse(await readFile(new URL(`../public/data/${s.file}`, import.meta.url))));
function contains(year, id, point) {
  return snapshots.get(year).features.filter(f => f.properties.id === id).some(f => geoContains(globeGeometry(f.geometry), point));
}
test('A polygon with a hole preserves land and water with either input winding', () => {
  const outer = [[0,0],[4,0],[4,4],[0,4],[0,0]];
  const hole = [[1,1],[1,3],[3,3],[3,1],[1,1]];
  for (const reverse of [false, true]) {
    const geometry = globeGeometry({type:'Polygon',coordinates:reverse ? [outer.toReversed(), hole.toReversed()] : [outer, hole]});
    assert(geoContains(geometry,[0.5,0.5]));
    assert(!geoContains(geometry,[2,2]));
    assert(!geoContains(geometry,[30,30]));
  }
});
test('A date-line island does not become the rest of the globe', () => {
  const geometry = globeGeometry({type:'Polygon',coordinates:[[[179,50],[-179,50],[-179,52],[179,52],[179,50]]]});
  assert(geoContains(geometry,[180,51]));
  assert(!geoContains(geometry,[0,51]));
  assert(geoArea(geometry)<0.01);
});
test('Official Canadian islands stay small; globe triangulation remains bounded', () => {
  const canada = snapshots.get(1880).features.find(f => f.properties.id === 'canada');
  let vertices = 0;
  for (const coordinates of globeGeometry(canada.geometry).coordinates) {
    const geometry = new ConicPolygonGeometry(coordinates,0,100,false,true,false,3);
    vertices += geometry.attributes.position.count;
    geometry.dispose();
  }
  // Regression: opposite winding generated >1.7 million vertices and froze the page.
  assert(vertices<30000,`Canadian triangulation unexpectedly generated ${vertices} vertices`);
});
test('Sourced ownership checks: Hawaii changes identity; Newfoundland remains separate in 1880', () => {
  assert(contains(1880,'hawaii',[-157.85,21.3]));
  assert(!contains(1880,'usa',[-157.85,21.3]));
  assert(contains(1938,'usa',[-157.85,21.3]));
  assert(contains(1880,'newfoundland',[-56,48.8]));
  assert(!contains(1880,'canada',[-56,48.8]));
  assert(contains(1938,'newfoundland',[-56,48.8]));
  assert(!contains(1938,'canada',[-56,48.8]));
  assert(contains(2010,'canada',[-56,48.8]));
});
test('Data has explicit provenance, closed finite rings, and no NC-required source', () => {
  assert(!manifest.sources.some(s=>s.license.includes('NonCommercial')));
  for (const snapshot of manifest.snapshots) {
    assert(snapshot.inputs.every(i=>i.url.startsWith('https://') && /^[0-9a-f]{64}$/.test(i.sha256)));
    for (const f of snapshots.get(snapshot.year).features) {
      assert(manifest.sources.some(s=>s.id===f.properties.sourceId));
      for (const p of f.geometry.type==='Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) for (const ring of p) {
        assert(ring.length>=4); assert.deepEqual(ring[0],ring.at(-1));
        assert(ring.every(([x,y])=>Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x)<=180.001&&Math.abs(y)<=90));
      }
    }
  }
});
