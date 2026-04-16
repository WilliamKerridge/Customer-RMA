import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://customer-rma.vercel.app'

test.describe('RMA Submission Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/submit`)
  })

  test('submission page loads without authentication', async ({ page }) => {
    await expect(page.getByText(/submit/i)).toBeVisible()
  })

  test('step 1 — contact form shows required field validation', async ({ page }) => {
    // Click Next without filling anything
    const nextBtn = page.getByRole('button', { name: /next/i })
    await nextBtn.click()
    // At least one error should be visible
    await expect(page.locator('[class*="text-red"]')).toBeVisible()
  })

  test('step 1 — can fill contact details and advance', async ({ page }) => {
    await page.getByLabel('Full Name').fill('Test Customer')
    await page.getByLabel('Company').fill('Test Motorsport Ltd')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/street/i).fill('123 Test Street')
    await page.getByLabel(/country/i).selectOption('GB')
    await page.getByRole('button', { name: /next/i }).click()
    // Should advance to step 2 (office selection)
    await expect(page.getByText(/office/i)).toBeVisible({ timeout: 5000 })
  })

  test('complete guest submission produces a case reference', async ({ page }) => {
    // Step 1 — contact
    await page.getByLabel('Full Name').fill('E2E Test Customer')
    await page.getByLabel('Company').fill('E2E Test Co')
    await page.getByLabel(/email/i).fill('e2e-test@example.com')
    await page.getByLabel(/street/i).fill('1 Test Road')
    await page.getByLabel(/country/i).selectOption('GB')
    await page.getByRole('button', { name: /next/i }).click()

    // Step 2 — office
    await page.getByRole('button', { name: /uk/i }).first().click().catch(() => {
      page.locator('[value="UK"]').click()
    })
    await page.getByRole('button', { name: /next/i }).click()

    // Step 3 — add a product
    await page.waitForSelector('[placeholder*="search" i], [placeholder*="product" i]',
      { timeout: 5000 }).catch(() => {})
    const productSearch = page.locator('input').filter({ hasText: '' }).first()
    // Try to find and use the product dropdown
    await page.getByRole('combobox').first().click().catch(() => {})
    await page.getByRole('button', { name: /next/i }).click()

    // Step 4 — fault description
    const faultInput = page.getByLabel(/fault/i).or(page.locator('textarea')).first()
    await faultInput.fill('Unit powers on but display is blank')
    await page.getByRole('button', { name: /next/i }).click()

    // Step 5 — review and submit
    await page.getByRole('button', { name: /submit/i }).click()

    // Should land on success page with a case reference
    await page.waitForURL(`${BASE}/submit/success`, { timeout: 20000 })
    await expect(page.getByText(/CASE-/)).toBeVisible({ timeout: 10000 })
  })
})
