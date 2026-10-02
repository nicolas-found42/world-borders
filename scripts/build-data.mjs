import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { union } from '@turf/union';
import { featureCollection } from '@turf/helpers';

// Source files are cached verbatim. The published bundle contains only the
// pilot regions and records the exact input hashes in its manifest.
await mkdir('.data-cache', { recursive: true });
await mkdir('public/data', { recursive: true });
const historicalRoot = 'https://raw.githubusercontent.com/aourednik/historical-basemaps/master';
const canadaRoot = 'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/territorial_evolution_en/MapServer/8';
async function cached(name, url) {
  let raw;
  try { raw = await readFile(`.data-cache/${name}`, 'utf8'); }
  catch {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status}: ${url}`);
    raw = await response.text();
    await writeFile(`.data-cache/${name}`, raw);
  }
  return { data: JSON.parse(raw), hash: createHash('sha256').update(raw).digest('hex'), url };
}

const snapshots = [];
// Earlier candidates and 1900 failed ownership checks against primary sources.
// Small coverage is preferable to knowingly displaying an incorrect state.
const years = [1880, 1938, 1960, 2010];
for (const year of [1783, 1800, 1815, 1900]) await rm(`public/data/snapshot-${year}.geojson`, { force: true });
const corrections = {};
function polygons(geometry) { return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates; }
function withinPilot(rings) {
  const outer = rings[0];
  const longitude = outer.reduce((sum, p) => sum + p[0], 0) / outer.length;
  const latitude = outer.reduce((sum, p) => sum + p[1], 0) / outer.length;
  return longitude >= -180 && longitude <= -48 && latitude >= 14 && latitude <= 86;
}
function identity(name) {
  if (/^(United States of America|United States|USA)$/.test(name)) return { id: 'usa', name: 'United States', color: '#dda775' };
  if (name === 'Canada') return { id: 'canada', name: 'Canada', color: '#8db9c6' };
  if (name === 'Mexico') return { id: 'mexico', name: 'Mexico', color: '#90bca2' };
  if (/Hawaii/.test(name)) return { id: 'hawaii', name: 'Hawaiian Kingdom', color: '#c1a1d9' };
  if (/New Spain/.test(name)) return { id: 'new-spain', name: 'New Spain', color: '#90bca2' };
  if (/Newfoundland/.test(name)) return { id: 'newfoundland', name: 'Newfoundland', color: '#c1a1d9' };
  if (/Russian/.test(name)) return { id: 'russian-america', name: 'Russian America', color: '#b7a1b9' };
  if (/British|Quebec|Rupert|Hudson|New Brunswick|Nova Scotia|Upper Canada|Lower Canada/.test(name)) return { id: 'british-america', name: 'British North America', color: '#8a9dbc' };
  return { id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, color: '#aaa68b' };
}
for (const year of years) {
  const source = await cached(`world-${year}.geojson`, `${historicalRoot}/geojson/world_${year}.geojson`);
  const grouped = new Map();
  for (const feature of source.data.features) {
    const selected = polygons(feature.geometry).filter(withinPilot);
    if (!selected.length) continue;
    const name = feature.properties.NAME?.trim();
    if (year >= 1867 && /Russian/.test(name)) continue;
    if (!name || /Virgin Islands|Puerto Rico|Cuba|Haiti|Jamaica|Guatemala|Honduras|Salvador|Nicaragua|Costa Rica|Belize|Bahamas|Dominican|Santo Domingo|Greenland|Iceland|Saint|St\.|Bermuda|Aztec|Tribes|Comanche|Apache|Sioux|Iroquois|Cree|Ojibwe|Navajo|Pueblo|Cherokee|Indian|Native|Danish/.test(name)) continue;
    // A small mainland pilot, not a claimed complete atlas of all polities.
    const pilotNames = /United States|USA|Canada|Mexico|Hawaii|New Spain|Russian|British|Quebec|Rupert|Hudson|Newfoundland|New Brunswick|Nova Scotia|Louisiana|Florida|Oregon|Upper Canada|Lower Canada/;
    if (!pilotNames.test(name)) continue;
    let polity = identity(name);
    if (year >= 1900 && /Hawaii/.test(name)) polity = identity('United States of America');
    const item = grouped.get(polity.id) ?? {
      type: 'Feature', properties: { ...polity, sourceId: 'historical-basemaps', precision: 'generalized',
        representation: year < 1880 ? 'Historical territorial claims; effective control not established' : 'Source political boundary snapshot; local disputes not fully mapped',
        review: 'source-snapshot', upstreamNames: [] }, geometry: { type: 'MultiPolygon', coordinates: [] },
    };
    item.properties.upstreamNames.push(name);
    item.geometry.coordinates.push(...selected);
    grouped.set(polity.id, item);
  }
  const inputs = [{ url: source.url, sha256: source.hash }];
  if (year === 1880) {
    const url = `${canadaRoot}/query?where=START_TIME%3D1880&outFields=PROV_NAME,START_TIME,Period_Group&outSR=4326&maxAllowableOffset=0.03&f=geojson`;
    const official = await cached('canada-1880.geojson', url);
    const groups = new Map();
    for (const f of official.data.features) {
      const key = f.properties.Period_Group.startsWith('Canada') ? 'canada' : 'newfoundland';
      const list = groups.get(key) ?? []; list.push(f); groups.set(key, list);
    }
    for (const [key, features] of groups) {
      const merged = features.length === 1 ? features[0] : union(featureCollection(features));
      if (!merged) throw new Error(`Failed to dissolve ${key}`);
      const p = identity(key === 'canada' ? 'Canada' : 'Newfoundland');
      grouped.set(key, { ...merged, properties: { ...p, sourceId: 'nrcan', precision: 'generalized',
        representation: 'Official 1880 territorial evolution snapshot', review: 'official-source', upstreamNames: features.map(f => f.properties.PROV_NAME) } });
    }
    inputs.push({ url: official.url, sha256: official.hash });
  }
  const features = [...grouped.values()];
  if (!features.some(f => f.properties.id === 'usa')) throw new Error(`United States absent at ${year}`);
  const file = `snapshot-${year}.geojson`;
  await writeFile(`public/data/${file}`, JSON.stringify({ type: 'FeatureCollection', features }));
  snapshots.push({ year, file, corrections: corrections[year] ?? [], inputs, coverage: 'snapshot-year-only' });
  console.log(`${year}: ${features.map(f => f.properties.name).join(', ')}`);
}
const land = await cached('land.geojson', 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson');
await writeFile('public/data/land.geojson', JSON.stringify(land.data));
const sources = [
  { id: 'historical-basemaps', name: 'Historical Basemaps', author: 'André Ourednik and contributors', license: 'GPL-3.0', url: 'https://github.com/aourednik/historical-basemaps', note: 'World-scale source snapshots. Geometry is generalized; precise local boundaries and effective control have not been independently verified.' },
  { id: 'nrcan', name: 'Territorial Evolution of Canada', author: 'Natural Resources Canada', license: 'Open Government Licence – Canada', url: 'https://open.canada.ca/data/dataset/e88ce995-b69a-4595-a752-bb06b061b5a3', note: '1880 Canadian and Newfoundland polygons from the official service. Provincial divisions dissolved; service simplifies geometry at 0.03 degrees.' },
  { id: 'natural-earth', name: 'Natural Earth', author: 'Natural Earth contributors', license: 'Public domain', url: 'https://www.naturalearthdata.com/about/terms-of-use/', note: 'Modern physical land context only. Neutral land carries no historical sovereignty assignment.' },
  { id: 'hawaii-check', name: 'Hawaiian annexation resolution (1898)', author: 'US National Archives', license: 'US government document', url: 'https://www.archives.gov/milestone-documents/joint-resolution-for-annexing-the-hawaiian-islands', note: 'Independent check that Hawaiian islands are outside the US in 1880 and within it in 1938. Not a source for island geometry.' },
  { id: 'newfoundland-check', name: 'Newfoundland’s entry into Confederation (1949)', author: 'Parks Canada', license: 'Linked reference only', url: 'https://parks.canada.ca/culture/designation/evenement-event/terre-neuve-confederation-newfoundland', note: 'Independent check that Newfoundland is separate from Canada in 1880 and 1938, and part of Canada in 1960 and 2010.' },
];
await writeFile('public/data/manifest.json', JSON.stringify({ schemaVersion: 1, range: [1776, 2026], snapshots, sources, landInput: { url: land.url, sha256: land.hash }, excludedSnapshots: [
  { years: [1783, 1800, 1815], reason: 'Containment checks put Jacksonville, Florida within the United States before the 1821 transfer. No repaired historical geometry available.', evidence: 'https://history.state.gov/milestones/1801-1829/florida' },
  { years: [1815, 1900], reason: 'Containment checks put Newfoundland within Canada before its 1949 entry. No verified same-year replacement available.', evidence: 'https://parks.canada.ca/culture/designation/evenement-event/terre-neuve-confederation-newfoundland' },
], limitations: [
  'Four snapshot years, not continuous historical coverage. Other years deliberately have no territorial polygons.',
  'Only the 1880 Canada/Newfoundland geometry is drawn from a government historical polygon service. Other historical shapes are generalized source references, not fully vetted boundaries.',
  'Early colonial claims are not effective control. Indigenous territories are not yet mapped; neutral areas do not imply uninhabited or unclaimed land.',
  'A complete disputed-boundary layer is not yet available. No disputed areas are invented.',
  'Nearby island and predecessor coverage is incomplete. Overseas dependencies are outside this pilot.',
] }, null, 2));
