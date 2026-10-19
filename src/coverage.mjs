const layerFor = (representation) =>
  ({
    'source-political': 'political',
    'legal-affiliation': 'political',
    'effective-control': 'control',
    'territorial-claim': 'claims',
    dispute: 'dispute',
  })[representation];
/**
 * @param {import('./types').Manifest} manifest
 * @param {import('./types').CoverageRequest} [request]
 * @returns {import('./types').CoverageResolution}
 */
export function resolveCoverage(
  manifest,
  {
    time,
    regions = ['north-america'],
    representation = 'all-supported',
    layers = ['political'],
    precision = 'year',
    revision = manifest.revision,
  } = {},
) {
  const empty = { states: [], missingRegions: regions, missingLayers: layers, conflicts: [] };
  if (revision !== manifest.revision || !Number.isFinite(time))
    return { ...empty, status: 'error', reason: 'Dataset revision or requested time is invalid' };
  const states = manifest.states.filter((state) => {
    if (
      !regions.some((region) => state.regions.includes(region)) ||
      (representation !== 'all-supported' && state.representation !== representation) ||
      !layers.includes(layerFor(state.representation))
    )
      return false;
    const validity = state.time;
    if (precision === 'day' && validity.precision !== 'day') return false;
    return validity.kind === 'snapshot'
      ? validity.year === Math.floor(time)
      : time >= validity.start && time < validity.end;
  });
  const conflicts = states
    .filter((state, index) =>
      states.some(
        (other, otherIndex) =>
          index !== otherIndex &&
          state.polityId === other.polityId &&
          state.regions.some((region) => other.regions.includes(region)),
      ),
    )
    .map((state) => state.id);
  if (conflicts.length)
    return {
      ...empty,
      status: 'error',
      conflicts,
      reason: 'Overlapping boundary assertions need curator resolution',
    };
  const components = [
    ...new Set(
      regions.flatMap((region) =>
        region === 'north-america'
          ? ['usa', 'canada-newfoundland', 'mexico', 'nearby-islands']
          : [region],
      ),
    ),
  ];
  const missingRegions = components.filter(
    (region) =>
      !states.some((state) => state.regions.includes(region) && state.coverage === 'covered'),
  );
  const missingLayers = layers.filter(
    (layer) => !states.some((state) => layerFor(state.representation) === layer),
  );
  return {
    states,
    status: !states.length
      ? 'gap'
      : missingRegions.length || missingLayers.length
        ? 'partial'
        : 'covered',
    missingRegions,
    missingLayers,
    conflicts,
  };
}
/** @param {import('./types').Manifest} manifest
 * @param {import('./types').CoverageRequest} [request]
 */
export function availableMoments(manifest, request = {}) {
  const moments = [
    ...new Set(
      manifest.states.map((state) =>
        state.time.kind === 'snapshot' ? state.time.year : state.time.start,
      ),
    ),
  ].sort((a, b) => a - b);
  return moments.filter(
    (time) => resolveCoverage(manifest, { ...request, time }).states.length > 0,
  );
}
/** @param {import('./types').Manifest} manifest
 * @param {number} time
 * @param {number} direction
 * @param {import('./types').CoverageRequest} [request]
 */
export function adjacentAvailableMoment(manifest, time, direction, request = {}) {
  const moments = availableMoments(manifest, request);
  const active = resolveCoverage(manifest, { ...request, time }).states.length > 0;
  const anchor = active ? (moments.filter((moment) => moment <= time).at(-1) ?? time) : time;
  return direction > 0
    ? (moments.find((moment) => moment > anchor) ?? null)
    : ([...moments].reverse().find((moment) => moment < anchor) ?? null);
}
