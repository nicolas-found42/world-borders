import {
  validateManifest,
  validateGeometry,
  validateStateGeometry,
  selectStateGeometry,
} from './boundary-contract.mjs';
async function jsonDigest(data) {
  if (!globalThis.crypto?.subtle) throw new Error('Integrity checks require HTTPS or localhost.');
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  const hex = [...new Uint8Array(digest)].map((n) => n.toString(16).padStart(2, '0')).join('');
  return hex;
}
export async function verifyAssetDigest(manifest, file, data) {
  if (manifest.assetDigests?.[file] !== (await jsonDigest(data)))
    throw new Error(`Invalid boundary data: asset digest mismatch for ${file}`);
}
export async function verifyManifestRevision(manifest) {
  const content = { ...manifest };
  delete content.revision;
  if (manifest.revision !== (await jsonDigest(content)))
    throw new Error('Invalid boundary data: manifest revision mismatch');
}
function freezeAsset(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const item of Object.values(value)) freezeAsset(item);
    Object.freeze(value);
  }
  return value;
}
const checkAbort = (signal) => {
  if (signal?.aborted) throw new DOMException('Obsolete asset request', 'AbortError');
};
export function createAssetLoader({ fetcher = globalThis.fetch, urlFor = (path) => path } = {}) {
  const cache = new Map();
  async function json(path, signal) {
    checkAbort(signal);
    const response = await fetcher(urlFor(path), { signal, cache: 'no-cache' });
    if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
    const data = await response.json();
    checkAbort(signal);
    return data;
  }
  return {
    async boot(signal) {
      const [manifest, land] = await Promise.all([
        json('data/manifest.json', signal),
        json('data/land.geojson', signal),
      ]);
      checkAbort(signal);
      validateManifest(manifest);
      await verifyManifestRevision(manifest);
      validateGeometry(land);
      await verifyAssetDigest(manifest, 'land.geojson', land);
      checkAbort(signal);
      return { manifest, land: land.features };
    },
    async loadStates(manifest, states, signal) {
      const files = [...new Set(states.map((s) => s.file))];
      const results = await Promise.all(
        files.map(async (file) => {
          const key = `${manifest.revision}:${file}`;
          let entry = cache.get(key);
          if (!entry) {
            const data = await json(`data/${file}`, signal);
            validateStateGeometry(
              data,
              manifest.states.filter((s) => s.file === file),
            );
            await verifyAssetDigest(manifest, file, data);
            checkAbort(signal);
            entry = { data: freezeAsset(data), digest: manifest.assetDigests[file] };
            cache.set(key, entry);
          }
          if (entry.digest !== manifest.assetDigests[file])
            throw new Error(`Invalid boundary data: asset digest mismatch for ${file}`);
          checkAbort(signal);
          return selectStateGeometry(
            entry.data,
            states.filter((s) => s.file === file),
          );
        }),
      );
      checkAbort(signal);
      return results.flat();
    },
  };
}
