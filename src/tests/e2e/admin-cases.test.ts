import { test, expect, Page } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://customer-rma.vercel.app'

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE}/login`)
  await page.getByLabel('Email address').fill('demo.admin@cosworth.com')
  await page.getByLabel('Password').fill('Demo1234!')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(`${BASE}/admin/dashboard`, { timeout: 15000 })
}

async function loginAsStaffUK(page: Page) {
  await page.goto(`${BASE}/login`)
  await page.getByLabel('Email address').fill('demo.staff@cosworth.com')
  await page.getByLabel('Password').fill('Demo1234!')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(`${BASE}/admin/dashboard`, { timeout: 15000 })
}

test.describe('Admin Dashboard', () => {
  test('admin can reach dashboard and see case queue', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.getByText(/case/i)).toBeVisible()
    // Dashboard should show case count or empty state — not a crash
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('admin cases list is accessible', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${BASE}/admin/cases`)
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('table, [role="table"], [data-testid="cases"]').or(
      page.getByText(/no cases/i)
    )).toBeVisible({ timeout: 10000 })
  })

  test('customer cannot access admin routes', async ({ page }) => {
    // Sign in as customer
    await page.goto(`${BASE}/login`)
    await page.getByLabel('Email address').fill('demo.customer@btsport.com')
    await page.getByLabel('Password').fill('Demo1234!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL(`${BASE}/cases`, { timeout: 15000 })

    // Try to reach admin
    await page.goto(`${BASE}/admin/dashboard`)
    // Should be redirected to login or home — not admin
    expect(page.url()).not.toContain('/admin/dashboard')
  })
})

test.describe('Admin Products & Fees', () => {
  test('products page loads', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${BASE}/admin/products`)
    await expect(page).not.toHaveURL(/\/login/)
    // Should show product list or empty state
    await expect(page.locator('table, [role="table"]').or(
      page.getByText(/no products/i)
    )).toBeVisible({ timeout: 10000 })
  })

  test('new product form is accessible to admin', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${BASE}/admin/products/new`)
    await expect(page.getByLabel(/part number/i)).toBeVisible()
    await expect(page.getByLabel(/display name/i)).toBeVisible()
    await expect(page.getByLabel(/tariff code/i)).toBeVisible()
  })

  test('tariff code field is present on product edit form', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${BASE}/admin/products`)
    // Click the first product's edit link if any exist
    const editLink = page.getByRole('link', { name: /edit/i }).first()
    const hasProducts = await editLink.isVisible({ timeout: 3000 }).catch(() => false)
    if (hasProducts) {
      await editLink.click()
      await expect(page.getByLabel(/tariff code/i)).toBeVisible()
    }
  })
})

test.describe('Admin Accounts', () => {
  test('accounts page loads', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${BASE}/admin/accounts`)
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('table, [role="table"]').or(
      page.getByText(/no accounts/i)
    )).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Staff UK access', () => {
  test('staff_uk can reach admin dashboard', async ({ page }) => {
    await loginAsStaffUK(page)
    await expect(page).toHaveURL(`${BASE}/admin/dashboard`)
  })

  test('staff_uk nav shows Staff — UK role label', async ({ page }) => {
    await loginAsStaffUK(page)
    await expect(page.locator('text=Staff — UK')).toBeVisible({ timeout: 8000 })
  })
})
