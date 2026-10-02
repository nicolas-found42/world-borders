import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', workers: 1, retries: 0, timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:5187', viewport: { width: 1440, height: 950 }, actionTimeout: 8000,
    launchOptions: { args: ['--enable-unsafe-swiftshader'] }, trace: 'retain-on-failure' },
  webServer: { command: 'npm run preview -- --port 5187 --strictPort', url: 'http://127.0.0.1:5187', reuseExistingServer: false },
});
