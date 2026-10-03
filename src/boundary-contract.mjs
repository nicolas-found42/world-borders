const representations = [
  'source-political',
  'legal-affiliation',
  'effective-control',
  'territorial-claim',
  'dispute',
];
const grades = ['source-snapshot', 'official-source', 'reviewed-boundary'];
const geometryLicenses = [
  'GPL-3.0',
  'GPL-3.0-only',
  'Open Government Licence – Canada',
  'Public domain',
];
const assetPattern = /^[a-z0-9][a-z0-9.-]*\.(geojson|json)$/;
function requireValue(condition, message) {
  if (!condition) throw new Error(`Invalid boundary data: ${message}`);
}
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const unique = (values) => new Set(values).size === values.length;
const https = (value) => typeof value === 'string' && /^https:\/\//.test(value);
const hash = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
export function validateGeometry(data, { territories = false } = {}) {
  requireValue(
    data?.type === 'FeatureCollection' && Array.isArray(data.features) && data.features.length > 0,
    'expected nonempty FeatureCollection',
  );
  const ids = [];
  for (const feature of data.features) {
    requireValue(feature?.type === 'Feature', 'expected Feature');
    if (territories) {
      const p = feature.properties;
      requireValue(
        p &&
          ['id', 'name', 'color', 'sourceId', 'precision', 'representation', 'review'].every(
            (key) => text(p[key]),
          ),
        'territory metadata missing',
      );
      requireValue(/^#[a-fA-F0-9]{6}$/.test(p.color), 'territory color');
      ids.push(p.id);
    }
    const geometry = feature.geometry;
    requireValue(['Polygon', 'MultiPolygon'].includes(geometry?.type), 'expected polygon geometry');
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    requireValue(Array.isArray(polygons) && polygons.length > 0, 'empty polygon');
    for (const polygon of polygons) {
      requireValue(Array.isArray(polygon) && polygon.length > 0, 'missing outer ring');
      for (const ring of polygon) {
        requireValue(Array.isArray(ring) && ring.length >= 4, 'ring needs four points');
        for (const point of ring)
          requireValue(
            Array.isArray(point) &&
              [2, 3].includes(point.length) &&
              point.every(Number.isFinite) &&
              Number.isFinite(point[0]) &&
              Number.isFinite(point[1]) &&
              Math.abs(point[0]) <= 180.001 &&
              Math.abs(point[1]) <= 90,
            'nonfinite or out-of-range position',
          );
        requireValue(
          ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1],
          'unclosed ring',
        );
      }
    }
  }
  if (territories) requireValue(unique(ids), 'duplicate territory IDs');
  return data;
}
export function validateManifest(data) {
  requireValue(data?.schemaVersion === 2, 'unsupported schema version');
  requireValue(hash(data.revision), 'dataset revision missing');
  requireValue(
    data.assetDigests && typeof data.assetDigests === 'object' && !Array.isArray(data.assetDigests),
    'asset digests missing',
  );
  requireValue(
    Object.entries(data.assetDigests).every(
      ([file, digest]) => assetPattern.test(file) && hash(digest),
    ),
    'invalid asset digest',
  );
  requireValue(hash(data.assetDigests['land.geojson']), 'land asset digest missing');
  requireValue(
    Array.isArray(data.range) &&
      data.range.length === 2 &&
      data.range.every(Number.isInteger) &&
      data.range[0] < data.range[1],
    'range',
  );
  for (const key of [
    'snapshots',
    'sources',
    'states',
    'polities',
    'evidence',
    'events',
    'limitations',
  ])
    requireValue(Array.isArray(data[key]), `${key} must be an array`);
  const catalogs = {};
  for (const key of ['sources', 'states', 'polities', 'evidence', 'events']) {
    requireValue(
      data[key].every((item) => item && text(item.id)) && unique(data[key].map((item) => item.id)),
      `invalid or duplicate ${key} IDs`,
    );
    catalogs[key] = new Map(data[key].map((item) => [item.id, item]));
  }
  for (const state of data.states)
    requireValue(hash(data.assetDigests[state.file]), 'state asset digest missing');
  for (const source of data.sources)
    requireValue(
      ['name', 'author', 'license', 'note'].every((key) => text(source[key])) && https(source.url),
      'source attribution',
    );
  for (const polity of data.polities) requireValue(text(polity.name), 'polity name');
  for (const item of data.evidence)
    requireValue(
      catalogs.sources.has(item.sourceId) &&
        text(item.assertion) &&
        text(item.text) &&
        hash(item.sha256),
      'evidence provenance',
    );
  requireValue(unique(data.snapshots.map((item) => item.year)), 'duplicate snapshot years');
  for (const snapshot of data.snapshots)
    requireValue(
      Number.isInteger(snapshot.year) &&
        snapshot.year >= data.range[0] &&
        snapshot.year <= data.range[1] &&
        assetPattern.test(snapshot.file) &&
        Array.isArray(snapshot.corrections) &&
        Array.isArray(snapshot.inputs) &&
        snapshot.inputs.length > 0 &&
        snapshot.inputs.every((i) => https(i.url) && hash(i.sha256)),
      'snapshot provenance',
    );
  for (const state of data.states) {
    requireValue(
      catalogs.polities.has(state.polityId) &&
        text(state.featureId) &&
        assetPattern.test(state.file),
      'state identity or asset',
    );
    requireValue(
      Array.isArray(state.sourceIds) &&
        state.sourceIds.length > 0 &&
        state.sourceIds.every((id) => geometryLicenses.includes(catalogs.sources.get(id)?.license)),
      'unknown or incompatible geometry license',
    );
    requireValue(
      Array.isArray(state.inputs) &&
        state.inputs.length > 0 &&
        state.inputs.every((i) => https(i.url) && hash(i.sha256)),
      'state input hashes',
    );
    requireValue(
      representations.includes(state.representation) &&
        grades.includes(state.review) &&
        text(state.precision),
      'representation or review',
    );
    requireValue(
      Array.isArray(state.regions) &&
        state.regions.length > 0 &&
        state.regions.every(text) &&
        Array.isArray(state.limitations) &&
        state.limitations.every(text),
      'geographic extent or limitations',
    );
    requireValue(['partial', 'covered'].includes(state.coverage), 'coverage grade');
    requireValue(
      Array.isArray(state.evidenceIds) &&
        state.evidenceIds.every((id) => catalogs.evidence.has(id)),
      'state evidence join',
    );
    const time = state.time;
    if (time?.kind === 'snapshot')
      requireValue(
        time.precision === 'year' &&
          Number.isInteger(time.year) &&
          time.year >= data.range[0] &&
          time.year <= data.range[1],
        'snapshot time',
      );
    else {
      requireValue(
        time?.kind === 'interval' &&
          ['year', 'day'].includes(time.precision) &&
          Number.isFinite(time.start) &&
          Number.isFinite(time.end) &&
          time.start < time.end &&
          time.start >= data.range[0] &&
          time.end <= data.range[1] + 1 &&
          Array.isArray(time.evidenceIds) &&
          time.evidenceIds.length > 0 &&
          time.evidenceIds.every((id) => catalogs.evidence.has(id)),
        'unevidenced or invalid interval',
      );
      if (time.precision === 'year')
        requireValue(
          Number.isInteger(time.start) && Number.isInteger(time.end),
          'year precision interval',
        );
    }
    if (time.kind === 'snapshot')
      requireValue(
        data.snapshots.some(
          (snapshot) => snapshot.year === time.year && snapshot.file === state.file,
        ),
        'snapshot/state time or file mismatch',
      );
    const d = state.disposition;
    requireValue(
      d &&
        text(d.reviewer) &&
        text(d.reason) &&
        Array.isArray(d.conflicts) &&
        d.conflicts.length === 0 &&
        ['legacy-published', 'approved-reference', 'approved-boundary'].includes(d.status),
      'unapproved or conflicted state',
    );
    if (d.status === 'legacy-published')
      requireValue(
        time.kind === 'snapshot' && ['source-snapshot', 'official-source'].includes(state.review),
        'legacy eligibility',
      );
    if (state.review === 'reviewed-boundary' || state.representation === 'effective-control')
      requireValue(
        d.status === 'approved-boundary' && state.evidenceIds.length > 0,
        'reviewed boundary or control needs evidence and approval',
      );
    if (d.status === 'approved-boundary')
      requireValue(
        state.review === 'reviewed-boundary' && state.evidenceIds.length > 0,
        'boundary approval needs reviewed evidence',
      );
    if (d.status === 'approved-reference')
      requireValue(
        state.review !== 'reviewed-boundary' && state.evidenceIds.length > 0,
        'reference approval needs evidence',
      );
  }
  for (const snapshot of data.snapshots)
    requireValue(
      data.states.some(
        (state) =>
          state.time.kind === 'snapshot' &&
          state.time.year === snapshot.year &&
          state.file === snapshot.file,
      ),
      'snapshot has no boundary states',
    );
  for (const event of data.events) {
    requireValue(
      text(event.name) &&
        ['year', 'day'].includes(event.precision) &&
        text(event.kind) &&
        Array.isArray(event.polityIds) &&
        event.polityIds.every((id) => catalogs.polities.has(id)) &&
        Array.isArray(event.evidenceIds) &&
        event.evidenceIds.length > 0 &&
        event.evidenceIds.every((id) => catalogs.evidence.has(id)),
      'event evidence',
    );
    requireValue(
      Number.isInteger(event.date?.year) &&
        event.date.year >= data.range[0] &&
        event.date.year <= data.range[1],
      'event date range',
    );
    if (event.precision === 'day')
      requireValue(
        Number.isInteger(event.date.month) &&
          Number.isInteger(event.date.day) &&
          new Date(Date.UTC(event.date.year, event.date.month - 1, event.date.day))
            .toISOString()
            .slice(0, 10) ===
            `${event.date.year}-${String(event.date.month).padStart(2, '0')}-${String(event.date.day).padStart(2, '0')}`,
        'invalid calendar date',
      );
    for (const key of ['beforeStateIds', 'afterStateIds'])
      requireValue(
        Array.isArray(event[key]) && event[key].every((id) => catalogs.states.has(id)),
        'event state join',
      );
  }
  return data;
}
export function validateStateGeometry(data, states) {
  validateGeometry(data, { territories: true });
  return selectStateGeometry(data, states);
}
export function selectStateGeometry(data, states) {
  return states.map((state) => {
    const feature = data.features.find((f) => f.properties.id === state.featureId);
    requireValue(
      feature &&
        feature.properties.id === state.polityId &&
        state.sourceIds.includes(feature.properties.sourceId) &&
        feature.properties.review === state.review,
      'geometry/state metadata mismatch',
    );
    return feature;
  });
}
