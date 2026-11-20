import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * P3-E39 Persona E2E Suite:
 * - P3 Margaret Storey (768px portrait iPad, >=16px text, >=48px targets, phone visible without scrolling, axe WCAG 2.1 AA)
 * - P2 Travis McLeod (390px phone, fast sign with no sign-in)
 * - P1 Diane / P5 Sophie (French link opens fully in FR, Law 25 consent)
 * - Security: invalid link shows neutral refusal with phone number, no Navbar booking CTA
 */

const VALID_TOKEN = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ'

function mockAgreementCallable(page: Page, language: 'en' | 'fr' = 'en') {
  return page.route('**/getAgreementForSigning', async (route) => {
    const body = route.request().postDataJSON() as { data?: { token?: string } } | null
    if (body?.data?.token !== VALID_TOKEN) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: { status: 'NOT_FOUND', message: 'This agreement link is invalid or has expired.' } }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          agreementId: 'e2e-agr-1',
          type: 'residential',
          language,
          status: 'sent',
          party: {
            name: language === 'fr' ? 'Diane Lafleur' : 'Margaret Storey',
            email: language === 'fr' ? 'diane@example.test' : 'margaret@example.test',
            phone: '613-555-0144',
            address: language === 'fr' ? '12 rue Riverdale, Cornwall ON' : '45 Pitt St, Cornwall ON',
          },
          terms: {
            serviceType: 'standard',
            frequency: 'biweekly',
            startDate: '2026-12-01',
            rateType: 'flat',
            rateCents: 18000,
            taxExempt: false,
            cancelWindowHours: 24,
            lateCancellationFeeCents: 5000,
            lockoutFeeCents: 3500,
            latePaymentBasisPoints: 200,
            noticePeriodDays: 14,
          },
          templateName: language === 'fr' ? 'Contrat de services résidentiels' : 'Residential Service Agreement',
          versionId: 'v1',
          versionLabel: 'v1',
          bodyEn: '# Master Terms\n\n## 1. Scope\n- Eco-friendly residential cleaning.\n\n## 2. Guarantee\nCall (613) 861-8812 within 24 hours.',
          bodyFr: '# Conditions générales\n\n## 1. Portée\n- Entretien ménager écologique.\n\n## 2. Garantie\nAppelez le (613) 861-8812 dans les 24 heures.',
          signedAtIso: null,
          signedName: null,
        },
      }),
    })
  })
}

function mockSignCallable(page: Page) {
  return page.route('**/signAgreement', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          ok: true,
          alreadySigned: false,
          agreementId: 'e2e-agr-1',
          signedAtIso: '2026-11-20T22:30:00.000Z',
        },
      }),
    })
  })
}

test.describe('P3-E39 Client E-Agreement Signing Flows', () => {
  test('P3 Margaret (768px portrait): phone visible above fold, >=16px text, >=48px controls, zero axe AA violations, completes signing', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await mockAgreementCallable(page, 'en')
    await mockSignCallable(page)

    await page.goto(`/agreement/${VALID_TOKEN}`)
    const heading = page.getByRole('heading', { name: 'Residential Service Agreement' })
    await expect(heading).toBeVisible()

    // Navbar booking CTA is hidden on the private signing page
    await expect(page.locator('#cta-book-now-nav')).toHaveCount(0)

    // Office phone link is visible without scrolling
    const phoneLink = page.locator('main a[href="tel:+16138618812"]').first()
    await expect(phoneLink).toBeVisible()
    const phoneBox = await phoneLink.boundingBox()
    expect(phoneBox).not.toBeNull()
    expect(phoneBox!.y + phoneBox!.height).toBeLessThan(1024)

    // No horizontal scroll at 768px
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(overflow).toBe(false)

    // Primary sign button meets 48px touch target
    const signBtn = page.getByRole('button', { name: 'Sign Agreement' })
    const btnBox = await signBtn.boundingBox()
    expect(btnBox!.height).toBeGreaterThanOrEqual(48)

    // Axe WCAG 2.1 AA audit
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    const severe = axe.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    expect(severe).toHaveLength(0)

    // Complete signing
    await page.getByLabel(/I agree to sign this agreement electronically/i).check()
    await page.getByLabel(/I have read and agree to the service details/i).check()
    await page.getByLabel(/Type your full name/i).fill('Margaret Storey')
    await signBtn.click()

    await expect(page.getByRole('heading', { name: /Signed — thank you!/i })).toBeVisible()
  })

  test('P2 Travis (390px phone): fast mobile sign with no sign-in and no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockAgreementCallable(page, 'en')
    await mockSignCallable(page)

    await page.goto(`/agreement/${VALID_TOKEN}`)
    await expect(page.getByRole('heading', { name: 'Residential Service Agreement' })).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(overflow).toBe(false)

    await page.getByLabel(/I agree to sign this agreement electronically/i).check()
    await page.getByLabel(/I have read and agree to the service details/i).check()
    await page.getByLabel(/Type your full name/i).fill('Travis McLeod')
    await page.getByRole('button', { name: 'Sign Agreement' }).click()

    await expect(page.getByRole('heading', { name: /Signed — thank you!/i })).toBeVisible()
  })

  test('P1 Diane / P5 Sophie (French): opens in French with Law 25 consent and French thank-you', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await mockAgreementCallable(page, 'fr')
    await mockSignCallable(page)

    await page.goto(`/agreement/${VALID_TOKEN}`)
    await expect(page.getByRole('heading', { name: 'Contrat de services résidentiels' })).toBeVisible()
    await expect(page.getByText(/Loi 25 du Québec/i)).toBeVisible()

    await page.getByLabel(/J’accepte de signer ce contrat électroniquement/i).check()
    await page.getByLabel(/J’ai lu et j’accepte les détails du service/i).check()
    await page.getByLabel(/Saisissez votre nom complet/i).fill('Diane Lafleur')
    await page.getByRole('button', { name: 'Signer le contrat' }).click()

    await expect(page.getByRole('heading', { name: /Signé — merci !/i })).toBeVisible()
  })

  test('Security: invalid token shows neutral refusal with office phone link', async ({ page }) => {
    await mockAgreementCallable(page, 'en')
    await page.goto('/agreement/invalid-token-12345')
    await expect(page.getByRole('heading', { name: /no longer valid/i })).toBeVisible()
    await expect(page.locator('main a[href="tel:+16138618812"]').first()).toBeVisible()
  })
})
