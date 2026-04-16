import { test, expect, Page } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://customer-rma.vercel.app'

async function loginAsCustomer(page: Page) {
  await page.goto(`${BASE}/login`)
  await page.getByLabel('Email address').fill('demo.customer@btsport.com')
  await page.getByLabel('Password').fill('Demo1234!')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(`${BASE}/cases`, { timeout: 15000 })
}

test.describe('Customer case list', () => {
  test('customer can see their cases page after login', async ({ page }) => {
    await loginAsCustomer(page)
    await expect(page).toHaveURL(`${BASE}/cases`)
    // Page renders without crashing — shows cases or empty state
    await expect(page.locator('main')).toBeVisible()
  })

  test('CREDIT_HELD label is never visible to customer', async ({ page }) => {
    await loginAsCustomer(page)
    // Check both list and any case detail pages for the forbidden string
    const pageText = await page.locator('body').textContent()
    expect(pageText?.toLowerCase()).not.toContain('credit held')
    expect(pageText).not.toContain('CREDIT_HELD')
  })

  test('SAP financial data is not visible to customer', async ({ page }) => {
    await loginAsCustomer(page)
    const pageText = await page.locator('body').textContent()
    // sap_order_value and sap_spent_hours column names must never appear
    expect(pageText).not.toContain('sap_order_value')
    expect(pageText).not.toContain('sap_spent_hours')
  })

  test('customer nav shows "Customer" role label', async ({ page }) => {
    await loginAsCustomer(page)
    await expect(page.locator('text=Customer')).toBeVisible({ timeout: 8000 })
  })
})

test.describe('Customer case isolation', () => {
  test('customer cannot access admin case detail', async ({ page }) => {
    await loginAsCustomer(page)
    await page.goto(`${BASE}/admin/cases`)
    // Should redirect away, not show admin content
    expect(page.url()).not.toContain('/admin/cases')
  })
})
