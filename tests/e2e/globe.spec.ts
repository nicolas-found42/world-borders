import { test as base, expect } from '@playwright/test';

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('response', (response) => {
        if (response.status() >= 400 && response.url().startsWith(new URL(page.url()).origin))
          errors.push(`${response.status()} ${response.url()}`);
      });
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});
test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Play timeline', exact: true })).toBeEnabled();
});

test('@smoke prefixed app loads all snapshots, assets and build revision', async ({
  page,
  request,
  baseURL,
}) => {
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('link', { name: 'World Borders home' })).toHaveAttribute(
    'href',
    new URL(baseURL!).pathname,
  );
  for (const year of [1880, 1938, 1960, 2010]) {
    await page.getByRole('button', { name: `View ${year} snapshot`, exact: true }).click();
    await expect(page.locator('.app')).toHaveAttribute('data-year', String(year));
    await expect(page.locator('.app')).toHaveAttribute('data-loaded-year', String(year));
    await expect(page.locator('.territory-legend')).toContainText('United States');
  }
  const info = await request.get(new URL('build-info.json', baseURL).href);
  expect(info.ok()).toBe(true);
  expect((await info.json()).commit).toMatch(/^[a-f0-9]{40}$/);
  const icon = await page.locator('link[rel="icon"]').getAttribute('href');
  expect((await request.get(new URL(icon!, page.url()).href)).ok()).toBe(true);
});

test('camera orbit, zoom and reset respond independently', async ({ page }) => {
  const globe = page.locator('.globe-canvas');
  await page.waitForTimeout(1100); // Wait for the initial camera tween.
  const before = await globe.getAttribute('data-camera-lng');
  await page.mouse.move(780, 380);
  await page.mouse.down();
  await page.mouse.move(930, 420, { steps: 12 });
  await page.mouse.up();
  await expect.poll(() => globe.getAttribute('data-camera-lng')).not.toEqual(before);
  await page.waitForTimeout(500);
  const altitude = Number(await globe.getAttribute('data-camera-altitude'));
  await page.mouse.wheel(0, -200);
  await expect
    .poll(async () => Number(await globe.getAttribute('data-camera-altitude')))
    .toBeLessThan(altitude);
  await page.getByRole('button', { name: 'Reset North America view' }).click();
  await expect
    .poll(async () => Math.abs(Number(await globe.getAttribute('data-camera-lng')) + 103))
    .toBeLessThan(1);
});

test('playback preserves camera; timeline scroll pauses playback', async ({ page }) => {
  await page.waitForTimeout(1100);
  const camera = await page.locator('.globe-canvas').getAttribute('data-camera-lng');
  await page.getByRole('combobox', { name: 'Playback speed' }).selectOption('12');
  await page.getByRole('button', { name: 'Play timeline', exact: true }).click();
  await expect.poll(() => page.locator('.app').getAttribute('data-year')).not.toEqual('1880');
  expect(Number(await page.locator('.globe-canvas').getAttribute('data-camera-lng'))).toBeCloseTo(
    Number(camera),
    2,
  );
  const box = await page.locator('.timeline').boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + 15);
  await page.mouse.wheel(0, 100);
  await expect(page.getByRole('button', { name: 'Play timeline', exact: true })).toBeVisible();
  const year = await page.locator('.app').getAttribute('data-year');
  await page.waitForTimeout(250);
  expect(await page.locator('.app').getAttribute('data-year')).toEqual(year);
});

test('unsupported dates stay empty and snapshot navigation restores data', async ({ page }) => {
  const jump = page.getByRole('spinbutton', { name: 'Jump to year' });
  await jump.fill('1776');
  await jump.press('Enter');
  await expect(page.locator('.coverage-status')).toContainText('No snapshot');
  await expect(page.locator('.territory-legend')).toHaveCount(0);
  await page.getByRole('button', { name: 'Next snapshot', exact: true }).click();
  await expect(page.locator('.app')).toHaveAttribute('data-year', '1880');
  await expect(page.locator('.territory-legend')).toContainText('Newfoundland');
  await page.getByRole('button', { name: 'View 1938 snapshot', exact: true }).click();
  await expect(page.locator('.territory-legend')).not.toContainText('Hawaiian Kingdom');
});

test('sources and layer controls work with keyboard dismissal', async ({ page }) => {
  await page.getByRole('button', { name: 'Sources & coverage', exact: true }).click();
  await expect(page.locator('dialog')).toContainText('Newfoundland’s entry into Confederation');
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).toHaveJSProperty('open', false);
  await page.getByRole('button', { name: 'Open layer controls' }).click();
  await page.getByRole('switch', { name: 'Territorial borders' }).click();
  await expect(page.getByRole('switch', { name: 'Territorial borders' })).toHaveAttribute(
    'aria-checked',
    'false',
  );
});

test('mobile controls remain visible without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  await expect(page.getByRole('button', { name: 'Play timeline', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sources & coverage', exact: true }).click();
  await expect(page.locator('dialog')).toHaveJSProperty('open', true);
  await page.getByRole('button', { name: 'Close panel' }).click();
});

test('a delayed snapshot remains unready until its boundaries arrive', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/data/snapshot-1938.geojson', async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.reload();
    await expect(page.getByRole('button', { name: 'Play timeline', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'View 1938 snapshot', exact: true }).click();
    await expect(page.locator('.app')).toHaveAttribute('data-loading', 'true');
    await expect(page.locator('.app')).toHaveAttribute('data-loaded-year', '');
    await expect(page.locator('.territory-legend')).toHaveCount(0);
    release();
    await expect(page.locator('.app')).toHaveAttribute('data-loaded-year', '1938');
    await expect(page.locator('.territory-legend')).toContainText('United States');
    await expect(page.locator('.app')).toHaveAttribute('data-error', '');
  } finally {
    release();
  }
});
