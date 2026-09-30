import { test, expect } from '@playwright/test'

test('Can view blog list and navigate to individual blog post', async ({ page }) => {
  // 1. Visit the blog listing page
  await page.goto('/blog')
  await expect(page).toHaveTitle(/Fresh Nest Co. Blog/i)
  
  // Verify heading is present
  await expect(page.getByRole('heading', { name: /Fresh Nest Blog/i, level: 1 })).toBeVisible()
  
  // P3-E29: the cost guide is unpublished; the move-out checklist is now the first post
  const MOVE_OUT = /Move-Out Cleaning Checklist/i
  await expect(page.getByRole('heading', { name: MOVE_OUT, level: 2 })).toBeVisible()
  await expect(page.getByRole('heading', { name: /How Much Does House Cleaning Cost/i })).toHaveCount(0)

  // 2. Open the post
  await page.getByRole('link', { name: MOVE_OUT }).click()
  await expect(page).toHaveURL(/\/blog\/move-out-checklist-cornwall/)
  await expect(page.getByRole('heading', { name: MOVE_OUT, level: 1 })).toBeVisible()
})

test('Old pricing URL redirects to the quote request form (P3-E29)', async ({ page }) => {
  await page.goto('/pricing')
  await expect(page).toHaveURL(/\/booking$/)
})
