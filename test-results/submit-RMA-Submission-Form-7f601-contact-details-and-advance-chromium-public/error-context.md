# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: submit.test.ts >> RMA Submission Form >> step 1 — can fill contact details and advance
- Location: src\tests\e2e\submit.test.ts:22:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /next/i })

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
    - generic [ref=e16]:
      - generic [ref=e17]:
        - text: Home
        - img [ref=e18]
        - generic [ref=e20]: New Return
      - heading "New Return Request" [level=1] [ref=e21]
      - paragraph [ref=e22]: Submit a product for repair, service, or return. You'll receive a Case ID immediately.
    - generic [ref=e24]:
      - generic [ref=e26]:
        - generic [ref=e27]:
          - generic [ref=e30]: "1"
          - generic [ref=e31]: Contact
        - generic [ref=e32]:
          - generic [ref=e35]: "2"
          - generic [ref=e36]: Office & Date
        - generic [ref=e37]:
          - generic [ref=e40]: "3"
          - generic [ref=e41]: Products
        - generic [ref=e42]:
          - generic [ref=e45]: "4"
          - generic [ref=e46]: Fault Details
        - generic [ref=e47]:
          - generic [ref=e49]: "5"
          - generic [ref=e50]: Review
      - generic [ref=e53]:
        - generic [ref=e54]:
          - heading "Your Contact Details" [level=2] [ref=e55]
          - generic [ref=e56]: Step 1 of 5
        - generic [ref=e57]:
          - generic [ref=e58]:
            - link "Create an account" [ref=e59] [cursor=pointer]:
              - /url: /login
            - text: to save your details for future returns.
          - generic [ref=e60]:
            - generic [ref=e61]:
              - generic [ref=e62]: Full Name *
              - textbox "Full Name *" [ref=e63]:
                - /placeholder: John Smith
                - text: Test Customer
            - generic [ref=e64]:
              - generic [ref=e65]: Company *
              - textbox "Company *" [ref=e66]:
                - /placeholder: Your Team / Company
                - text: Test Motorsport Ltd
          - generic [ref=e67]:
            - generic [ref=e68]:
              - generic [ref=e69]: Email Address *
              - textbox "Email Address *" [ref=e70]:
                - /placeholder: john@yourteam.com
                - text: test@example.com
            - generic [ref=e71]:
              - generic [ref=e72]: Phone
              - textbox "Phone" [ref=e73]:
                - /placeholder: +44 7700 900000
          - heading "Return Shipping Address" [level=3] [ref=e75]
          - generic [ref=e76]:
            - generic [ref=e77]: Street Address *
            - textbox "Street Address *" [active] [ref=e78]:
              - /placeholder: 123 Race Circuit Road
              - text: 123 Test Street
          - generic [ref=e79]:
            - generic [ref=e80]:
              - generic [ref=e81]: City
              - textbox "City" [ref=e82]:
                - /placeholder: Northamptonshire
            - generic [ref=e83]:
              - generic [ref=e84]: Postcode / ZIP
              - textbox "Postcode / ZIP" [ref=e85]:
                - /placeholder: NN12 8TN
          - generic [ref=e86]:
            - generic [ref=e87]: Country
            - combobox "Country" [ref=e88]:
              - option "United Kingdom" [selected]
              - option "United States"
              - option "Germany"
              - option "France"
              - option "Italy"
              - option "Spain"
              - option "Australia"
              - option "Japan"
              - option "Canada"
              - option "Brazil"
              - option "Netherlands"
              - option "Belgium"
              - option "Switzerland"
              - option "Austria"
              - option "Sweden"
              - option "Finland"
          - button "Continue to Office & Date" [ref=e90]:
            - text: Continue to Office & Date
            - img [ref=e91]
  - contentinfo [ref=e93]:
    - generic [ref=e94]:
      - generic [ref=e95]:
        - generic [ref=e96]:
          - paragraph [ref=e97]: Cosworth Electronics Ltd
          - generic [ref=e98]:
            - text: Brookfield Technology Centre
            - text: Twentypence Road, Cottenham
            - text: Cambridge, CB24 8PS
            - text: United Kingdom
        - generic [ref=e99]:
          - paragraph [ref=e100]: Cosworth Electronics LLC
          - generic [ref=e101]:
            - text: 5355 W 86th St
            - text: Indianapolis, IN 46268
            - text: United States
      - generic [ref=e102]:
        - paragraph [ref=e103]: COSWORTH® is a registered trade mark of Cosworth Group Holdings Limited
        - generic [ref=e104]:
          - link "Legal Policies" [ref=e105] [cursor=pointer]:
            - /url: "#"
          - link "User Guides" [ref=e106] [cursor=pointer]:
            - /url: "#"
  - alert [ref=e107]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://customer-rma.vercel.app'
  4  | 
  5  | test.describe('RMA Submission Form', () => {
  6  |   test.beforeEach(async ({ page }) => {
  7  |     await page.goto(`${BASE}/submit`)
  8  |   })
  9  | 
  10 |   test('submission page loads without authentication', async ({ page }) => {
  11 |     await expect(page.getByText(/submit/i)).toBeVisible()
  12 |   })
  13 | 
  14 |   test('step 1 — contact form shows required field validation', async ({ page }) => {
  15 |     // Click Next without filling anything
  16 |     const nextBtn = page.getByRole('button', { name: /next/i })
  17 |     await nextBtn.click()
  18 |     // At least one error should be visible
  19 |     await expect(page.locator('[class*="text-red"]')).toBeVisible()
  20 |   })
  21 | 
  22 |   test('step 1 — can fill contact details and advance', async ({ page }) => {
  23 |     await page.getByLabel('Full Name').fill('Test Customer')
  24 |     await page.getByLabel('Company').fill('Test Motorsport Ltd')
  25 |     await page.getByLabel(/email/i).fill('test@example.com')
  26 |     await page.getByLabel(/street/i).fill('123 Test Street')
  27 |     await page.getByLabel(/country/i).selectOption('GB')
> 28 |     await page.getByRole('button', { name: /next/i }).click()
     |                                                       ^ Error: locator.click: Test timeout of 30000ms exceeded.
  29 |     // Should advance to step 2 (office selection)
  30 |     await expect(page.getByText(/office/i)).toBeVisible({ timeout: 5000 })
  31 |   })
  32 | 
  33 |   test('complete guest submission produces a case reference', async ({ page }) => {
  34 |     // Step 1 — contact
  35 |     await page.getByLabel('Full Name').fill('E2E Test Customer')
  36 |     await page.getByLabel('Company').fill('E2E Test Co')
  37 |     await page.getByLabel(/email/i).fill('e2e-test@example.com')
  38 |     await page.getByLabel(/street/i).fill('1 Test Road')
  39 |     await page.getByLabel(/country/i).selectOption('GB')
  40 |     await page.getByRole('button', { name: /next/i }).click()
  41 | 
  42 |     // Step 2 — office
  43 |     await page.getByRole('button', { name: /uk/i }).first().click().catch(() => {
  44 |       page.locator('[value="UK"]').click()
  45 |     })
  46 |     await page.getByRole('button', { name: /next/i }).click()
  47 | 
  48 |     // Step 3 — add a product
  49 |     await page.waitForSelector('[placeholder*="search" i], [placeholder*="product" i]',
  50 |       { timeout: 5000 }).catch(() => {})
  51 |     const productSearch = page.locator('input').filter({ hasText: '' }).first()
  52 |     // Try to find and use the product dropdown
  53 |     await page.getByRole('combobox').first().click().catch(() => {})
  54 |     await page.getByRole('button', { name: /next/i }).click()
  55 | 
  56 |     // Step 4 — fault description
  57 |     const faultInput = page.getByLabel(/fault/i).or(page.locator('textarea')).first()
  58 |     await faultInput.fill('Unit powers on but display is blank')
  59 |     await page.getByRole('button', { name: /next/i }).click()
  60 | 
  61 |     // Step 5 — review and submit
  62 |     await page.getByRole('button', { name: /submit/i }).click()
  63 | 
  64 |     // Should land on success page with a case reference
  65 |     await page.waitForURL(`${BASE}/submit/success`, { timeout: 20000 })
  66 |     await expect(page.getByText(/CASE-/)).toBeVisible({ timeout: 10000 })
  67 |   })
  68 | })
  69 | 
```