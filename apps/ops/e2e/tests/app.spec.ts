import { expect, open, test } from './helpers.ts'

// The installed app (decision 0043). The service worker runs only in the built site, not under these tests;
// its file list is tested in web/src/lib/serviceWorker.test.ts.

test('the site can be installed as an app: a manifest with its name and icons', async ({ page, world: _ }) => {
  await open(page, 'dashboard')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(href).toBe('/manifest.webmanifest')
  const manifest = await (await page.request.get(href!)).json()
  expect(manifest).toMatchObject({ name: 'FNC Landing', start_url: '/', display: 'standalone' })
  expect(manifest.icons.map((i: { purpose: string }) => i.purpose)).toEqual(['any', 'any', 'maskable'])
  for (const icon of [...manifest.icons.map((i: { src: string }) => i.src), '/apple-touch-icon.png']) {
    expect((await page.request.get(icon)).headers()['content-type']).toBe('image/png')
  }
})

test('with no signal the app says so, and the notice goes when the signal is back', async ({ page, world: _ }) => {
  await open(page, 'dashboard')
  const notice = page.getByText('No signal. The figures need the network')
  await expect(notice).toHaveCount(0)
  await page.context().setOffline(true)
  await expect(notice).toBeVisible()
  await page.context().setOffline(false)
  await expect(notice).toHaveCount(0)
})
