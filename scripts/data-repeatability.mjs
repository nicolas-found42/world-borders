import assert from 'node:assert/strict';
import { describeBundle } from './data-report.mjs';
const [first, replay] = process.argv.slice(2);
assert.deepEqual(
  await describeBundle(first),
  await describeBundle(replay),
  'Cached replay must reproduce every output byte',
);
console.log('Cached replay reproduced every output byte and provenance field.');
