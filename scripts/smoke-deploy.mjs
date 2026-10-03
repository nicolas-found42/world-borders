import { verifyAssetDigest } from '../src/asset-loader.mjs';
import {
  validateManifest,
  validateGeometry,
  validateStateGeometry,
} from '../src/boundary-contract.mjs';
import { resolveCoverage } from '../src/coverage.mjs';
const [site, expectedCommit] = process.argv.slice(2);
if (!site || !/^[a-f0-9]{40}$/.test(expectedCommit || ''))
  throw new Error('Usage: smoke-deploy <site-url/> <commit-sha>');
const base = new URL(site.endsWith('/') ? site : `${site}/`);
let lastError = new Error('Deployment smoke deadline exceeded');
const deadline = Date.now() + 5 * 60 * 1000;
for (let attempt = 0; attempt < 24 && Date.now() < deadline; attempt++) {
  try {
    const get = async (path) => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error('Deployment smoke deadline exceeded');
      const response = await fetch(new URL(path, base), {
        cache: 'no-store',
        signal: AbortSignal.timeout(Math.min(15000, remaining)),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.url}`);
      return response.json();
    };
    const info = await get(`build-info.json?revision=${expectedCommit}`);
    if (info.commit !== expectedCommit)
      throw new Error(`Expected ${expectedCommit}, received ${info.commit}`);
    const manifest = validateManifest(await get('data/manifest.json'));
    const land = validateGeometry(await get('data/land.geojson'));
    await verifyAssetDigest(manifest, 'land.geojson', land);
    for (const file of new Set(manifest.states.map((state) => state.file))) {
      const data = await get(`data/${file}`);
      validateStateGeometry(
        data,
        manifest.states.filter((state) => state.file === file),
      );
      await verifyAssetDigest(manifest, file, data);
    }
    if (resolveCoverage(manifest, { time: 1776 }).status !== 'gap')
      throw new Error('1776 coverage must remain a gap');
    const canada = resolveCoverage(manifest, { time: 1949 });
    if (
      canada.status !== 'partial' ||
      canada.states.length !== 1 ||
      canada.states[0].id !== 'canada-1949' ||
      resolveCoverage(manifest, { time: 1949, precision: 'day' }).status !== 'gap'
    )
      throw new Error('Canada1949 precision/coverage acceptance failed');
    if (
      !manifest.events.some(
        (event) =>
          event.id === 'newfoundland-union-1949' &&
          event.date.year === 1949 &&
          event.date.month === 3 &&
          event.date.day === 31,
      )
    )
      throw new Error('Union event evidence missing');
    console.log(
      `Verified ${base.href}: ${expectedCommit} and ${manifest.snapshots.length} snapshots`,
    );
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.warn(`Attempt ${attempt + 1}: ${error.message}`);
    if (Date.now() < deadline)
      await new Promise((resolve) => setTimeout(resolve, Math.min(5000, deadline - Date.now())));
  }
}
throw lastError;
