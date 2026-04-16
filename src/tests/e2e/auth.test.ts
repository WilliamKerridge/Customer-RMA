import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://customer-rma.vercel.app'

test.describe('Authentication', () => {
  test('login page loads and shows both tabs', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.getByLabel('Email address').fill('nobody@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In' }).click()
    // Should show an error message, not redirect
    await expect(page.locator('p.text-red-600')).toBeVisible({ timeout: 10000 })
    expect(page.url()).toContain('/login')
  })

  test('demo customer can sign in and reaches cases page', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.getByLabel('Email address').fill('demo.customer@btsport.com')
    await page.getByLabel('Password').fill('Demo1234!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL(`${BASE}/cases`, { timeout: 15000 })
    expect(page.url()).toContain('/cases')
  })

  test('demo admin can sign in and reaches admin dashboard', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.getByLabel('Email address').fill('demo.admin@cosworth.com')
    await page.getByLabel('Password').fill('Demo1234!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL(`${BASE}/admin/dashboard`, { timeout: 15000 })
    expect(page.url()).toContain('/admin/dashboard')
  })

  test('admin nav shows "Admin" role label after login', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.getByLabel('Email address').fill('demo.admin@cosworth.com')
    await page.getByLabel('Password').fill('Demo1234!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL(`${BASE}/admin/dashboard`, { timeout: 15000 })
    // Wait for the role label to be fetched from /api/me
    await expect(page.locator('text=Admin')).toBeVisible({ timeout: 8000 })
  })

  test('unauthenticated access to /cases redirects to login', async ({ page }) => {
    await page.goto(`${BASE}/cases`)
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated access to /admin redirects to login', async ({ page }) => {
    await page.goto(`${BASE}/admin/dashboard`)
    await expect(page).toHaveURL(/\/login/)
  })

  test('forgot password page is accessible', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.getByRole('link', { name: 'Forgot password?' }).click()
    await expect(page).toHaveURL(/\/forgot-password/)
  })
})
