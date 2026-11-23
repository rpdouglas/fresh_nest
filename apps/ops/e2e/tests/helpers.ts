import { AsyncLocalStorage } from 'node:async_hooks'
import { type Page, expect, test as base } from '@playwright/test'

/** A 1x1 transparent PNG, standing in for OpenStreetMap's map images. */
const BLANK_TILE = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')

const API = 'http://localhost:8787'

export const workerStorage = new AsyncLocalStorage<string>()

const getWorkerId = (): string | undefined => {
  try {
    const info = test.info()
    if (info && typeof info.parallelIndex === 'number') {
      return String(info.parallelIndex)
    }
  } catch {}
  return workerStorage.getStore()
}

// Transparently tag all test runner fetch calls to localhost:8787 with the active worker's id (decision 0039)
const originalFetch = globalThis.fetch
globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  if (url.includes('localhost:8787') || url.includes('127.0.0.1:8787')) {
    const workerId = getWorkerId()
    if (workerId !== undefined) {
      const headers = new Headers(init?.headers)
      if (!headers.has('x-test-worker')) {
        headers.set('x-test-worker', workerId)
      }
      return originalFetch(input, { ...init, headers })
    }
  }
  return originalFetch(input, init)
}

export interface World {
  /** Today in Toronto, YYYY-MM-DD. */
  today: string
  /** The day the schedule's problems are planted on. */
  special: string
  /** The days whose timesheets are still waiting for approval. */
  waitingDays: string[]
}

/** What a test file can ask for with `test.use({ ... })`. */
export interface Options {
  /**
   * The day the test runs on, YYYY-MM-DD: the made-up world is laid out around it, and the server's and the
   * browser's clocks say noon in Toronto that day. Not set: the real date, as the site is really used. Set it
   * only for a test about a rule that turns on the date.
   */
  today: string | undefined
  /** How many days of history the made-up world holds (24 unless set). */
  daysBack: number | undefined
  /**
   * Who the test signs in as. Not set: someone from the office, who lands on the Dashboard. A made-up cleaner's
   * address (`avery@example.com`): they land on My week, the only page they are shown.
   */
  signInAs: string | undefined
}

/** Tells the pretend Camelo to misbehave. */
export const camelo = {
  lagListFor: (reads: number) => fetch(`${API}/__test/lag`, { method: 'POST', body: JSON.stringify({ reads }) }),
  refuseNext: (requests: number) => fetch(`${API}/__test/refuse`, { method: 'POST', body: JSON.stringify({ requests }) }),
  log: async () => (await (await fetch(`${API}/__test/log`)).json()) as string[],
}

/** Makes the server refuse every sign-in as one that has run out (false), or accept them again (true). */
export const signIns = (accepted: boolean) => fetch(`${API}/__test/signins`, { method: 'POST', body: JSON.stringify({ accepted }) })

/** Sets the switch that lets cleaners in: "off" takes their access away, "*" gives it back. */
export const staffSwitch = (staff: string) => fetch(`${API}/__test/staff`, { method: 'POST', body: JSON.stringify({ staff }) })

/** How many requests of one kind the pretend Camelo has had: "rejectTimesheet", "updateTimesheet" and so on. */
export const asked = async (kind: string) => (await camelo.log()).filter((x) => x === kind).length

/** What stands in for Google's sign-in script: a button that does nothing, and a grant of access that is given or refused. */
const GOOGLE_STAND_IN = `
  window.google = { accounts: {
    id: { initialize() {}, renderButton() {}, prompt() {}, disableAutoSelect() {} },
    oauth2: { initTokenClient: (c) => ({ requestAccessToken: () => setTimeout(() => {
      const refuse = window.__refuseGoogleOnce; window.__refuseGoogleOnce = false
      c.callback(refuse ? { error: 'access_denied' } : { access_token: 'e2e-not-a-real-token', expires_in: 3600 })
    }) }) },
  } }`

/** What the pretend Google was asked for during a test. */
export interface Google {
  /** The documents created: each one's title and the text put in it. */
  docs: { title: string; text: string }[]
  /** Refuse the next request for access on the page as it is now, as someone who presses "Cancel" in Google's window does. */
  refuseAccess(): Promise<void>
  /** Answer the next request to Google Docs with this status. */
  failDocsWith(status: number): void
}

/** Every test starts from the same made-up world, signed in, and fails on an error in the page. */
export const test = base.extend<{ world: World; google: Google; workerSetup: void } & Options>({
  workerSetup: [
    async ({ context }, use, testInfo) => {
      const workerId = String(testInfo.parallelIndex)
      await context.setExtraHTTPHeaders({ 'x-test-worker': workerId })
      await workerStorage.run(workerId, async () => {
        await use()
      })
    },
    { auto: true },
  ],
  // Nothing in a test reaches the internet. Google's sign-in script and its Docs service are stood in for here,
  // and a request to anywhere else that is not this machine fails the test.
  google: [
    async ({ context, page }, use) => {
      const strays: string[] = []
      let failWith = 0
      const docs: Google['docs'] = []
      await context.route(
        (url) => !['localhost', '127.0.0.1'].includes(url.hostname),
        async (route) => {
          const request = route.request()
          const url = request.url()
          if (url.startsWith('https://accounts.google.com/gsi/client')) {
            return route.fulfill({ contentType: 'text/javascript', body: GOOGLE_STAND_IN })
          }
          if (url.startsWith('https://docs.googleapis.com/v1/documents')) {
            if (failWith) {
              const status = failWith
              failWith = 0
              return route.fulfill({ status, json: { error: { message: 'refused by the pretend Google' } } })
            }
            const sent = request.postDataJSON() as { title?: string; requests?: { insertText?: { text: string } }[] }
            if (!url.includes(':batchUpdate')) {
              docs.push({ title: sent.title ?? '', text: '' })
              return route.fulfill({ json: { documentId: `doc-${docs.length}` } })
            }
            docs[docs.length - 1].text = (sent.requests ?? []).map((r) => r.insertText?.text ?? '').join('')
            return route.fulfill({ json: {} })
          }
          // map images for Client patterns and routes (decision 0040): a blank tile, so nothing leaves
          if (url.startsWith('https://tile.openstreetmap.org/')) {
            return route.fulfill({ contentType: 'image/png', body: BLANK_TILE })
          }
          strays.push(url)
          return route.abort()
        },
      )
      await use({
        docs,
        refuseAccess: () => page.evaluate(() => void ((window as unknown as { __refuseGoogleOnce: boolean }).__refuseGoogleOnce = true)),
        failDocsWith: (status) => void (failWith = status),
      })
      expect(strays, 'requests that tried to leave this machine').toEqual([])
    },
    { auto: true },
  ],
  today: [undefined, { option: true }],
  daysBack: [undefined, { option: true }],
  signInAs: [undefined, { option: true }],
  world: async ({ page, today, daysBack, signInAs }, use) => {
    const reset = await fetch(`${API}/__test/reset`, { method: 'POST', body: JSON.stringify({ today, daysBack }) })
    const world = (await reset.json()) as World & { now: number | null }
    // the page's clock says the same moment as the server's; timers still run
    if (world.now !== null) await page.clock.setFixedTime(world.now)
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/')
    if (signInAs) await page.getByRole('textbox', { name: 'Dev sign-in email' }).fill(signInAs)
    await page.getByRole('button', { name: 'Dev sign-in' }).click()
    await expect(page.getByRole('heading', { name: signInAs ? 'My week' : 'Needs attention' })).toBeVisible()
    await use(world)
    expect(errors, 'errors thrown in the page').toEqual([])
  },
})

/** Opens a report, at a date when one is given, and waits for its data. */
export async function open(page: Page, view: string, at: { week?: string; period?: string; from?: string } = {}) {
  const q = new URLSearchParams({ view, ...at })
  await page.goto(`/?${q}`)
  await expect(page.getByRole('status')).toHaveCount(0, { timeout: 30_000 })
}

/** Where each report sits: its hub on the tab bar, its page's tab, and its choice on the page's switch (decision 0042). */
const PLACES: Record<string, [hub: string, tab: string, choice?: string]> = {
  Dashboard: ['Home', 'Dashboard'],
  'Live board': ['Home', 'Live board'],
  'Daily teams': ['Schedule', 'This week', 'Day & team'],
  'By staff': ['Schedule', 'This week', 'Cleaner'],
  'By client': ['Schedule', 'This week', 'Client'],
  'Unapproved timesheets': ['Hours & pay', 'Timesheets', 'To approve'],
  'Scheduled vs actual': ['Hours & pay', 'Timesheets', 'Scheduled vs actual'],
  'Payroll hours': ['Hours & pay', 'Payroll hours'],
  Punctuality: ['Hours & pay', 'Punctuality'],
  'Client hours': ['Billing', 'Client time', 'Hours'],
  Invoicing: ['Billing', 'Client time', 'To invoice'],
  'Client feedback': ['Clients', 'Feedback'],
}

/** Opens a report as a person would: its hub on the tab bar, its page's tab, then its choice on the switch. */
export async function openReport(page: Page, report: string, how: 'click' | 'tap' = 'click') {
  const [hub, tab, choice] = PLACES[report]
  await page.getByRole('navigation', { name: 'Hubs' }).getByRole('button', { name: hub })[how]()
  const tabs = page.getByRole('navigation', { name: `${hub} pages` })
  if (await tabs.count()) await tabs.getByRole('button', { name: tab, exact: true })[how]()
  if (choice) await page.getByRole('radio', { name: choice, exact: true })[how]()
}

export { expect }
export type { Page }
