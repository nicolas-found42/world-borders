import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

export async function fetchSource(name, url, { directory, refresh = false }) {
  if (!/^[\w.-]+$/.test(name)) throw new Error('Invalid cache file name');
  const path = join(directory, name);
  let raw;
  if (!refresh) {
    try {
      raw = await readFile(path, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  if (raw === undefined) {
    const response = await fetch(url, { signal: AbortSignal.timeout(60000), cache: 'no-store' });
    if (!response.ok) throw new Error(`${response.status}: ${url}`);
    raw = await response.text();
    // Validate before replacing a known-good cached response.
    validate(raw);
    await mkdir(directory, { recursive: true });
    const temporary = `${path}.${process.pid}.tmp`;
    await writeFile(temporary, raw);
    await rename(temporary, path);
  }
  const data = validate(raw);
  return { data, hash: createHash('sha256').update(raw).digest('hex'), url };
}
function validate(raw) {
  const data = JSON.parse(raw);
  if (data.type !== 'FeatureCollection' || !Array.isArray(data.features) || !data.features.length)
    throw new Error('Source must be a nonempty GeoJSON FeatureCollection');
  return data;
}
