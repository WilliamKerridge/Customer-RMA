import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://customer-rma.vercel.app'

// This test file runs in the chromium-admin project — pre-authenticated as demo.admin@cosworth.com

test.describe('Admin Dashboard', () => {
  test('admin can reach dashboard and see case queue', async ({ page }) => {
    await page.goto(`${BASE}/admin/dashboard`)
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('admin cases list is accessible', async ({ page }) => {
    await page.goto(`${BASE}/admin/cases`)
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('table, [role="table"]').or(
      page.getByText(/no cases/i)
    )).toBeVisible({ timeout: 10000 })
  })

  test('customer cannot access admin routes', async ({ page }) => {
    // Sign in fresh as customer to test the middleware
    await page.goto(`${BASE}/login`)
    await page.getByLabel('Email address').first().fill('demo.customer@btsport.com')
    await page.getByLabel('Password').first().fill('Demo1234!')
    await page.getByRole('button', { name: 'Sign In' }).last().click()
    await page.waitForURL(`${BASE}/cases`, { timeout: 15000 })
    await page.goto(`${BASE}/admin/dashboard`)
    expect(page.url()).not.toContain('/admin/dashboard')
  })
})

test.describe('Admin Products & Fees', () => {
  test('products page loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/products`)
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('table, [role="table"]').or(
      page.getByText(/no products/i)
    )).toBeVisible({ timeout: 10000 })
  })

  test('new product form is accessible to admin', async ({ page }) => {
    await page.goto(`${BASE}/admin/products/new`)
    await expect(page.getByLabel(/part number/i)).toBeVisible()
    await expect(page.getByLabel(/display name/i)).toBeVisible()
    await expect(page.getByLabel(/tariff code/i)).toBeVisible()
  })

  test('tariff code field is present on product edit form', async ({ page }) => {
    await page.goto(`${BASE}/admin/products`)
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
    await page.goto(`${BASE}/admin/accounts`)
    await expect(page).not.toHaveURL(/\/login/)
    // Use .first() — the table element and the "No accounts found." cell inside it both match the .or() locator
    await expect(page.locator('table, [role="table"]').or(
      page.getByText(/no accounts/i)
    ).first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Staff UK access', () => {
  test('staff_uk can reach admin dashboard', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.getByLabel('Email address').first().fill('demo.staff@cosworth.com')
    await page.getByLabel('Password').first().fill('Demo1234!')
    await page.getByRole('button', { name: 'Sign In' }).last().click()
    await page.waitForURL(`${BASE}/admin/dashboard`, { timeout: 15000 })
    await expect(page).toHaveURL(`${BASE}/admin/dashboard`)
  })

  test('staff_uk nav shows Staff — UK role label', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.getByLabel('Email address').first().fill('demo.staff@cosworth.com')
    await page.getByLabel('Password').first().fill('Demo1234!')
    await page.getByRole('button', { name: 'Sign In' }).last().click()
    await page.waitForURL(`${BASE}/admin/dashboard`, { timeout: 15000 })
    // Use .first() — "Staff — UK" appears in both the navbar button and the sidebar user card
    await expect(page.locator('text=Staff — UK').first()).toBeVisible({ timeout: 8000 })
  })
})
