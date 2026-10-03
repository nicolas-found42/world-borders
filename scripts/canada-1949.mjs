import { union } from '@turf/union';
import { featureCollection } from '@turf/helpers';
import { createHash } from 'node:crypto';
import { publicationDisposition } from './curation-policy.mjs';
import { validateGeometry } from '../src/boundary-contract.mjs';
export const canada1949Url =
  'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/territorial_evolution_en/MapServer/8/query?where=START_TIME%3D1949&outFields=PROV_NAME,START_TIME,END_TIME,Period_Group&outSR=4326&maxAllowableOffset=0&f=geojson';
function simplifyRing(ring, tolerance = 0.03) {
  const keep = new Set([0, ring.length - 1]);
  const stack = [[0, ring.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    const a = ring[first],
      b = ring[last];
    const dx = b[0] - a[0],
      dy = b[1] - a[1];
    const length = dx * dx + dy * dy;
    let farthest = -1,
      maximum = tolerance * tolerance;
    for (let i = first + 1; i < last; i++) {
      const p = ring[i];
      const t = length
        ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length))
        : 0;
      const distance = (p[0] - a[0] - t * dx) ** 2 + (p[1] - a[1] - t * dy) ** 2;
      if (distance > maximum) {
        farthest = i;
        maximum = distance;
      }
    }
    if (farthest !== -1) {
      keep.add(farthest);
      stack.push([first, farthest], [farthest, last]);
    }
  }
  const simplified = ring.filter((_, i) => keep.has(i));
  return simplified.length >= 4 ? simplified : ring;
}
const polygonParts = (geometry) =>
  geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
function canonicalRing(ring) {
  const points = ring.slice(0, -1).map((point) => JSON.stringify(point));
  const first = points.indexOf([...points].sort()[0]);
  const rotated = [...points.slice(first), ...points.slice(0, first)];
  return [rotated.join(';'), [rotated[0], ...rotated.slice(1).reverse()].join(';')].sort()[0];
}
export function topologySignature(geometry) {
  return polygonParts(geometry)
    .map(
      (polygon) =>
        `${canonicalRing(polygon[0])}|${polygon.slice(1).map(canonicalRing).sort().join('|')}`,
    )
    .sort()
    .join('||');
}
export function simplifyCanadaGeometry(geometry) {
  for (const tolerance of [0.03, 0.01, 0.003, 0.001, 0.0003, 0]) {
    const candidate = {
      type: 'MultiPolygon',
      coordinates: polygonParts(geometry).map((polygon) =>
        polygon.map((ring) => (tolerance ? simplifyRing(ring, tolerance) : ring)),
      ),
    };
    const feature = { type: 'Feature', properties: {}, geometry: candidate };
    const normalized = union(featureCollection([feature, feature]));
    if (normalized && topologySignature(candidate) === topologySignature(normalized.geometry))
      return { geometry: candidate, tolerance };
  }
  throw new Error('Canadian geometry fails topology normalization; curator review required');
}
export function prepareCanada1949(source) {
  validateGeometry(source.data);
  const divisions = source.data.features;
  if (
    !divisions.every(
      (f) =>
        f.properties.START_TIME === 1949 &&
        f.properties.END_TIME === 1949 &&
        f.properties.Period_Group === 'Canada (1949)',
    ) ||
    !divisions.some((f) => f.properties.PROV_NAME === 'Newfoundland')
  )
    throw new Error('1949 source scope changed; curator review required');
  const merged = union(featureCollection(divisions));
  if (!merged) throw new Error('Could not dissolve Canadian divisions');
  const simplified = simplifyCanadaGeometry(merged.geometry);
  merged.geometry = simplified.geometry;
  const collection = {
    type: 'FeatureCollection',
    simplificationDegrees: simplified.tolerance,
    topologyCheck: 'Self-union preserves canonical component, hole and ring boundaries',
    features: [
      {
        ...merged,
        properties: {
          id: 'canada',
          name: 'Canada',
          color: '#8db9c6',
          sourceId: 'nrcan',
          precision: 'generalized',
          representation:
            'Legal affiliation: official annual Canada (1949) reference, not effective control or exact-day geometry',
          review: 'official-source',
          upstreamNames: divisions.map((f) => f.properties.PROV_NAME),
        },
      },
    ],
  };
  validateGeometry(collection, { territories: true });
  return collection;
}
export function addCanada1949(manifest, source, record) {
  const collection = prepareCanada1949(source);
  const input = { url: source.url, sha256: source.hash };
  const snapshot = {
    year: 1949,
    file: 'snapshot-1949.geojson',
    corrections: [],
    inputs: [input],
    coverage: 'snapshot-year-only',
  };
  manifest.snapshots.push(snapshot);
  manifest.snapshots.sort((a, b) => a.year - b.year);
  const evidence = [
    {
      id: 'newfoundland-union-date',
      sourceId: 'newfoundland-check',
      assertion: 'Newfoundland entered Confederation on 31 March 1949.',
      text: 'Newfoundland entered Confederation on 31 March 1949.',
    },
    {
      id: 'newfoundland-union-legal',
      sourceId: 'newfoundland-union-act',
      assertion:
        'The Terms of Union establish Newfoundland as a Canadian province from the date of Union.',
      text: 'Newfoundland shall form part of Canada and shall be a province thereof.',
    },
    {
      id: 'canada-1949-source-scope',
      sourceId: 'nrcan',
      assertion: 'The annual layer assigns Newfoundland to Canada (1949).',
      text: 'PROV_NAME=Newfoundland; START_TIME=1949; END_TIME=1949; Period_Group=Canada (1949)',
    },
  ].map((item) => ({ ...item, sha256: createHash('sha256').update(item.text).digest('hex') }));
  evidence[0].sourcePageSha256 = '0a2a15bb1b24b285ddde9dbe868f9ef3f0b574888505e5ae08ce9bc041f5e547';
  evidence[1].sourcePageSha256 = '37d43715ea1a5f32f94275eeb70507d8900b75c7578bab950f1b29632cfc0365';
  evidence[2].sourcePageSha256 = source.hash;
  manifest.evidence.push(...evidence);
  manifest.sources.push({
    id: 'newfoundland-union-act',
    name: 'British North America Act 1949, Terms of Union',
    author: 'UK Parliament',
    license: 'Linked reference only',
    url: 'https://www.legislation.gov.uk/ukpga/Geo6/12-13-14/22/enacted',
    note: 'Terms 1–2 establish legal affiliation and territorial definition; statute is evidence, not polygon coordinates.',
  });
  const state = {
    id: 'canada-1949',
    polityId: 'canada',
    featureId: 'canada',
    file: snapshot.file,
    sourceIds: ['nrcan'],
    inputs: [input],
    regions: ['north-america', 'canada-newfoundland'],
    coverage: 'partial',
    representation: 'legal-affiliation',
    time: { kind: 'snapshot', year: 1949, precision: 'year' },
    precision: 'generalized',
    review: 'official-source',
    evidenceIds: evidence.map((e) => e.id),
    limitations: [
      'Annual source depicts Canada after Newfoundland’s entry; the March 31 event does not establish day-valid geometry or an interval.',
      'US and Mexico geometry for 1949 is unavailable. Nearby-island, Indigenous and disputed-boundary coverage remains incomplete.',
      'Official generalized reference geometry, not independent historical boundary validation or effective-control evidence.',
      'Unsimplified official divisions dissolved, then Douglas–Peucker simplification starting at 0.03 degrees with finer or unsimplified fallback until topology normalization preserves every component, hole and ring boundary. Selected tolerance is recorded on the asset; source boundary points are retained. Government of Canada does not endorse this application.'.replace(
        'Selected tolerance is recorded on the asset',
        `Selected tolerance: ${collection.simplificationDegrees} degrees`,
      ),
    ],
  };
  const transformation =
    'Fetch official unsimplified divisions, dissolve to national outline, then simplify rings starting at 0.03 degrees, falling back to finer or unsimplified geometry until self-union preserves canonical component, hole and ring boundaries. Record the selected tolerance and retain source boundary points. Preserve small islands and holes.';
  state.disposition = publicationDisposition(source, record, {
    state,
    evidence,
    transformation,
    geometrySha256: createHash('sha256').update(JSON.stringify(collection)).digest('hex'),
  });
  manifest.states.push(state);
  manifest.events.push({
    id: 'newfoundland-union-1949',
    name: 'Newfoundland’s entry into Canada',
    kind: 'legal-union',
    date: { year: 1949, month: 3, day: 31 },
    precision: 'day',
    polityIds: ['newfoundland', 'canada'],
    beforeStateIds: ['newfoundland-1938'],
    afterStateIds: ['canada-1949'],
    evidenceIds: ['newfoundland-union-date', 'newfoundland-union-legal'],
    limitations: [
      'Before/after references are sparse annual snapshots, not exact-day boundary geometry.',
    ],
  });
  manifest.sources.find((s) => s.id === 'nrcan').note =
    '1880 historical Canadian geometry uses service simplification at 0.03 degrees. For 1949, unsimplified official divisions are dissolved, then simplified with Douglas–Peucker starting at 0.03 degrees with finer or unsimplified fallback until topology normalization preserves every component, hole and ring boundary. Selected tolerance is recorded on the asset; source boundary points are retained. Contains information licensed under the Open Government Licence – Canada (https://open.canada.ca/en/open-government-licence-canada). Government of Canada does not endorse this application.';
  manifest.limitations[0] =
    'Five annual reference snapshots, including partial Canada 1949. No continuous coverage or verified 1776 geometry; other years show neutral land.';
  manifest.limitations[1] =
    '1880 Canada/Newfoundland and partial Canada 1949 use official historical service geometry. Historical boundaries remain generalized reference data pending independent boundary validation.';
  const { revision: unused, ...content } = manifest;
  void unused;
  manifest.revision = createHash('sha256').update(JSON.stringify(content)).digest('hex');
  return { manifest, collection };
}
