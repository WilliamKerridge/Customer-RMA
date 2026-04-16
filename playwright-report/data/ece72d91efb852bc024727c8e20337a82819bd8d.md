# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.test.ts >> Authentication >> admin nav shows "Admin" role label after login
- Location: src\tests\e2e\auth.test.ts:42:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Admin')
Expected: visible
Error: strict mode violation: locator('text=Admin') resolved to 3 elements:
    1) <span class="text-slate-400 text-xs">Admin</span> aka getByRole('button', { name: 'WK will kerridge Admin' })
    2) <div class="text-[11px] text-grey-400 mt-0.5">Admin</div> aka getByText('Admin').nth(1)
    3) <div class="px-3 mb-1.5 text-[10px] font-bold text-grey-400 uppercase tracking-[0.08em]">Admin</div> aka getByText('Admin').nth(2)

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for locator('text=Admin')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "Cosworth Returns" [ref=e4] [cursor=pointer]:
        - /url: /
        - img [ref=e6]
        - generic [ref=e10]: Cosworth Returns
      - navigation "Primary navigation" [ref=e11]:
        - button "WK will kerridge Admin" [ref=e13]:
          - generic [ref=e14]: WK
          - generic [ref=e15]:
            - generic [ref=e16]: will kerridge
            - generic [ref=e17]: Admin
          - img [ref=e18]
  - main [ref=e20]:
    - complementary [ref=e22]:
      - generic [ref=e24]:
        - generic [ref=e25]: MP
        - generic [ref=e26]:
          - generic [ref=e27]: Matthew Parry
          - generic [ref=e28]: Admin
      - navigation [ref=e29]:
        - generic [ref=e30]:
          - generic [ref=e31]: Overview
          - generic [ref=e32]:
            - link "Dashboard" [ref=e33] [cursor=pointer]:
              - /url: /admin/dashboard
              - img [ref=e35]
              - generic [ref=e40]: Dashboard
            - link "All Cases 9" [ref=e41] [cursor=pointer]:
              - /url: /admin/cases
              - img [ref=e43]
              - generic [ref=e46]: All Cases
              - generic [ref=e47]: "9"
        - generic [ref=e48]:
          - generic [ref=e49]: Admin
          - generic [ref=e50]:
            - link "Products & Fees" [ref=e51] [cursor=pointer]:
              - /url: /admin/products
              - img [ref=e53]
              - generic [ref=e55]: Products & Fees
            - link "Accounts" [ref=e56] [cursor=pointer]:
              - /url: /admin/accounts
              - img [ref=e58]
              - generic [ref=e63]: Accounts
            - link "Import Power BI" [ref=e64] [cursor=pointer]:
              - /url: /admin/import
              - img [ref=e66]
              - generic [ref=e69]: Import Power BI
      - link "Customer view" [ref=e71] [cursor=pointer]:
        - /url: /cases
        - img [ref=e72]
        - text: Customer view
  - contentinfo [ref=e137]:
    - generic [ref=e138]:
      - generic [ref=e139]:
        - generic [ref=e140]:
          - paragraph [ref=e141]: Cosworth Electronics Ltd
          - generic [ref=e142]:
            - text: Brookfield Technology Centre
            - text: Twentypence Road, Cottenham
            - text: Cambridge, CB24 8PS
            - text: United Kingdom
        - generic [ref=e143]:
          - paragraph [ref=e144]: Cosworth Electronics LLC
          - generic [ref=e145]:
            - text: 5355 W 86th St
            - text: Indianapolis, IN 46268
            - text: United States
      - generic [ref=e146]:
        - paragraph [ref=e147]: COSWORTH® is a registered trade mark of Cosworth Group Holdings Limited
        - generic [ref=e148]:
          - link "Legal Policies" [ref=e149] [cursor=pointer]:
            - /url: "#"
          - link "User Guides" [ref=e150] [cursor=pointer]:
            - /url: "#"
  - alert [ref=e151]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://customer-rma.vercel.app'
  4  | 
  5  | test.describe('Authentication', () => {
  6  |   test('login page loads and shows both tabs', async ({ page }) => {
  7  |     await page.goto(`${BASE}/login`)
  8  |     // Use .first() — both the tab button and form submit button are named "Sign In"
  9  |     await expect(page.getByRole('button', { name: 'Sign In' }).first()).toBeVisible()
  10 |     await expect(page.getByRole('button', { name: 'Register' })).toBeVisible()
  11 |   })
  12 | 
  13 |   test('shows error on invalid credentials', async ({ page }) => {
  14 |     await page.goto(`${BASE}/login`)
  15 |     await page.getByLabel('Email address').fill('nobody@example.com')
  16 |     await page.getByLabel('Password').fill('wrongpassword')
  17 |     // Use .last() to click the form submit button (not the tab button)
  18 |     await page.getByRole('button', { name: 'Sign In' }).last().click()
  19 |     // Should show an error message, not redirect
  20 |     await expect(page.locator('p.text-red-600')).toBeVisible({ timeout: 10000 })
  21 |     expect(page.url()).toContain('/login')
  22 |   })
  23 | 
  24 |   test('demo customer can sign in and reaches cases page', async ({ page }) => {
  25 |     await page.goto(`${BASE}/login`)
  26 |     await page.getByLabel('Email address').fill('demo.customer@btsport.com')
  27 |     await page.getByLabel('Password').fill('Demo1234!')
  28 |     await page.getByRole('button', { name: 'Sign In' }).last().click()
  29 |     await page.waitForURL(`${BASE}/cases`, { timeout: 15000 })
  30 |     expect(page.url()).toContain('/cases')
  31 |   })
  32 | 
  33 |   test('demo admin can sign in and reaches admin dashboard', async ({ page }) => {
  34 |     await page.goto(`${BASE}/login`)
  35 |     await page.getByLabel('Email address').fill('demo.admin@cosworth.com')
  36 |     await page.getByLabel('Password').fill('Demo1234!')
  37 |     await page.getByRole('button', { name: 'Sign In' }).last().click()
  38 |     await page.waitForURL(`${BASE}/admin/dashboard`, { timeout: 15000 })
  39 |     expect(page.url()).toContain('/admin/dashboard')
  40 |   })
  41 | 
  42 |   test('admin nav shows "Admin" role label after login', async ({ page }) => {
  43 |     await page.goto(`${BASE}/login`)
  44 |     await page.getByLabel('Email address').fill('demo.admin@cosworth.com')
  45 |     await page.getByLabel('Password').fill('Demo1234!')
  46 |     await page.getByRole('button', { name: 'Sign In' }).last().click()
  47 |     await page.waitForURL(`${BASE}/admin/dashboard`, { timeout: 15000 })
  48 |     // Wait for the role label to be fetched from /api/me
> 49 |     await expect(page.locator('text=Admin')).toBeVisible({ timeout: 8000 })
     |                                              ^ Error: expect(locator).toBeVisible() failed
  50 |   })
  51 | 
  52 |   test('unauthenticated access to /cases redirects to login', async ({ page }) => {
  53 |     await page.goto(`${BASE}/cases`)
  54 |     await expect(page).toHaveURL(/\/login/)
  55 |   })
  56 | 
  57 |   test('unauthenticated access to /admin redirects to login', async ({ page }) => {
  58 |     await page.goto(`${BASE}/admin/dashboard`)
  59 |     await expect(page).toHaveURL(/\/login/)
  60 |   })
  61 | 
  62 |   test('forgot password page is accessible', async ({ page }) => {
  63 |     await page.goto(`${BASE}/login`)
  64 |     await page.getByRole('link', { name: 'Forgot password?' }).click()
  65 |     await expect(page).toHaveURL(/\/forgot-password/)
  66 |   })
  67 | })
  68 | 
```