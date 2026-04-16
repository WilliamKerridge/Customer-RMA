# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-cases.test.ts >> Staff UK access >> staff_uk nav shows Staff — UK role label
- Location: src\tests\e2e\admin-cases.test.ts:81:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Staff — UK')
Expected: visible
Error: strict mode violation: locator('text=Staff — UK') resolved to 2 elements:
    1) <span class="text-slate-400 text-xs">Staff — UK</span> aka getByRole('button', { name: 'WK will kerridge Staff — UK' })
    2) <div class="text-[11px] text-grey-400 mt-0.5">Staff — UK</div> aka getByRole('complementary').getByText('Staff — UK')

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for locator('text=Staff — UK')

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
        - button "WK will kerridge Staff — UK" [ref=e13]:
          - generic [ref=e14]: WK
          - generic [ref=e15]:
            - generic [ref=e16]: will kerridge
            - generic [ref=e17]: Staff — UK
          - img [ref=e18]
  - main [ref=e20]:
    - generic [ref=e21]:
      - complementary [ref=e22]:
        - generic [ref=e24]:
          - generic [ref=e25]: NS
          - generic [ref=e26]:
            - generic [ref=e27]: Nigel Seamarks
            - generic [ref=e28]: Staff — UK
        - navigation [ref=e29]:
          - generic [ref=e30]:
            - generic [ref=e31]: Overview
            - generic [ref=e32]:
              - link "Dashboard" [ref=e33] [cursor=pointer]:
                - /url: /admin/dashboard
                - img [ref=e35]
                - generic [ref=e40]: Dashboard
              - link "All Cases 8" [ref=e41] [cursor=pointer]:
                - /url: /admin/cases
                - img [ref=e43]
                - generic [ref=e46]: All Cases
                - generic [ref=e47]: "8"
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
      - generic [ref=e75]:
        - generic [ref=e76]:
          - heading "Dashboard" [level=1] [ref=e77]
          - paragraph [ref=e78]: UK case queue
        - generic [ref=e79]:
          - generic [ref=e80]:
            - generic [ref=e81]: New This Week
            - generic [ref=e82]: "5"
          - generic [ref=e83]:
            - generic [ref=e84]: Awaiting Action
            - generic [ref=e85]: "3"
          - generic [ref=e86]:
            - generic [ref=e87]: In Workshop
            - generic [ref=e88]: "2"
          - generic [ref=e89]:
            - generic [ref=e90]: Closed This Month
            - generic [ref=e91]: "0"
        - generic [ref=e92]:
          - generic [ref=e93]:
            - heading "Case Queue" [level=2] [ref=e94]
            - link "New Case" [ref=e95] [cursor=pointer]:
              - /url: /submit
              - img [ref=e96]
              - text: New Case
          - table [ref=e98]:
            - rowgroup [ref=e99]:
              - row "Case ID Customer / Products Workshop Stage Status Est. Completion Actions" [ref=e100]:
                - columnheader "Case ID" [ref=e101]
                - columnheader "Customer / Products" [ref=e102]
                - columnheader "Workshop Stage" [ref=e103]
                - columnheader "Status" [ref=e104]
                - columnheader "Est. Completion" [ref=e105]
                - columnheader "Actions" [ref=e106]
            - rowgroup [ref=e107]:
              - row "CASE-202604-0059 CDU 10.3 repair — Submitted 30 Apr 2026 Review View" [ref=e108] [cursor=pointer]:
                - cell "CASE-202604-0059" [ref=e109]:
                  - link "CASE-202604-0059" [ref=e110]:
                    - /url: /admin/cases/6ef42e64-7560-4442-8fcc-51a19a306115
                - cell "CDU 10.3 repair" [ref=e111]:
                  - link "CDU 10.3 repair" [ref=e112]:
                    - /url: /admin/cases/6ef42e64-7560-4442-8fcc-51a19a306115
                    - generic [ref=e113]: CDU 10.3
                    - generic [ref=e114]: repair
                - cell "—" [ref=e115]:
                  - link "—" [ref=e116]:
                    - /url: /admin/cases/6ef42e64-7560-4442-8fcc-51a19a306115
                - cell "Submitted" [ref=e117]:
                  - link "Submitted" [ref=e118]:
                    - /url: /admin/cases/6ef42e64-7560-4442-8fcc-51a19a306115
                    - generic [ref=e119]: Submitted
                - cell "30 Apr 2026" [ref=e121]:
                  - link "30 Apr 2026" [ref=e122]:
                    - /url: /admin/cases/6ef42e64-7560-4442-8fcc-51a19a306115
                - cell "Review View" [ref=e123]:
                  - generic [ref=e124]:
                    - link "Review" [ref=e125]:
                      - /url: /admin/cases/6ef42e64-7560-4442-8fcc-51a19a306115
                    - link "View" [ref=e126]:
                      - /url: /admin/cases/6ef42e64-7560-4442-8fcc-51a19a306115
              - row "CASE-202604-0055 Antares 8 TLA repair — RMA Issued 30 Apr 2026 View" [ref=e127] [cursor=pointer]:
                - cell "CASE-202604-0055" [ref=e128]:
                  - link "CASE-202604-0055" [ref=e129]:
                    - /url: /admin/cases/b08eaf05-ae0e-431d-9b4b-4bddc842cbcd
                - cell "Antares 8 TLA repair" [ref=e130]:
                  - link "Antares 8 TLA repair" [ref=e131]:
                    - /url: /admin/cases/b08eaf05-ae0e-431d-9b4b-4bddc842cbcd
                    - generic [ref=e132]: Antares 8 TLA
                    - generic [ref=e133]: repair
                - cell "—" [ref=e134]:
                  - link "—" [ref=e135]:
                    - /url: /admin/cases/b08eaf05-ae0e-431d-9b4b-4bddc842cbcd
                - cell "RMA Issued" [ref=e136]:
                  - link "RMA Issued" [ref=e137]:
                    - /url: /admin/cases/b08eaf05-ae0e-431d-9b4b-4bddc842cbcd
                    - generic [ref=e138]: RMA Issued
                - cell "30 Apr 2026" [ref=e140]:
                  - link "30 Apr 2026" [ref=e141]:
                    - /url: /admin/cases/b08eaf05-ae0e-431d-9b4b-4bddc842cbcd
                - cell "View" [ref=e142]:
                  - link "View" [ref=e144]:
                    - /url: /admin/cases/b08eaf05-ae0e-431d-9b4b-4bddc842cbcd
              - row "CASE-202604-0058 CDU 7.0 repair — Submitted 30 Apr 2026 Review View" [ref=e145] [cursor=pointer]:
                - cell "CASE-202604-0058" [ref=e146]:
                  - link "CASE-202604-0058" [ref=e147]:
                    - /url: /admin/cases/b820ad9c-e543-4539-a816-7b714a5d55fd
                - cell "CDU 7.0 repair" [ref=e148]:
                  - link "CDU 7.0 repair" [ref=e149]:
                    - /url: /admin/cases/b820ad9c-e543-4539-a816-7b714a5d55fd
                    - generic [ref=e150]: CDU 7.0
                    - generic [ref=e151]: repair
                - cell "—" [ref=e152]:
                  - link "—" [ref=e153]:
                    - /url: /admin/cases/b820ad9c-e543-4539-a816-7b714a5d55fd
                - cell "Submitted" [ref=e154]:
                  - link "Submitted" [ref=e155]:
                    - /url: /admin/cases/b820ad9c-e543-4539-a816-7b714a5d55fd
                    - generic [ref=e156]: Submitted
                - cell "30 Apr 2026" [ref=e158]:
                  - link "30 Apr 2026" [ref=e159]:
                    - /url: /admin/cases/b820ad9c-e543-4539-a816-7b714a5d55fd
                - cell "Review View" [ref=e160]:
                  - generic [ref=e161]:
                    - link "Review" [ref=e162]:
                      - /url: /admin/cases/b820ad9c-e543-4539-a816-7b714a5d55fd
                    - link "View" [ref=e163]:
                      - /url: /admin/cases/b820ad9c-e543-4539-a816-7b714a5d55fd
              - row "CASE-202604-0056 CDU 7.0 repair In Rework In Repair 20 Apr 2026 View" [ref=e164] [cursor=pointer]:
                - cell "CASE-202604-0056" [ref=e165]:
                  - link "CASE-202604-0056" [ref=e166]:
                    - /url: /admin/cases/f5f70ba6-e646-4ab9-8aa7-7fbe218ca110
                - cell "CDU 7.0 repair" [ref=e167]:
                  - link "CDU 7.0 repair" [ref=e168]:
                    - /url: /admin/cases/f5f70ba6-e646-4ab9-8aa7-7fbe218ca110
                    - generic [ref=e169]: CDU 7.0
                    - generic [ref=e170]: repair
                - cell "In Rework" [ref=e171]:
                  - link "In Rework" [ref=e172]:
                    - /url: /admin/cases/f5f70ba6-e646-4ab9-8aa7-7fbe218ca110
                - cell "In Repair" [ref=e173]:
                  - link "In Repair" [ref=e174]:
                    - /url: /admin/cases/f5f70ba6-e646-4ab9-8aa7-7fbe218ca110
                    - generic [ref=e175]: In Repair
                - cell "20 Apr 2026" [ref=e177]:
                  - link "20 Apr 2026" [ref=e178]:
                    - /url: /admin/cases/f5f70ba6-e646-4ab9-8aa7-7fbe218ca110
                - cell "View" [ref=e179]:
                  - link "View" [ref=e181]:
                    - /url: /admin/cases/f5f70ba6-e646-4ab9-8aa7-7fbe218ca110
              - row "CASE-202604-0050 Badenia 4 Porsche repair — Under Review 1 May 2026 View" [ref=e182] [cursor=pointer]:
                - cell "CASE-202604-0050" [ref=e183]:
                  - link "CASE-202604-0050" [ref=e184]:
                    - /url: /admin/cases/1daaf0d0-0bcf-4006-90fc-2155a59634c5
                - cell "Badenia 4 Porsche repair" [ref=e185]:
                  - link "Badenia 4 Porsche repair" [ref=e186]:
                    - /url: /admin/cases/1daaf0d0-0bcf-4006-90fc-2155a59634c5
                    - generic [ref=e187]: Badenia 4 Porsche
                    - generic [ref=e188]: repair
                - cell "—" [ref=e189]:
                  - link "—" [ref=e190]:
                    - /url: /admin/cases/1daaf0d0-0bcf-4006-90fc-2155a59634c5
                - cell "Under Review" [ref=e191]:
                  - link "Under Review" [ref=e192]:
                    - /url: /admin/cases/1daaf0d0-0bcf-4006-90fc-2155a59634c5
                    - generic [ref=e193]: Under Review
                - cell "1 May 2026" [ref=e195]:
                  - link "1 May 2026" [ref=e196]:
                    - /url: /admin/cases/1daaf0d0-0bcf-4006-90fc-2155a59634c5
                - cell "View" [ref=e197]:
                  - link "View" [ref=e199]:
                    - /url: /admin/cases/1daaf0d0-0bcf-4006-90fc-2155a59634c5
              - row "CASE-202604-0047 CDU 10.3 repair Final Test In Repair 21 Apr 2026 View" [ref=e200] [cursor=pointer]:
                - cell "CASE-202604-0047" [ref=e201]:
                  - link "CASE-202604-0047" [ref=e202]:
                    - /url: /admin/cases/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
                - cell "CDU 10.3 repair" [ref=e203]:
                  - link "CDU 10.3 repair" [ref=e204]:
                    - /url: /admin/cases/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
                    - generic [ref=e205]: CDU 10.3
                    - generic [ref=e206]: repair
                - cell "Final Test" [ref=e207]:
                  - link "Final Test" [ref=e208]:
                    - /url: /admin/cases/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
                - cell "In Repair" [ref=e209]:
                  - link "In Repair" [ref=e210]:
                    - /url: /admin/cases/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
                    - generic [ref=e211]: In Repair
                - cell "21 Apr 2026" [ref=e213]:
                  - link "21 Apr 2026" [ref=e214]:
                    - /url: /admin/cases/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
                - cell "View" [ref=e215]:
                  - link "View" [ref=e217]:
                    - /url: /admin/cases/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
              - row "CASE-202604-0054 CDU 10.3 repair — RMA Issued 30 Apr 2026 View" [ref=e218] [cursor=pointer]:
                - cell "CASE-202604-0054" [ref=e219]:
                  - link "CASE-202604-0054" [ref=e220]:
                    - /url: /admin/cases/aa31c984-b78d-421a-ba8d-e6766d0b1c83
                - cell "CDU 10.3 repair" [ref=e221]:
                  - link "CDU 10.3 repair" [ref=e222]:
                    - /url: /admin/cases/aa31c984-b78d-421a-ba8d-e6766d0b1c83
                    - generic [ref=e223]: CDU 10.3
                    - generic [ref=e224]: repair
                - cell "—" [ref=e225]:
                  - link "—" [ref=e226]:
                    - /url: /admin/cases/aa31c984-b78d-421a-ba8d-e6766d0b1c83
                - cell "RMA Issued" [ref=e227]:
                  - link "RMA Issued" [ref=e228]:
                    - /url: /admin/cases/aa31c984-b78d-421a-ba8d-e6766d0b1c83
                    - generic [ref=e229]: RMA Issued
                - cell "30 Apr 2026" [ref=e231]:
                  - link "30 Apr 2026" [ref=e232]:
                    - /url: /admin/cases/aa31c984-b78d-421a-ba8d-e6766d0b1c83
                - cell "View" [ref=e233]:
                  - link "View" [ref=e235]:
                    - /url: /admin/cases/aa31c984-b78d-421a-ba8d-e6766d0b1c83
              - row "CASE-202604-0051 Antares 8 TLA repair — Submitted 6 Jun 2026 Review View" [ref=e236] [cursor=pointer]:
                - cell "CASE-202604-0051" [ref=e237]:
                  - link "CASE-202604-0051" [ref=e238]:
                    - /url: /admin/cases/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
                - cell "Antares 8 TLA repair" [ref=e239]:
                  - link "Antares 8 TLA repair" [ref=e240]:
                    - /url: /admin/cases/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
                    - generic [ref=e241]: Antares 8 TLA
                    - generic [ref=e242]: repair
                - cell "—" [ref=e243]:
                  - link "—" [ref=e244]:
                    - /url: /admin/cases/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
                - cell "Submitted" [ref=e245]:
                  - link "Submitted" [ref=e246]:
                    - /url: /admin/cases/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
                    - generic [ref=e247]: Submitted
                - cell "6 Jun 2026" [ref=e249]:
                  - link "6 Jun 2026" [ref=e250]:
                    - /url: /admin/cases/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
                - cell "Review View" [ref=e251]:
                  - generic [ref=e252]:
                    - link "Review" [ref=e253]:
                      - /url: /admin/cases/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
                    - link "View" [ref=e254]:
                      - /url: /admin/cases/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
  - contentinfo [ref=e255]:
    - generic [ref=e256]:
      - generic [ref=e257]:
        - generic [ref=e258]:
          - paragraph [ref=e259]: Cosworth Electronics Ltd
          - generic [ref=e260]:
            - text: Brookfield Technology Centre
            - text: Twentypence Road, Cottenham
            - text: Cambridge, CB24 8PS
            - text: United Kingdom
        - generic [ref=e261]:
          - paragraph [ref=e262]: Cosworth Electronics LLC
          - generic [ref=e263]:
            - text: 5355 W 86th St
            - text: Indianapolis, IN 46268
            - text: United States
      - generic [ref=e264]:
        - paragraph [ref=e265]: COSWORTH® is a registered trade mark of Cosworth Group Holdings Limited
        - generic [ref=e266]:
          - link "Legal Policies" [ref=e267] [cursor=pointer]:
            - /url: "#"
          - link "User Guides" [ref=e268] [cursor=pointer]:
            - /url: "#"
  - alert [ref=e269]
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
  67 |     )).toBeVisible({ timeout: 10000 })
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
> 87 |     await expect(page.locator('text=Staff — UK')).toBeVisible({ timeout: 8000 })
     |                                                   ^ Error: expect(locator).toBeVisible() failed
  88 |   })
  89 | })
  90 | 
```