import { defineConfig, devices } from '@playwright/test';
const remote = process.env.SITE_URL;
const port = Number(process.env.PLAYWRIGHT_PORT || 5187);
const base = process.env.APP_BASE_PATH || '/world-borders/';
export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  retries: 0,
  timeout: 60000,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['line'], ['html', { open: 'never' }]],
  use: {
    baseURL: remote || `http://127.0.0.1:${port}${base}`,
    viewport: { width: 1440, height: 950 },
    actionTimeout: 8000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 950 },
        launchOptions: { args: ['--enable-unsafe-swiftshader'] },
      },
    },
    ...(process.env.CROSS_BROWSER
      ? [
          {
            name: 'firefox',
            use: {
              ...devices['Desktop Firefox'],
              viewport: { width: 1440, height: 950 },
              headless: !process.env.CI,
              launchOptions: {
                firefoxUserPrefs: { 'webgl.force-enabled': true, 'gfx.webrender.software': true },
              },
            },
          },
        ]
      : []),
  ],
  webServer: remote
    ? undefined
    : {
        command: `npm run preview -- --port ${port} --strictPort`,
        url: `http://127.0.0.1:${port}${base}`,
        reuseExistingServer: false,
      },
});
