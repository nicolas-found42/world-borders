import { execFileSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const base = process.env.APP_BASE_PATH || '/world-borders/';
const commit =
  process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
export default defineConfig({
  base,
  plugins: [
    react(),
    {
      name: 'build-revision',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'build-info.json',
          source: JSON.stringify({ commit, base }),
        });
      },
    },
  ],
});
