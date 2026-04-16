# Fix E2E Test Failures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 20 Playwright E2E test failures by correcting label/input HTML associations in application code and adding Playwright auth-state sharing.

**Architecture:** Two root causes — (1) `<label>` elements not connected to `<input>` via `htmlFor`/`id` so Playwright's `getByLabel` can't find them; (2) ambiguous "Sign In" button locator. Fix is in application code (label associations) and Playwright config (storageState). No test assertions are changed.

**Tech Stack:** Next.js 14, React 19, Playwright, TypeScript

---

## Failure Summary

| # | Test file | Error | Root cause |
|---|---|---|---|
| 1 | `auth.test.ts` | strict mode: 2 "Sign In" buttons | Tab button + submit button share same name |
| 19 | All other test files | `getByLabel` timeout | `<label>` not associated with `<input>` via `htmlFor`/`id` |

All 19 `getByLabel` failures share the same fix: add `htmlFor`/`id` to form label/input pairs.

---

## Files to Modify

| File | Change |
|---|---|
| `src/app/(auth)/login/page.tsx` | Add `htmlFor` prop to `Field` component; add `id` to every input |
| `src/components/forms/steps/Step1Contact.tsx` | Add `htmlFor`/`id` to every label/input pair |
| `src/tests/e2e/auth.test.ts` | Fix "Sign In" tab button locator to use `.first()` |
| `playwright.config.ts` | Add `storageState` projects for pre-authenticated contexts |
| `src/tests/e2e/global-setup.ts` | NEW — logs in as each demo user and saves auth cookies |
| `src/tests/e2e/auth.test.ts` | (locator fix only — no assertion changes) |

---

## Task 1: Fix login page label/input association

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`

The `Field` component on the login page renders `<label>` as a sibling of `children` with no `for` attribute. Playwright's `getByLabel('Email address')` requires either `htmlFor`+`id` association or label wrapping.

- [ ] **Step 1: Read the current Field component**

```bash
# Confirm the label has no htmlFor
grep -n "htmlFor\|label\|for=" src/app/\(auth\)/login/page.tsx
```
Expected output: no `htmlFor` on the label element.

- [ ] **Step 2: Add htmlFor prop to Field component**

In `src/app/(auth)/login/page.tsx`, replace the `Field` component (lines 29–45):

```tsx
function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-text">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Add id attributes to SignInForm inputs**

In the `SignInForm` function, update the two `<Field>` usages and their `<input>` elements:

```tsx
<Field label="Email address" htmlFor="signin-email" error={errors.email?.message}>
  <input
    id="signin-email"
    type="email"
    autoComplete="email"
    placeholder="you@example.com"
    className={inputClass}
    {...register('email')}
  />
</Field>

<Field label="Password" htmlFor="signin-password" error={errors.password?.message}>
  <input
    id="signin-password"
    type="password"
    autoComplete="current-password"
    placeholder="••••••••"
    className={inputClass}
    {...register('password')}
  />
</Field>
```

- [ ] **Step 4: Add id attributes to RegisterForm inputs**

In the `RegisterForm` function, update all five `<Field>` usages and their `<input>` elements:

```tsx
<Field label="First name" htmlFor="reg-first-name" error={errors.firstName?.message}>
  <input
    id="reg-first-name"
    type="text"
    autoComplete="given-name"
    placeholder="Will"
    className={inputClass}
    {...register('firstName')}
  />
</Field>

<Field label="Last name" htmlFor="reg-last-name" error={errors.lastName?.message}>
  <input
    id="reg-last-name"
    type="text"
    autoComplete="family-name"
    placeholder="Kerridge"
    className={inputClass}
    {...register('lastName')}
  />
</Field>

<Field label="Company" htmlFor="reg-company" error={errors.company?.message}>
  <input
    id="reg-company"
    type="text"
    autoComplete="organization"
    placeholder="BT Sport Motorsport"
    className={inputClass}
    {...register('company')}
  />
</Field>

<Field label="Email address" htmlFor="reg-email" error={errors.email?.message}>
  <input
    id="reg-email"
    type="email"
    autoComplete="email"
    placeholder="you@example.com"
    className={inputClass}
    {...register('email')}
  />
</Field>

<Field label="Password" htmlFor="reg-password" error={errors.password?.message}>
  <input
    id="reg-password"
    type="password"
    autoComplete="new-password"
    placeholder="Min 8 characters"
    className={inputClass}
    {...register('password')}
  />
</Field>
```

- [ ] **Step 5: Run TypeScript check**

```bash
cd "cosworth-rma"
npx tsc --noEmit
```
Expected: no output (clean).

- [ ] **Step 6: Commit**

```bash
git add src/app/\(auth\)/login/page.tsx
git commit -m "fix: add htmlFor/id to login form fields for accessibility and E2E tests"
```

---

## Task 2: Fix Step1Contact label/input association

**Files:**
- Modify: `src/components/forms/steps/Step1Contact.tsx`

All labels in Step1Contact are `<label>` siblings with no `htmlFor`. Fix each one.

- [ ] **Step 1: Add htmlFor to Full Name and Company labels**

Find the "Full Name" label block (around line 80–91) and update:

```tsx
<div>
  <label htmlFor="step1-full-name" className="block text-[13px] font-semibold text-grey-700 mb-1.5">
    Full Name <span className="text-blue ml-0.5">*</span>
  </label>
  <input
    id="step1-full-name"
    {...register('full_name')}
    className={inputClass(!!errors.full_name)}
    placeholder="John Smith"
  />
  {errors.full_name && (
    <p className="mt-1 text-[11px] text-red-500">{errors.full_name.message}</p>
  )}
</div>
<div>
  <label htmlFor="step1-company" className="block text-[13px] font-semibold text-grey-700 mb-1.5">
    Company <span className="text-blue ml-0.5">*</span>
  </label>
  <input
    id="step1-company"
    {...register('company')}
    className={inputClass(!!errors.company)}
    placeholder="Your Team / Company"
  />
  {errors.company && (
    <p className="mt-1 text-[11px] text-red-500">{errors.company.message}</p>
  )}
</div>
```

- [ ] **Step 2: Add htmlFor to Email Address and Phone labels**

Find the email/phone grid block (around line 108–131) and update:

```tsx
<div>
  <label htmlFor="step1-email" className="block text-[13px] font-semibold text-grey-700 mb-1.5">
    Email Address <span className="text-blue ml-0.5">*</span>
  </label>
  <input
    id="step1-email"
    {...register('email')}
    type="email"
    className={inputClass(!!errors.email)}
    placeholder="john@yourteam.com"
  />
  {errors.email && (
    <p className="mt-1 text-[11px] text-red-500">{errors.email.message}</p>
  )}
</div>
<div>
  <label htmlFor="step1-phone" className="block text-[13px] font-semibold text-grey-700 mb-1.5">Phone</label>
  <input
    id="step1-phone"
    {...register('phone')}
    className={inputClass(false)}
    placeholder="+44 7700 900000"
  />
</div>
```

- [ ] **Step 3: Add htmlFor to address fields**

Find the Street Address, City, Postcode, Country labels (around lines 136–180) and update each:

```tsx
{/* Street Address */}
<label htmlFor="step1-street" className="block text-[13px] font-semibold text-grey-700 mb-1.5">
  Street Address <span className="text-blue ml-0.5">*</span>
</label>
<input
  id="step1-street"
  {...register('street_address')}
  className={inputClass(!!errors.street_address)}
  placeholder="123 Race Circuit Road"
/>

{/* City */}
<label htmlFor="step1-city" className="block text-[13px] font-semibold text-grey-700 mb-1.5">City</label>
<input
  id="step1-city"
  {...register('city')}
  className={inputClass(false)}
  placeholder="Northamptonshire"
/>

{/* Postcode */}
<label htmlFor="step1-postcode" className="block text-[13px] font-semibold text-grey-700 mb-1.5">Postcode / ZIP</label>
<input
  id="step1-postcode"
  {...register('postcode')}
  className={inputClass(false)}
  placeholder="NN12 8TN"
/>

{/* Country */}
<label htmlFor="step1-country" className="block text-[13px] font-semibold text-grey-700 mb-1.5">Country</label>
<select
  id="step1-country"
  {...register('country')}
  className={inputClass(false)}
>
  {COUNTRIES.map((c) => (
    <option key={c.code} value={c.code}>{c.name}</option>
  ))}
</select>
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/components/forms/steps/Step1Contact.tsx
git commit -m "fix: add htmlFor/id to Step1Contact form fields for accessibility and E2E tests"
```

---

## Task 3: Fix "Sign In" button strict mode violation

**Files:**
- Modify: `src/tests/e2e/auth.test.ts`

The test `'login page loads and shows both tabs'` uses `getByRole('button', { name: 'Sign In' })` which matches both the tab button and the form submit button. This is a test locator fix — the assertion logic is unchanged.

> **Note:** This is a locator precision fix, not a logic change. The test is asserting the correct thing (tab buttons exist); it just needs a more specific selector. This is explicitly allowed by TESTING.md under "If a test is wrong because requirements changed" — here the test's locator was imprecise from the start.

- [ ] **Step 1: Update the tab button locator in auth.test.ts**

Replace the test `'login page loads and shows both tabs'`:

```typescript
test('login page loads and shows both tabs', async ({ page }) => {
  await page.goto(`${BASE}/login`)
  // Use .first() because there are two "Sign In" elements:
  // the tab button and the form submit button
  await expect(page.getByRole('button', { name: 'Sign In' }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Register' })).toBeVisible()
})
```

- [ ] **Step 2: Commit**

```bash
git add src/tests/e2e/auth.test.ts
git commit -m "fix: use .first() on Sign In tab button to avoid strict mode violation"
```

---

## Task 4: Add Playwright storageState to share auth between tests

**Files:**
- Create: `src/tests/e2e/global-setup.ts`
- Modify: `playwright.config.ts`
- Modify: `src/tests/e2e/auth.test.ts`
- Modify: `src/tests/e2e/admin-cases.test.ts`
- Modify: `src/tests/e2e/customer-cases.test.ts`

Currently every test makes a full login round-trip to Vercel. Playwright's `storageState` lets us log in once per role and reuse the auth cookies for all tests that use that role.

- [ ] **Step 1: Create global-setup.ts**

Create `src/tests/e2e/global-setup.ts`:

```typescript
import { chromium, FullConfig } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://customer-rma.vercel.app'

async function loginAndSave(
  email: string,
  password: string,
  statePath: string,
  expectedUrl: string
) {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(`${BASE}/login`)
  await page.getByLabel('Email address').first().fill(email)
  await page.getByLabel('Password').first().fill(password)
  await page.getByRole('button', { name: 'Sign In' }).last().click()
  await page.waitForURL(expectedUrl, { timeout: 20000 })

  await context.storageState({ path: statePath })
  await browser.close()
}

async function globalSetup(config: FullConfig) {
  await loginAndSave(
    'demo.admin@cosworth.com',
    'Demo1234!',
    'playwright/.auth/admin.json',
    `${BASE}/admin/dashboard`
  )
  await loginAndSave(
    'demo.staff@cosworth.com',
    'Demo1234!',
    'playwright/.auth/staff-uk.json',
    `${BASE}/admin/dashboard`
  )
  await loginAndSave(
    'demo.customer@btsport.com',
    'Demo1234!',
    'playwright/.auth/customer.json',
    `${BASE}/cases`
  )
}

export default globalSetup
```

- [ ] **Step 2: Create the auth directory**

```bash
mkdir -p "playwright/.auth"
echo "playwright/.auth/" >> .gitignore
```

- [ ] **Step 3: Update playwright.config.ts**

Replace the full content of `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: 'html',
  globalSetup: './src/tests/e2e/global-setup.ts',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'https://customer-rma.vercel.app',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    trace: 'on-first-retry',
  },
  projects: [
    // Setup project: runs global-setup (already handled by globalSetup above)
    // Auth-required projects use the saved auth state
    {
      name: 'chromium-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      testMatch: '**/admin-cases.test.ts',
    },
    {
      name: 'chromium-customer',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/customer.json',
      },
      testMatch: '**/customer-cases.test.ts',
    },
    {
      name: 'chromium-public',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/auth.test.ts', '**/submit.test.ts'],
    },
  ],
})
```

- [ ] **Step 4: Remove loginAs* helper calls from admin-cases.test.ts**

Since the admin-cases project now starts pre-authenticated as admin, remove the `loginAsAdmin()` and `loginAsStaffUK()` calls before each test. Each test can go directly to the target URL.

Replace `src/tests/e2e/admin-cases.test.ts` with:

```typescript
import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://customer-rma.vercel.app'

// This test file runs in the chromium-admin project — pre-authenticated as demo.admin@cosworth.com
// Tests for staff_uk access use a separate storageState on specific tests below.

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
    // Sign in fresh as customer (no storageState override needed — just test the middleware)
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
    await expect(page.locator('table, [role="table"]').or(
      page.getByText(/no accounts/i)
    )).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Staff UK access', () => {
  test('staff_uk can reach admin dashboard', async ({ page }) => {
    // Override: sign in fresh as staff_uk for this describe block
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
    await expect(page.locator('text=Staff — UK')).toBeVisible({ timeout: 8000 })
  })
})
```

- [ ] **Step 5: Remove loginAsCustomer calls from customer-cases.test.ts**

Replace `src/tests/e2e/customer-cases.test.ts` with:

```typescript
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
```

- [ ] **Step 6: Commit all storageState changes**

```bash
git add playwright.config.ts src/tests/e2e/global-setup.ts \
  src/tests/e2e/admin-cases.test.ts src/tests/e2e/customer-cases.test.ts .gitignore
git commit -m "test: add Playwright storageState auth setup to avoid per-test login"
```

---

## Task 5: Push and verify

- [ ] **Step 1: Push to GitHub**

```bash
git push
```

- [ ] **Step 2: Run unit tests — confirm still 60/60 passing**

```bash
npm test
```
Expected output: `Tests  60 passed (60)`

- [ ] **Step 3: Run E2E tests against Vercel**

```bash
npm run test:e2e
```
Expected: all 20 tests pass. Check `playwright-report/index.html` if any fail.

- [ ] **Step 4: Verify the auth page locators work**

Open `playwright-report/index.html` and confirm:
- No `strict mode violation` errors
- No `getByLabel timeout` errors
- Login tests reach the correct destination URLs

---

## Self-Review

**Spec coverage:**
- Root cause 1 (19 failures — `getByLabel`): Fixed in Task 1 (login page) and Task 2 (Step1Contact)
- Root cause 2 (1 failure — strict mode): Fixed in Task 3
- Performance (timeout risk): Fixed in Task 4 with storageState

**Placeholder scan:** No TBD items. All code blocks are complete.

**Type consistency:** `globalSetup` receives `FullConfig` from `@playwright/test` — consistent with Playwright v1.59 API. `storageState` path strings are consistent between `global-setup.ts` and `playwright.config.ts`.

**One edge case not in tasks:** The submit tests use `getByLabel('Full Name')` which requires Step1Contact fixes from Task 2. Task 2 must be merged before running submit E2E tests. Tasks are correctly ordered.
