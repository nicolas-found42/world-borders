import { test, expect } from '@playwright/test';

test('deliberately fail to verify protected main and downloadable diagnostics', async ({
  page,
}) => {
  await page.goto('./');
  await expect(page).toHaveTitle('Intentional merge-gate probe — never merge');
});
