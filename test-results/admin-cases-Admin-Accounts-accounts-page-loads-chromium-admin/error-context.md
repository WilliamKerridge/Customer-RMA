# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-cases.test.ts >> Admin Accounts >> accounts page loads
- Location: src\tests\e2e\admin-cases.test.ts:62:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('table, [role="table"]').or(getByText(/no accounts/i))
Expected: visible
Error: strict mode violation: locator('table, [role="table"]').or(getByText(/no accounts/i)) resolved to 2 elements:
    1) <table class="w-full border-collapse">…</table> aka getByText('ContactCompanyCredit TermsPO RequiredTotal CasesOpenActiveNo accounts found.')
    2) <td colspan="8" class="text-center text-sm text-grey-400 py-12">No accounts found.</td> aka getByText('No accounts found.')

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('table, [role="table"]').or(getByText(/no accounts/i))

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
        - link "Login" [ref=e12] [cursor=pointer]:
          - /url: /login
  - main [ref=e13]:
    - generic [ref=e14]:
      - complementary [ref=e15]:
        - generic [ref=e17]:
          - generic [ref=e18]: MP
          - generic [ref=e19]:
            - generic [ref=e20]: Matthew Parry
            - generic [ref=e21]: Admin
        - navigation [ref=e22]:
          - generic [ref=e23]:
            - generic [ref=e24]: Overview
            - generic [ref=e25]:
              - link "Dashboard" [ref=e26] [cursor=pointer]:
                - /url: /admin/dashboard
                - img [ref=e28]
                - generic [ref=e33]: Dashboard
              - link "All Cases 9" [ref=e34] [cursor=pointer]:
                - /url: /admin/cases
                - img [ref=e36]
                - generic [ref=e39]: All Cases
                - generic [ref=e40]: "9"
          - generic [ref=e41]:
            - generic [ref=e42]: Admin
            - generic [ref=e43]:
              - link "Products & Fees" [ref=e44] [cursor=pointer]:
                - /url: /admin/products
                - img [ref=e46]
                - generic [ref=e48]: Products & Fees
              - link "Accounts" [ref=e49] [cursor=pointer]:
                - /url: /admin/accounts
                - img [ref=e51]
                - generic [ref=e56]: Accounts
              - link "Import Power BI" [ref=e57] [cursor=pointer]:
                - /url: /admin/import
                - img [ref=e59]
                - generic [ref=e62]: Import Power BI
        - link "Customer view" [ref=e64] [cursor=pointer]:
          - /url: /cases
          - img [ref=e65]
          - text: Customer view
      - generic [ref=e68]:
        - generic [ref=e69]:
          - generic [ref=e70]:
            - heading "Customer Accounts" [level=1] [ref=e71]
            - paragraph [ref=e72]: Manage credit terms, purchase order requirements, and account status for all customers.
          - link "Add Account" [ref=e73] [cursor=pointer]:
            - /url: /admin/accounts/new
            - img [ref=e74]
            - text: Add Account
        - generic [ref=e75]:
          - generic [ref=e76]:
            - generic [ref=e77]:
              - img [ref=e79]
              - generic [ref=e84]: Total Accounts
            - generic [ref=e85]: "0"
          - generic [ref=e86]:
            - generic [ref=e87]:
              - img [ref=e89]
              - generic [ref=e91]: Credit Terms
            - generic [ref=e92]: "0"
            - generic [ref=e93]: 0% of accounts
          - generic [ref=e94]:
            - generic [ref=e95]:
              - img [ref=e97]
              - generic [ref=e100]: PO Required
            - generic [ref=e101]: "0"
            - generic [ref=e102]: of credit accounts
          - generic [ref=e103]:
            - generic [ref=e104]:
              - img [ref=e106]
              - generic [ref=e108]: Open Cases
            - generic [ref=e109]: "0"
            - generic [ref=e110]: across all accounts
        - generic [ref=e111]:
          - generic [ref=e112]:
            - img [ref=e113]
            - textbox "Search by name, company or email…" [ref=e116]
          - combobox [ref=e117] [cursor=pointer]:
            - option "All Accounts" [selected]
            - option "Credit Terms"
            - option "No Credit Terms"
          - combobox [ref=e118] [cursor=pointer]:
            - option "Active & Inactive" [selected]
            - option "Active only"
            - option "Inactive only"
          - button "Filter" [ref=e119] [cursor=pointer]
        - table [ref=e121]:
          - rowgroup [ref=e122]:
            - row "Contact Company Credit Terms PO Required Total Cases Open Active" [ref=e123]:
              - columnheader "Contact" [ref=e124]
              - columnheader "Company" [ref=e125]
              - columnheader "Credit Terms" [ref=e126]
              - columnheader "PO Required" [ref=e127]
              - columnheader "Total Cases" [ref=e128]
              - columnheader "Open" [ref=e129]
              - columnheader "Active" [ref=e130]
              - columnheader [ref=e131]
          - rowgroup [ref=e132]:
            - row "No accounts found." [ref=e133]:
              - cell "No accounts found." [ref=e134]
  - contentinfo [ref=e135]:
    - generic [ref=e136]:
      - generic [ref=e137]:
        - generic [ref=e138]:
          - paragraph [ref=e139]: Cosworth Electronics Ltd
          - generic [ref=e140]:
            - text: Brookfield Technology Centre
            - text: Twentypence Road, Cottenham
            - text: Cambridge, CB24 8PS
            - text: United Kingdom
        - generic [ref=e141]:
          - paragraph [ref=e142]: Cosworth Electronics LLC
          - generic [ref=e143]:
            - text: 5355 W 86th St
            - text: Indianapolis, IN 46268
            - text: United States
      - generic [ref=e144]:
        - paragraph [ref=e145]: COSWORTH® is a registered trade mark of Cosworth Group Holdings Limited
        - generic [ref=e146]:
          - link "Legal Policies" [ref=e147] [cursor=pointer]:
            - /url: "#"
          - link "User Guides" [ref=e148] [cursor=pointer]:
            - /url: "#"
  - alert [ref=e149]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://customer-rma.vercel.app'
  4  | 
  5  | // This test file runs in the chromium-admin project — pre-authenticated as demo.admin@cosworth.com
  6  | 
  7  | test.describe('Admin Dashboard', () => {
  8  |   test('admin can reach dashboard and see case queue', async ({ page }) => {
  9  |     await page.goto(`${BASE}/admin/dashboard`)
  10 |     await expect(page).not.toHaveURL(/\/login/)
  11 |     await expect(page.locator('h1, h2').first()).toBeVisible()
  12 |   })
  13 | 
  14 |   test('admin cases list is accessible', async ({ page }) => {
  15 |     await page.goto(`${BASE}/admin/cases`)
  16 |     await expect(page).not.toHaveURL(/\/login/)
  17 |     await expect(page.locator('table, [role="table"]').or(
  18 |       page.getByText(/no cases/i)
  19 |     )).toBeVisible({ timeout: 10000 })
  20 |   })
  21 | 
  22 |   test('customer cannot access admin routes', async ({ page }) => {
  23 |     // Sign in fresh as customer to test the middleware
  24 |     await page.goto(`${BASE}/login`)
  25 |     await page.getByLabel('Email address').first().fill('demo.customer@btsport.com')
  26 |     await page.getByLabel('Password').first().fill('Demo1234!')
  27 |     await page.getByRole('button', { name: 'Sign In' }).last().click()
  28 |     await page.waitForURL(`${BASE}/cases`, { timeout: 15000 })
  29 |     await page.goto(`${BASE}/admin/dashboard`)
  30 |     expect(page.url()).not.toContain('/admin/dashboard')
  31 |   })
  32 | })
  33 | 
  34 | test.describe('Admin Products & Fees', () => {
  35 |   test('products page loads', async ({ page }) => {
  36 |     await page.goto(`${BASE}/admin/products`)
  37 |     await expect(page).not.toHaveURL(/\/login/)
  38 |     await expect(page.locator('table, [role="table"]').or(
  39 |       page.getByText(/no products/i)
  40 |     )).toBeVisible({ timeout: 10000 })
  41 |   })
  42 | 
  43 |   test('new product form is accessible to admin', async ({ page }) => {
  44 |     await page.goto(`${BASE}/admin/products/new`)
  45 |     await expect(page.getByLabel(/part number/i)).toBeVisible()
  46 |     await expect(page.getByLabel(/display name/i)).toBeVisible()
  47 |     await expect(page.getByLabel(/tariff code/i)).toBeVisible()
  48 |   })
  49 | 
  50 |   test('tariff code field is present on product edit form', async ({ page }) => {
  51 |     await page.goto(`${BASE}/admin/products`)
  52 |     const editLink = page.getByRole('link', { name: /edit/i }).first()
  53 |     const hasProducts = await editLink.isVisible({ timeout: 3000 }).catch(() => false)
  54 |     if (hasProducts) {
  55 |       await editLink.click()
  56 |       await expect(page.getByLabel(/tariff code/i)).toBeVisible()
  57 |     }
  58 |   })
  59 | })
  60 | 
  61 | test.describe('Admin Accounts', () => {
  62 |   test('accounts page loads', async ({ page }) => {
  63 |     await page.goto(`${BASE}/admin/accounts`)
  64 |     await expect(page).not.toHaveURL(/\/login/)
  65 |     await expect(page.locator('table, [role="table"]').or(
  66 |       page.getByText(/no accounts/i)
> 67 |     )).toBeVisible({ timeout: 10000 })
     |        ^ Error: expect(locator).toBeVisible() failed
  68 |   })
  69 | })
  70 | 
  71 | test.describe('Staff UK access', () => {
  72 |   test('staff_uk can reach admin dashboard', async ({ page }) => {
  73 |     await page.goto(`${BASE}/login`)
  74 |     await page.getByLabel('Email address').first().fill('demo.staff@cosworth.com')
  75 |     await page.getByLabel('Password').first().fill('Demo1234!')
  76 |     await page.getByRole('button', { name: 'Sign In' }).last().click()
  77 |     await page.waitForURL(`${BASE}/admin/dashboard`, { timeout: 15000 })
  78 |     await expect(page).toHaveURL(`${BASE}/admin/dashboard`)
  79 |   })
  80 | 
  81 |   test('staff_uk nav shows Staff — UK role label', async ({ page }) => {
  82 |     await page.goto(`${BASE}/login`)
  83 |     await page.getByLabel('Email address').first().fill('demo.staff@cosworth.com')
  84 |     await page.getByLabel('Password').first().fill('Demo1234!')
  85 |     await page.getByRole('button', { name: 'Sign In' }).last().click()
  86 |     await page.waitForURL(`${BASE}/admin/dashboard`, { timeout: 15000 })
  87 |     await expect(page.locator('text=Staff — UK')).toBeVisible({ timeout: 8000 })
  88 |   })
  89 | })
  90 | 
```