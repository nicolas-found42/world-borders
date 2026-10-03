import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareCanada1949 } from '../scripts/canada-1949.mjs';

test('Canada import dissolves shared divisions then simplifies while retaining source points and islands', () => {
  const feature = (name, coordinates) => ({
    type: 'Feature',
    properties: {
      PROV_NAME: name,
      START_TIME: 1949,
      END_TIME: 1949,
      Period_Group: 'Canada (1949)',
    },
    geometry: { type: 'Polygon', coordinates: [coordinates] },
  });
  const left = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
    [0, 0],
  ];
  const right = [
    [1, 0],
    [1.5, 0.001],
    [2, 0],
    [2, 1],
    [1, 1],
    [1, 0],
  ];
  const island = [
    [4, 0],
    [4.01, 0],
    [4.01, 0.01],
    [4, 0.01],
    [4, 0],
  ];
  const source = {
    data: {
      type: 'FeatureCollection',
      features: [
        feature('Quebec', left),
        feature('Newfoundland', right),
        feature('District of Franklin', island),
      ],
    },
  };
  const result = prepareCanada1949(source);
  assert.equal(result.features.length, 1);
  assert.equal(result.features[0].properties.id, 'canada');
  const polygons = result.features[0].geometry.coordinates;
  assert.equal(polygons.length, 2);
  assert(!polygons.flat(2).some((p) => p[0] === 1.5));
  const sourcePoints = new Set([left, right, island].flat().map((p) => JSON.stringify(p)));
  assert(polygons.flat(2).every((p) => sourcePoints.has(JSON.stringify(p))));
  assert.equal(polygons[0].length, 1); // No seam or artificial water hole at the shared provincial edge.
});
