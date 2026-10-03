import { parseArgs } from 'node:util';
import { buildBundle } from './build-data-bundle.mjs';
import { stagedDataBuild } from './staged-data-build.mjs';
const { values } = parseArgs({
  options: {
    refresh: { type: 'boolean', default: false },
    'cache-dir': { type: 'string', default: '.data-cache' },
    'output-dir': { type: 'string', default: 'public/data' },
  },
});
await stagedDataBuild(values['cache-dir'], values['output-dir'], (cacheDir, outputDir) =>
  buildBundle({ cacheDir, outputDir, refresh: values.refresh }),
);
