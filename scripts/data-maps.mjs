import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
const [before, after, output = 'artifacts/data-review'] = process.argv.slice(2);
if (!before || !after) throw new Error('Usage: data-maps BEFORE AFTER [OUTPUT]');
const manifests = await Promise.all(
  [before, after].map(async (dir) =>
    JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8')),
  ),
);
const years = [...new Set(manifests.flatMap((m) => m.snapshots.map((s) => s.year)))].sort();
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '5188',
    '--strictPort',
  ],
  { stdio: 'inherit' },
);
const url = 'http://127.0.0.1:5188/world-borders/';
let browser;
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    if (server.exitCode !== null) throw new Error('Preview server exited');
    try {
      if ((await fetch(url)).ok) {
        ready = true;
        break;
      }
    } catch {
      /* startup */
    }
    await delay(250);
  }
  if (!ready) throw new Error('Preview server unavailable');
  await mkdir(output, { recursive: true });
  browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  for (const [label, directory] of [
    ['before', before],
    ['after', after],
  ]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 950 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/data/*', (route) =>
      route.fulfill({
        path: join(directory, basename(new URL(route.request().url()).pathname)),
        contentType: 'application/json',
      }),
    );
    await page.goto(url);
    await expect(page.getByRole('button', { name: 'Play timeline', exact: true })).toBeEnabled();
    for (const year of years) {
      const input = page.getByRole('spinbutton', { name: 'Jump to year' });
      await input.fill(String(year));
      await input.press('Enter');
      await page.waitForFunction(
        (y) => document.querySelector('.app')?.getAttribute('data-year') === String(y),
        year,
      );
      await page.waitForTimeout(1500); // Complete the initial camera tween and GPU draw.
      await page.screenshot({ path: join(output, `${label}-${year}.png`) });
    }
    if (errors.length) throw new Error(errors.join('\n'));
    await context.close();
  }
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Source refresh maps</title><style>body{font:16px system-ui;background:#101820;color:white;margin:24px}section{display:grid;grid-template-columns:1fr 1fr;gap:12px}img{width:100%}h2{margin-top:40px}</style><h1>Before / after source refresh</h1><p>Same application revision, camera and 1440 × 950 viewport. Only served data changes. Inspect evidence.json for provenance and exclusions. These captures do not establish historical accuracy.</p>${years.map((year) => `<h2>${year}</h2><section>${['before', 'after'].map((label) => `<figure><figcaption>${label}</figcaption><img alt="${label} ${year}" src="${label}-${year}.png"></figure>`).join('')}</section>`).join('')}</html>`;
  await writeFile(join(output, 'maps.html'), html);
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
