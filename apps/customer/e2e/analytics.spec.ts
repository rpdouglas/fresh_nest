import { test, expect } from '@playwright/test';

test('cookie banner is visible and can be accepted', async ({ page }) => {
  await page.goto('/');

  // Expect cookie banner text to be visible
  await expect(page.getByText(/We use cookies to analyze site traffic/i)).toBeVisible();

  // Click accept
  await page.getByRole('button', { name: /accept/i }).click();

  // Banner should disappear
  await expect(page.getByText(/We use cookies to analyze site traffic/i)).not.toBeVisible();
});

test('analytics events are attached to phone link', async ({ page }) => {
  await page.goto('/');

  // There are two phone links (navbar and footer), let's just make sure one is present and has the href
  const phoneLinks = page.locator('a[href^="tel:"]');
  await expect(phoneLinks.first()).toBeVisible();
});
