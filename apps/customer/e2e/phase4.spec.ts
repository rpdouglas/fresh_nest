import { test, expect } from '@playwright/test'

test('Can view blog list and navigate to individual blog post', async ({ page }) => {
  // 1. Visit the blog listing page
  await page.goto('/blog')
  await expect(page).toHaveTitle(/Fresh Nest Co. Blog/i)
  
  // Verify heading is present
  await expect(page.getByRole('heading', { name: /Fresh Nest Blog/i, level: 1 })).toBeVisible()
  
  // Verify that the cost guide article is in the listing
  const costGuideArticle = page.getByRole('heading', { name: /How Much Does House Cleaning Cost in Cornwall/i, level: 2 })
  await expect(costGuideArticle).toBeVisible()

  // 2. Click "Read More" on the first blog post
  await page.getByRole('link', { name: /How Much Does House Cleaning Cost in Cornwall/i }).click()

  // Verify URL redirection to slug path
  await expect(page).toHaveURL(/\/blog\/cleaning-cost-cornwall/)

  // Verify that the full article header is displayed
  await expect(page.getByRole('heading', { name: /How Much Does House Cleaning Cost in Cornwall/i, level: 1 })).toBeVisible()
})

test('Referral URL parameter successfully populates code input in booking form', async ({ page }) => {
  // Navigate to booking form with referral code query parameter
  await page.goto('/booking?ref=MARGARET-4B52')

  // Get the referral code input field
  const promoInput = page.locator('#referralCodeInput')
  
  // Verify it contains the value from the URL query parameter
  await expect(promoInput).toHaveValue('MARGARET-4B52')
})
