import { validateManifest, validateGeometry, validateStateGeometry } from './boundary-contract.mjs';
const checkAbort = (signal) => {
  if (signal?.aborted) throw new DOMException('Obsolete asset request', 'AbortError');
};
export function createAssetLoader({ fetcher = globalThis.fetch, urlFor = (path) => path } = {}) {
  const cache = new Map();
  async function json(path, signal) {
    checkAbort(signal);
    const response = await fetcher(urlFor(path), { signal });
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
      return { manifest: validateManifest(manifest), land: validateGeometry(land).features };
    },
    async loadStates(manifest, states, signal) {
      const files = [...new Set(states.map((s) => s.file))];
      const results = await Promise.all(
        files.map(async (file) => {
          const key = `${manifest.revision}:${file}`;
          let data = cache.get(key);
          if (!data) {
            data = validateGeometry(await json(`data/${file}`, signal), { territories: true });
            checkAbort(signal);
            // Check all declared states in the asset before accepting it into this revision's cache.
            validateStateGeometry(
              data,
              manifest.states.filter((s) => s.file === file),
            );
            cache.set(key, data);
          }
          checkAbort(signal);
          return validateStateGeometry(
            data,
            states.filter((s) => s.file === file),
          );
        }),
      );
      checkAbort(signal);
      return results.flat();
    },
  };
}
