import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://customer-rma.vercel.app'

// This test file runs in the chromium-customer project — pre-authenticated as demo.customer@btsport.com

test.describe('Customer case list', () => {
  test('customer can see their cases page after login', async ({ page }) => {
    await page.goto(`${BASE}/cases`)
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('main')).toBeVisible()
  })

  test('CREDIT_HELD label is never visible to customer', async ({ page }) => {
    await page.goto(`${BASE}/cases`)
    const pageText = await page.locator('body').textContent()
    expect(pageText?.toLowerCase()).not.toContain('credit held')
    expect(pageText).not.toContain('CREDIT_HELD')
  })

  test('SAP financial data is not visible to customer', async ({ page }) => {
    await page.goto(`${BASE}/cases`)
    const pageText = await page.locator('body').textContent()
    expect(pageText).not.toContain('sap_order_value')
    expect(pageText).not.toContain('sap_spent_hours')
  })

  test('customer nav shows "Customer" role label', async ({ page }) => {
    await page.goto(`${BASE}/cases`)
    await expect(page.locator('text=Customer')).toBeVisible({ timeout: 8000 })
  })
})

test.describe('Customer case isolation', () => {
  test('customer cannot access admin case detail', async ({ page }) => {
    await page.goto(`${BASE}/admin/cases`)
    expect(page.url()).not.toContain('/admin/cases')
  })
})
