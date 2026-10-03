import { execFileSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const base = process.env.APP_BASE_PATH || '/world-borders/';
let commit = process.env.GITHUB_SHA;
if (!commit) {
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    commit = 'unknown'; // Source archives still work; production smoke requires an exact SHA.
  }
}
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
