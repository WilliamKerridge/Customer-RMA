# Cosworth Electronics — RMA Portal
## Testing & Security Audit Guide

> **Critical Rule — Non-Negotiable:**
> Claude Code must **never modify a test to make it pass**. If a test is failing, Claude must read the application code and fix the underlying issue. Tests are the source of truth. If you ever see Claude suggest changing an assertion, removing a test, or adjusting expected values to match broken behaviour — reject it and ask Claude to fix the code instead.

---

## Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Test Setup](#2-test-setup)
3. [Unit Tests](#3-unit-tests)
4. [Integration Tests](#4-integration-tests)
5. [End-to-End Tests](#5-end-to-end-tests)
6. [Security Audit Checklist](#6-security-audit-checklist)
7. [RLS Policy Tests](#7-rls-policy-tests)
8. [Payment Security Tests](#8-payment-security-tests)
9. [Running the Full Test Suite](#9-running-the-full-test-suite)
10. [Claude Code Testing Rules](#10-claude-code-testing-rules)
11. [Pre-Deployment Checklist](#11-pre-deployment-checklist)

---

## 1. Testing Philosophy

### What We Are Protecting

This application handles:
- **Customer personal data** — names, addresses, company information
- **Commercial data** — SAP order numbers, repair values, PO references
- **Access control** — customers must only see their own cases; UK staff must not see US cases without admin rights
- **Payment flows** — even in stub mode, payment status must be tamper-proof
- **RMA approval** — only authorised staff can issue RMA numbers
- **Sensitive labels** — `CREDIT_HELD` must never reach a customer-facing response

Any failure in these areas is not just a bug — it is a data breach or a commercial risk.

### The Three Layers of Testing

```
┌─────────────────────────────────────┐
│  E2E Tests (Playwright)             │  Full user journeys in a real browser
│  - Submit → track → admin approve   │
│  - Hold state → customer response   │
│  - Payment stub flow                │
├─────────────────────────────────────┤
│  Integration Tests (Vitest)         │  API routes with real Supabase (test DB)
│  - RLS enforcement                  │
│  - Auth middleware                  │
│  - Case creation logic              │
│  - Stage/hold transitions           │
├─────────────────────────────────────┤
│  Unit Tests (Vitest)                │  Pure functions, no external dependencies
│  - Zod schemas                      │
│  - Case number generation           │
│  - Stage mapper                     │
│  - Token generation/validation      │
│  - Payment mode logic               │
└─────────────────────────────────────┘
```

### Testing Rules for Claude Code

Before starting testing phases, give Claude Code this instruction and keep it in place for the entire session:

```
TESTING RULES — These apply for the entire session with no exceptions:

1. Never modify a test file to make a test pass. If a test fails, read the application code and fix the bug there.
2. Never change an expected value in a test assertion to match incorrect behaviour.
3. Never skip, comment out, or remove a failing test.
4. Never use .only() or .skip() to hide failing tests before committing.
5. If a test is wrong because the requirement changed, tell me explicitly and wait for my approval before changing it.
6. When a test fails, your first response must be to explain what the test is checking and why the application code is not meeting that expectation.
```

---

## 2. Test Setup

### Prompt 2.1 — Install Testing Dependencies

Give this to Claude Code:

```
Install and configure the testing stack for the Cosworth RMA Portal.

Install these packages:
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D playwright @playwright/test
npm install -D msw
npm install -D @faker-js/faker

Configure vitest in vitest.config.ts:
- Environment: jsdom for component tests
- Setup file: src/tests/setup.ts
- Coverage provider: v8
- Coverage thresholds: statements 80%, branches 75%, functions 80%, lines 80%
- Exclude: node_modules, .next, playwright tests
- Include: src/**/*.{test,spec}.{ts,tsx}

Configure Playwright in playwright.config.ts:
- Base URL: http://localhost:3000
- Browsers: Chromium only for demo (can add Firefox and WebKit later)
- Test directory: src/tests/e2e
- Screenshot on failure
- Video on failure
- Trace on first retry
- Use test.describe for grouping
- Global setup: src/tests/e2e/global-setup.ts (seeds demo data)

Create src/tests/setup.ts:
- Import @testing-library/jest-dom
- Mock Next.js navigation (useRouter, usePathname, redirect)
- Mock the Supabase client with a factory that can be configured per test
- Set environment variables for tests: PAYMENT_MODE=stub, test Supabase credentials

Create src/tests/helpers/supabase-test-client.ts:
- A Supabase client pointing at the test database (separate from dev/prod)
- Helper functions: createTestUser(role), createTestCase(overrides), createTestProduct(), cleanupTestData()
- All test data uses a TEST_ prefix on case numbers so it can be cleaned up safely

Create src/tests/helpers/auth-helpers.ts:
- signInAs(role: 'customer' | 'staff_uk' | 'staff_us' | 'admin'): returns a session token for use in API tests
- getTestUser(role): returns the test user object

Add these scripts to package.json:
- "test": "vitest run"
- "test:watch": "vitest"
- "test:ui": "vitest --ui"
- "test:coverage": "vitest run --coverage"
- "test:e2e": "playwright test"
- "test:e2e:ui": "playwright test --ui"
- "test:all": "vitest run && playwright test"
```

**Verify:** Run `npm test` — should find 0 tests and exit cleanly. Run `npm run test:e2e` — Playwright should install browsers and exit.

---

### Prompt 2.2 — Test Environment Setup

```
Create a separate test environment configuration.

Create .env.test:
NEXT_PUBLIC_SUPABASE_URL=[your supabase test project URL or same project with test schema]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[test anon key]
SUPABASE_SERVICE_ROLE_KEY=[test service role key]
BETTER_AUTH_SECRET=test_secret_32_chars_minimum_here
BETTER_AUTH_URL=http://localhost:3000
RESEND_API_KEY=test_key_emails_disabled_in_test
STRIPE_SECRET_KEY=sk_test_[your test key]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_[your test key]
STRIPE_WEBHOOK_SECRET=whsec_test_placeholder
PAYMENT_MODE=stub
UK_RETURNS_EMAIL=test-returns@cosworth-test.com
US_SALES_EMAIL=test-us@cosworth-test.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

Important: In tests, never send real emails. Create src/lib/__mocks__/email.ts that exports all the same functions as src/lib/email.ts but they are all jest.fn() mocks that return a resolved promise. Vitest will automatically use this mock when you call vi.mock('src/lib/email').

Create a test database setup script at supabase/test-seed.sql that:
- Creates the same schema as production
- Seeds minimal test data: 4 test users (one per role), 10 test products, 2 test cases
- All test case numbers start with TEST- so they can be identified and cleaned up
```

---

## 3. Unit Tests

### Prompt 3.1 — Schema Validation Tests

```
Create unit tests for all Zod validation schemas used in the application.

Create src/tests/unit/schemas.test.ts

Test the case submission schema (src/lib/schemas/case.ts):

describe('CaseSubmissionSchema') with these tests:
- 'rejects submission with no office selected'
- 'rejects submission with no products'
- 'rejects submission with empty fault description when fault_type is repair'
- 'accepts valid repair submission with all required fields'
- 'accepts valid service submission without fault description'
- 'rejects required_return_date in the past'
- 'rejects invalid fault_type value'
- 'rejects email in wrong format'
- 'rejects submission with product that has no part_number'

Test the stage update schema:
- 'rejects invalid workshop stage value'
- 'accepts all valid WorkshopStage enum values'

Test the hold state schema:
- 'rejects AWAITING_CUSTOMER hold without a question'
- 'accepts AWAITING_CUSTOMER hold with a non-empty question'
- 'accepts AWAITING_PARTS hold without a question'
- 'rejects hold_reason not in the HoldReason enum'

Test the token response schema:
- 'rejects response with fewer than 3 characters'
- 'rejects empty response'
- 'accepts valid response text'

All tests must use actual schema imports — never mock the schemas themselves.
Each test must have a clear description of what it is checking.
Each failing case must assert both that the result is not successful AND that the error path contains the expected field name.
```

---

### Prompt 3.2 — Business Logic Tests

```
Create unit tests for core business logic functions.

Create src/tests/unit/case-number.test.ts:
Test generate_case_number logic (mock the DB call, test the formatting):
- 'generates case number in CASE-YYYYMM-XXXX format'
- 'generates RMA number in RMA-YYYYMM-XXXX format'
- 'generates INT number in INT-YYYYMM-XXXX format'
- 'zero-pads sequence number to 4 digits'
- 'uses current year and month in the number'

Create src/tests/unit/stage-mapper.test.ts:
Test the Planner bucket to portal stage mapping (src/lib/import/stage-mapper.ts):
- 'maps "Awaiting test" to AWAITING_TEST workshop stage'
- 'maps "Re-test" to RETEST workshop stage'
- 'maps "Rework" to REWORK workshop stage'
- 'maps "Final test" to FINAL_TEST workshop stage'
- 'maps "Clean and label" to CLEAN_AND_LABEL workshop stage'
- 'maps "Inspection" to INSPECTION workshop stage'
- 'maps "Completed" to WORKSHOP_COMPLETE workshop stage'
- 'maps "Awaiting parts" to AWAITING_PARTS hold state'
- 'maps "With support" to WITH_SUPPORT hold state'
- 'maps "With engineering" to WITH_ENGINEERING hold state'
- 'maps "Awaiting confirmation customer" to AWAITING_CUSTOMER hold state'
- 'maps "Credit held" to CREDIT_HELD hold state'
- 'is case-insensitive for all mappings'
- 'returns null for unrecognised bucket names'
- 'never returns CREDIT_HELD as a workshop stage'

Create src/tests/unit/tokens.test.ts:
Test the token generation and validation logic (src/lib/tokens.ts):
- 'generates a 64-character hex token'
- 'generates unique tokens on each call'
- 'validates a token that exists and is not expired'
- 'rejects a token that has already been used'
- 'rejects a token past its expiry date'
- 'rejects a token for a different case_id than expected'
- 'marks token as used after successful validation'

Create src/tests/unit/payment.test.ts:
Test payment mode switching (src/lib/payment.ts):
- 'returns stub response when PAYMENT_MODE=stub'
- 'calls sendPaymentStubNotification when PAYMENT_MODE=stub'
- 'does not call Stripe when PAYMENT_MODE=stub'
- 'calls Stripe PaymentIntent when PAYMENT_MODE=stripe'
- 'does not call sendPaymentStubNotification when PAYMENT_MODE=stripe'
- 'isPaymentRequired returns true when customer has no credit_terms'
- 'isPaymentRequired returns true for guest (null account)'
- 'isPaymentRequired returns false when customer has credit_terms=true'

Create src/tests/unit/fee-columns.test.ts:
Test that fee column names match the database schema:
- 'products table uses test_fee not inspection_fee'
- 'products table uses standard_repair_fee not repair_fee_estimate'
- 'products table uses major_repair_fee not service_fee'
- 'case_products table uses test_fee_applied not inspection_fee_applied'

Create src/tests/unit/hold-labels.test.ts:
CRITICAL — Test that sensitive hold reasons are never exposed to customers:
- 'CREDIT_HELD maps to "On Hold — Please Contact Us" customer label'
- 'CREDIT_HELD customer label does not contain the word "credit"'
- 'CREDIT_HELD customer label does not contain the word "held"'
- 'CREDIT_HELD customer label does not contain any financial terminology'
- 'all hold reasons have a defined customer label'
- 'no customer label exposes internal system terminology'
```

**Verify:** Run `npm test` — all unit tests should pass. If any fail, fix the application code — do not change the tests.

---

## 4. Integration Tests

### Prompt 4.1 — API Route Tests

```
Create integration tests for the API routes. These tests call the actual route handlers with a test Supabase database.

Create src/tests/integration/api/cases.test.ts:

Use vitest with the test Supabase client. For each test: create required test data before the test and clean up after.

Test POST /api/cases (case submission):
- 'creates a case with correct case_number format'
- 'creates case_product records for each submitted product'
- 'sets payment_status to stub_notified when PAYMENT_MODE=stub and credit_terms=false'
- 'sets payment_required=false for customer with credit_terms=true'
- 'returns 401 when no auth and no guest email provided'
- 'rejects submission with invalid fault_type'
- 'rejects submission with no products'
- 'rejects submission with required_return_date in the past'
- 'sets correct office on the case'

Test POST /api/cases/[caseId]/approve:
- 'issues RMA number in correct format when called by staff_uk'
- 'sets status to RMA_ISSUED'
- 'creates a case_update record'
- 'returns 403 when called by a customer'
- 'returns 403 when called by staff_us on a UK case'
- 'returns 404 for a case that does not exist'
- 'returns 409 if the case is already approved'

Test POST /api/cases/[caseId]/reject:
- 'sets status to REJECTED when called by staff'
- 'requires a reason to be provided'
- 'creates a customer-visible case_update with the reason'
- 'returns 403 when called by a customer'

Test PATCH /api/cases/[caseId]/stage:
- 'updates workshop_stage to the new value'
- 'sets status to IN_REPAIR if not already'
- 'creates a non-internal case_update'
- 'rejects invalid stage values'
- 'returns 403 when called by a customer'

Test POST /api/cases/[caseId]/hold:
- 'sets is_on_hold=true and hold_reason correctly'
- 'generates a response token when hold_reason is AWAITING_CUSTOMER'
- 'requires awaiting_customer_question when hold_reason is AWAITING_CUSTOMER'
- 'does not generate a token for non-AWAITING_CUSTOMER holds'
- 'returns 403 when called by a customer'
- 'sets hold_customer_label to correct value for each hold reason'

CRITICAL TEST:
- 'never sets hold_customer_label to contain "credit" or "held" when hold_reason is CREDIT_HELD'
- 'CREDIT_HELD response body never contains the string "credit held" in any field'

Test DELETE /api/cases/[caseId]/hold:
- 'clears is_on_hold, hold_reason, hold_customer_label, awaiting_customer_question'
- 'creates a non-internal case_update confirming hold is cleared'
- 'returns 403 when called by a customer'

Test POST /api/cases/[caseId]/respond:
- 'accepts response with valid session token from the case owner'
- 'accepts response with valid response token (no session required)'
- 'rejects expired response tokens'
- 'rejects already-used response tokens'
- 'rejects response token belonging to a different case'
- 'clears the hold state after successful response'
- 'marks the response token as used'
- 'creates a non-internal case_update with the response content'
- 'rejects response shorter than 3 characters'
- 'returns 403 when session belongs to a different customer'
```

---

### Prompt 4.2 — Row Level Security Tests

```
Create tests that specifically verify Supabase Row Level Security policies are enforced correctly.

These tests MUST use the Supabase client authenticated as the test user (not the service role) to ensure RLS is actually evaluated.

Create src/tests/integration/rls/cases-rls.test.ts:

CUSTOMER ACCESS RULES:
- 'customer can read their own cases'
- 'customer cannot read another customer's cases' — query for a case belonging to a different user, assert empty result
- 'customer cannot read internal case updates (is_internal=true)'
- 'customer can read their own non-internal case updates'
- 'customer cannot update case status directly via Supabase client'
- 'customer cannot update rma_number directly via Supabase client'
- 'customer cannot update payment_status directly via Supabase client'
- 'customer cannot update hold_reason directly via Supabase client'
- 'customer cannot delete a case'

STAFF ACCESS RULES:
- 'staff_uk can read UK cases'
- 'staff_uk cannot read US cases' — assert empty result
- 'staff_us can read US cases'
- 'staff_us cannot read UK cases' — assert empty result
- 'staff_uk can read all case_updates for UK cases including internal'
- 'staff can update workshop_stage'
- 'staff can update is_on_hold'
- 'staff cannot update rma_number directly — only via the approve API route'

ADMIN ACCESS RULES:
- 'admin can read all cases regardless of office'
- 'admin can read all case_updates'

HOLD LABEL SECURITY:
- 'customer querying their own case with CREDIT_HELD hold cannot see hold_reason column'
  Assert that the hold_reason field is null or not returned when queried as the case-owning customer
  This verifies RLS column-level security or API-level filtering is working

PRODUCT ACCESS:
- 'unauthenticated user can read active products'
- 'unauthenticated user cannot read inactive products'
- 'unauthenticated user cannot insert a product'
- 'customer cannot insert a product'
- 'staff can insert and update products'
```

---

## 5. End-to-End Tests

### Prompt 5.1 — Core Journey E2E Tests

```
Create Playwright end-to-end tests covering the four demo flows.

Create src/tests/e2e/global-setup.ts:
- Run before all E2E tests
- Reset the test database to a known state using the test seed data
- Create the four demo test user accounts in Supabase Auth if they don't exist
- Set all demo user passwords to the test password

Create src/tests/e2e/helpers.ts:
- loginAs(page, role): navigates to /login and logs in as the test user for that role
- logout(page): logs out the current user
- getByTestId(page, id): wrapper for page.getByTestId()
- waitForToast(page, text): waits for a toast notification containing text

Add data-testid attributes to all key UI elements (ask Claude Code to add these when building components). Convention: data-testid="[component]-[element]", e.g. data-testid="case-card-0047", data-testid="submit-btn", data-testid="stage-btn-FINAL_TEST".

Create src/tests/e2e/01-submit-return.spec.ts:

test('customer can submit a repair return and receive a case ID', async ({ page }) => {
  await loginAs(page, 'customer')
  await page.goto('/submit')
  // Step 1 — contact details pre-filled
  await expect(page.getByTestId('field-fullname')).toHaveValue('Will Kerridge')
  await page.getByTestId('btn-next').click()
  // Step 2 — select UK office
  await page.getByTestId('office-uk').click()
  await page.getByTestId('field-required-date').fill('2026-06-01')
  await page.getByTestId('btn-next').click()
  // Step 3 — add a product
  await page.getByTestId('product-select-0').selectOption({ label: 'CDU 10.3' })
  await page.getByTestId('field-serial-0').fill('TEST-SERIAL-001')
  await page.getByTestId('btn-next').click()
  // Step 4 — fault details
  await page.getByTestId('fault-type-repair').click()
  await page.getByTestId('field-fault-description').fill('Display showing blank screen on startup')
  await page.getByTestId('btn-next').click()
  // Step 5 — review and submit
  await expect(page.getByText('CDU 10.3')).toBeVisible()
  await expect(page.getByText('Credit Terms')).toBeVisible()
  await page.getByTestId('btn-submit').click()
  // Success page
  await expect(page).toHaveURL(/\/submit\/success/)
  await expect(page.getByTestId('case-id-display')).toContainText('CASE-')
})

test('guest can submit a return and sees payment stub notice', async ({ page }) => {
  await page.goto('/submit')
  // Fill step 1 as guest
  await page.getByTestId('field-fullname').fill('Test Guest')
  await page.getByTestId('field-email').fill('testguest@example.com')
  await page.getByTestId('field-company').fill('Test Company')
  // Complete remaining steps...
  // On success page: payment stub notice should be visible
  await expect(page.getByTestId('payment-stub-notice')).toBeVisible()
  await expect(page.getByTestId('payment-stub-notice')).toContainText('contact you within 24 hours')
})
```

---

### Prompt 5.2 — Case Tracking E2E Tests

```
Create src/tests/e2e/02-case-tracking.spec.ts:

test('customer can see their cases on the case list', async ({ page }) => {
  await loginAs(page, 'customer')
  await page.goto('/cases')
  await expect(page.getByTestId('case-card-202604-0047')).toBeVisible()
  await expect(page.getByText('In Repair')).toBeVisible()
})

test('customer can view case detail with workshop stage tracker', async ({ page }) => {
  await loginAs(page, 'customer')
  await page.goto('/cases/[TEST_CASE_ID_IN_REPAIR]')
  // Workshop tracker visible
  await expect(page.getByTestId('workshop-stage-tracker')).toBeVisible()
  // Workshop stage tracker visible (Planner stages only — no SAP milestone tier on customer view)
  await expect(page.getByTestId('workshop-stage-tracker')).toBeVisible()
  // Current stage highlighted
  await expect(page.getByTestId('stage-btn-FINAL_TEST')).toHaveClass(/active/)
  // Reference boxes visible
  await expect(page.getByTestId('ref-case-id')).toContainText('CASE-')
  await expect(page.getByTestId('ref-rma-number')).toContainText('RMA-')
})

test('customer cannot view another customer case', async ({ page }) => {
  await loginAs(page, 'customer')
  // Attempt to navigate to a case belonging to a different customer
  await page.goto('/cases/[CASE_ID_BELONGING_TO_OTHER_CUSTOMER]')
  // Should redirect or show not found
  await expect(page).toHaveURL(/\/cases$|\/not-found/)
})

test('customer does not see internal case updates', async ({ page }) => {
  await loginAs(page, 'customer')
  await page.goto('/cases/[TEST_CASE_ID_WITH_INTERNAL_UPDATES]')
  // Internal update content should not be visible
  await expect(page.getByText('INTERNAL NOTE TEXT')).not.toBeVisible()
  // Non-internal update should be visible  
  await expect(page.getByText('CUSTOMER VISIBLE UPDATE TEXT')).toBeVisible()
})

CRITICAL TEST:
test('customer with CREDIT_HELD case does not see credit hold reason', async ({ page }) => {
  await loginAs(page, 'customer')
  await page.goto('/cases/[CASE_ID_WITH_CREDIT_HELD]')
  // The visible hold label should be the neutral version
  await expect(page.getByTestId('hold-banner')).toContainText('Please Contact Us')
  // The actual hold reason must never appear on the page
  await expect(page.locator('body')).not.toContainText('Credit Held')
  await expect(page.locator('body')).not.toContainText('credit held')
  await expect(page.locator('body')).not.toContainText('CREDIT_HELD')
})
```

---

### Prompt 5.3 — Admin Flow E2E Tests

```
Create src/tests/e2e/03-admin-flows.spec.ts:

test('staff_uk can approve a submitted case and RMA is issued', async ({ page }) => {
  await loginAs(page, 'staff_uk')
  await page.goto('/admin/dashboard')
  // Find a submitted case and approve it
  await page.getByTestId('btn-approve-[TEST_SUBMITTED_CASE_ID]').click()
  // Confirmation dialog if present
  // After approval: RMA number should appear
  await expect(page.getByTestId('ref-rma-number')).not.toContainText('Pending')
  await expect(page.getByTestId('ref-rma-number')).toContainText('RMA-')
})

test('staff_uk cannot see US cases', async ({ page }) => {
  await loginAs(page, 'staff_uk')
  await page.goto('/admin/dashboard')
  // US cases should not appear in the queue
  await expect(page.getByTestId('case-row-[US_CASE_ID]')).not.toBeVisible()
})

test('staff_uk can advance workshop stage', async ({ page }) => {
  await loginAs(page, 'staff_uk')
  await page.goto('/admin/cases/[TEST_CASE_ID]')
  await page.getByTestId('stage-btn-REWORK').click()
  await expect(page.getByTestId('stage-btn-REWORK')).toHaveClass(/active/)
})

test('admin can see all cases regardless of office', async ({ page }) => {
  await loginAs(page, 'admin')
  await page.goto('/admin/dashboard')
  // Both UK and US cases should be visible
  await expect(page.getByTestId('case-row-[UK_CASE_ID]')).toBeVisible()
  await expect(page.getByTestId('case-row-[US_CASE_ID]')).toBeVisible()
})

test('customer cannot access admin routes', async ({ page }) => {
  await loginAs(page, 'customer')
  await page.goto('/admin/dashboard')
  // Should redirect to login or show 403
  await expect(page).not.toHaveURL('/admin/dashboard')
})

test('unauthenticated user cannot access admin routes', async ({ page }) => {
  await page.goto('/admin/dashboard')
  await expect(page).toHaveURL(/\/login/)
})
```

---

### Prompt 5.4 — Action Required E2E Tests

```
Create src/tests/e2e/04-hold-and-response.spec.ts:

test('staff can set AWAITING_CUSTOMER hold and customer sees Action Required banner', async ({ browser }) => {
  // Two browser contexts: staff and customer
  const staffContext = await browser.newContext()
  const customerContext = await browser.newContext()
  const staffPage = await staffContext.newPage()
  const customerPage = await customerContext.newPage()

  // Staff sets hold
  await loginAs(staffPage, 'staff_uk')
  await staffPage.goto('/admin/cases/[TEST_CASE_ID]')
  await staffPage.getByTestId('hold-select').selectOption('AWAITING_CUSTOMER')
  await staffPage.getByTestId('hold-question-input').fill('Please confirm if you want us to replace the connector for £85+VAT')
  await staffPage.getByTestId('btn-set-hold').click()
  await expect(staffPage.getByTestId('hold-status-bar')).toBeVisible()

  // Customer sees Action Required banner
  await loginAs(customerPage, 'customer')
  await customerPage.goto('/cases/[TEST_CASE_ID]')
  await expect(customerPage.getByTestId('hold-banner')).toBeVisible()
  await expect(customerPage.getByTestId('hold-banner')).toContainText('Action Required')
  await expect(customerPage.getByTestId('hold-banner')).toContainText('Please confirm if you want us to replace the connector')

  await staffContext.close()
  await customerContext.close()
})

test('customer can respond to Action Required via portal', async ({ page }) => {
  await loginAs(page, 'customer')
  await page.goto('/cases/[TEST_CASE_ID_WITH_AWAITING_CUSTOMER_HOLD]')
  await expect(page.getByTestId('hold-banner')).toBeVisible()
  await page.getByTestId('response-textarea').fill('Yes please proceed with the additional repair')
  await page.getByTestId('btn-send-response').click()
  // Success message shown
  await expect(page.getByTestId('response-success-msg')).toBeVisible()
  // Hold banner should disappear after response
  await page.reload()
  await expect(page.getByTestId('hold-banner')).not.toBeVisible()
})

test('tokenised response link works without login', async ({ page }) => {
  // Use a pre-generated test token
  await page.goto('/cases/[TEST_CASE_ID]/respond?token=[VALID_TEST_TOKEN]')
  await expect(page).not.toHaveURL('/login')
  await expect(page.getByTestId('token-response-form')).toBeVisible()
  await page.getByTestId('response-textarea').fill('Please proceed with the repair')
  await page.getByTestId('btn-send-response').click()
  await expect(page.getByTestId('response-success-msg')).toBeVisible()
})

test('expired token shows error not response form', async ({ page }) => {
  await page.goto('/cases/[TEST_CASE_ID]/respond?token=[EXPIRED_TEST_TOKEN]')
  await expect(page.getByTestId('token-error')).toBeVisible()
  await expect(page.getByTestId('token-error')).toContainText('expired')
  await expect(page.getByTestId('token-response-form')).not.toBeVisible()
})

test('used token cannot be reused', async ({ page }) => {
  await page.goto('/cases/[TEST_CASE_ID]/respond?token=[ALREADY_USED_TOKEN]')
  await expect(page.getByTestId('token-error')).toBeVisible()
  await expect(page.getByTestId('token-response-form')).not.toBeVisible()
})
```

---

## 6. Security Audit Checklist

Work through this checklist after the build is complete. For each item, verify manually and note the result.

### 6.1 Authentication & Session Security

| # | Check | How to Verify | Pass/Fail |
|---|---|---|---|
| A1 | All admin routes redirect to /login when unauthenticated | Visit /admin/dashboard without logging in | |
| A2 | All customer routes redirect to /login when unauthenticated | Visit /cases without logging in | |
| A3 | Session cookie is HttpOnly | Browser DevTools → Application → Cookies — HttpOnly flag must be set | |
| A4 | Session cookie is Secure in production | Check Vercel deployment — cookie must have Secure flag | |
| A5 | Session cookie has SameSite=Lax or Strict | Check cookie attributes in DevTools | |
| A6 | Logout actually invalidates the session server-side | Log out, copy session cookie, try to use it in a direct API call — must return 401 | |
| A7 | Password reset tokens expire after use | Request reset, use the link, try using the same link again — must fail | |

### 6.2 Authorisation & Access Control

| # | Check | How to Verify | Pass/Fail |
|---|---|---|---|
| B1 | Customer A cannot read Customer B's cases via API | Call GET /api/cases/[case_id_of_B] authenticated as Customer A — must return 403 or 404 | |
| B2 | Customer cannot approve a case via API | POST to /api/cases/[id]/approve with customer session — must return 403 | |
| B3 | Customer cannot issue RMA via API | Same as B2 | |
| B4 | Customer cannot set hold state via API | POST to /api/cases/[id]/hold with customer session — must return 403 | |
| B5 | staff_uk cannot read US cases via API | GET /api/cases with staff_uk session — US cases must not appear | |
| B6 | staff_us cannot read UK cases via API | GET /api/cases with staff_us session — UK cases must not appear | |
| B7 | Customer cannot access /admin/* routes | Navigate to /admin/dashboard as customer — must redirect | |
| B8 | Role cannot be escalated via API | PATCH /api/users/[id] with role: 'admin' as a customer — must return 403 | |

### 6.3 Data Exposure

| # | Check | How to Verify | Pass/Fail |
|---|---|---|---|
| C1 | CREDIT_HELD reason never in customer API response | GET /api/cases/[id] as the case-owning customer when hold is CREDIT_HELD — check JSON response has no 'credit_held' or 'CREDIT_HELD' | |
| C2 | Internal case updates not in customer API response | GET /api/cases/[id]/updates as customer — is_internal=true updates must not appear | |
| C3 | SAP order value not in customer API response | GET /api/cases/[id] as customer — sap_order_value must not be in the response | |
| C4 | SAP spent hours not in customer API response | Same — sap_spent_hours must not be in the response | |
| C5 | Other customer's email not accessible | No API endpoint should return another user's email to a customer | |
| C6 | Service role key not in client bundle | Browser DevTools → Sources — search for SUPABASE_SERVICE_ROLE_KEY — must not appear | |
| C7 | Stripe secret key not in client bundle | Search for sk_live or sk_test in client bundle | |
| C8 | Environment variables not exposed to browser | Search for BETTER_AUTH_SECRET in client bundle | |

### 6.4 Input Validation & Injection

| # | Check | How to Verify | Pass/Fail |
|---|---|---|---|
| D1 | SQL injection via case search | Try search: `'; DROP TABLE cases; --` — must be handled safely by Supabase parameterised queries | |
| D2 | XSS via case update content | Submit a case update containing `<script>alert('xss')</script>` — must be rendered as text not executed | |
| D3 | XSS via fault description | Submit fault description with script tag — same check | |
| D4 | File upload restricted to allowed types | Try uploading a .exe or .php file — must be rejected | |
| D5 | File upload size limit enforced | Try uploading a file over 10MB — must be rejected | |
| D6 | Zod validation on all API routes | Send malformed JSON to POST /api/cases — must return 400 with validation error | |
| D7 | Required fields cannot be bypassed | Remove required fields from API request — must return 400 | |

### 6.5 Rate Limiting & Abuse Prevention

| # | Check | How to Verify | Pass/Fail |
|---|---|---|---|
| E1 | Login rate limiting | Attempt 10 failed logins in quick succession — should be rate limited | |
| E2 | Case submission rate limiting | Submit 10 cases in 1 minute as same user — should be limited | |
| E3 | Token response endpoint rate limited | Call /respond 20 times with wrong token — should be limited | |

---

## 7. RLS Policy Tests

### Prompt 7.1 — Generate RLS Verification Script

```
Create a script at src/tests/security/rls-verification.ts that can be run manually to verify all RLS policies are working correctly.

The script should:

1. Create test users for each role using the Supabase admin API
2. Create test cases: one UK case and one US case, each owned by different customers
3. Run each verification in sequence and print PASS or FAIL:

Customer isolation:
  - Customer A reads their own case → should return 1 row
  - Customer A reads Customer B's case → should return 0 rows
  - Customer A reads all cases → should return only their own

Staff office isolation:
  - staff_uk reads UK cases → should return UK cases
  - staff_uk reads US cases → should return 0 rows
  - staff_us reads US cases → should return US cases
  - staff_us reads UK cases → should return 0 rows

Admin access:
  - Admin reads all cases → should return both UK and US cases

Direct column mutation attempts (these should all fail):
  - Customer attempts to set status=APPROVED directly → should fail
  - Customer attempts to set rma_number directly → should fail
  - Customer attempts to set hold_reason=AWAITING_CUSTOMER directly → should fail
  - Customer attempts to set payment_status=paid directly → should fail

4. Print a summary: X/Y checks passed
5. Clean up all test data
6. Exit with code 1 if any check fails (so it can be used in CI)

Add to package.json scripts:
"test:rls": "tsx src/tests/security/rls-verification.ts"
```

---

## 8. Payment Security Tests

### Prompt 8.1 — Payment Security Tests

```
Create src/tests/security/payment-security.test.ts:

Test that payment status cannot be manipulated:

- 'customer cannot set payment_status=paid directly via API'
  Call PATCH /api/cases/[id] with body { payment_status: 'paid' } as a customer
  Assert the response is 403 and the case payment_status has not changed

- 'customer cannot set payment_status=waived directly via API'
  Same test with waived

- 'payment_status only changes to paid via Stripe webhook with valid signature'
  Call POST /api/stripe/webhook without the Stripe-Signature header
  Assert 400 is returned and no case is updated

- 'payment_status only changes to paid via Stripe webhook with correct secret'
  Call POST /api/stripe/webhook with a fake signature
  Assert 400 is returned

- 'case status does not change to UNDER_REVIEW before payment is confirmed'
  Create a case with AWAITING_PAYMENT status
  Assert that calling the approve endpoint before payment returns an error

- 'stub mode does not create a Stripe PaymentIntent'
  Set PAYMENT_MODE=stub
  Submit a case that requires payment
  Assert that no Stripe API calls were made (check mock)

- 'PAYMENT_MODE cannot be overridden via request body'
  Call POST /api/cases with body including { paymentMode: 'stripe' }
  When PAYMENT_MODE=stub in env, assert stub behaviour is used regardless

- 'Stripe webhook payload is verified before processing'
  Valid Stripe signature + valid payload → case updated
  Invalid Stripe signature + valid payload → 400, case not updated
  Valid Stripe signature + tampered payload → 400, case not updated
```

---

## 9. Running the Full Test Suite

### Complete Test Run Command

Run all tests in sequence before any deployment:

```
npm run test:coverage && npm run test:rls && npm run test:e2e
```

All three must pass with zero failures before deploying to production.

### Expected Coverage Targets

| Area | Target |
|---|---|
| Business logic (schemas, mappers, tokens) | 95%+ |
| API route handlers | 85%+ |
| React components | 75%+ |
| Overall | 80%+ |

### CI Pipeline (GitHub Actions)

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-and-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 10. Claude Code Testing Rules

Add this as a `TESTING.md` file in the project root. Reference it whenever starting a new Claude Code session that involves tests.

### Prompt to generate TESTING.md

```
Create a file called TESTING.md in the project root with these exact contents:

# Testing Rules

## The Prime Directive
**Never modify a test to make it pass.**

If a test is failing:
1. Read the test carefully to understand what it expects
2. Read the application code to understand what it is doing
3. Identify the gap between expectation and reality
4. Fix the application code
5. Run the test again

## What Claude Must Never Do
- Change an expected value to match broken behaviour
- Remove or comment out a failing test
- Add .skip() to hide a failing test
- Change a test description to make it seem less critical
- Mock a function inside a test to bypass the real logic being tested
- Modify assertions to be less strict

## What Claude Should Do When a Test Fails
- Explain what the test is checking
- Explain what the application code is currently doing
- Identify the specific line(s) of application code that need to change
- Make only the minimal fix required

## Security Tests Are Immutable
Tests in src/tests/security/ and any test with "cannot" or "must not" in the description
are security tests. These must NEVER be modified. If a security test is failing,
it means there is a real security vulnerability that must be fixed.

## Test Data
- Never use production data in tests
- All test case numbers start with TEST-
- Clean up test data after each test
- Never hardcode real email addresses

## Coverage
- Do not write tests purely to increase coverage numbers
- Every test must check something that matters for correctness or security
- A test that always passes regardless of the application code is worse than no test
```

---

## 11. Pre-Deployment Checklist

Complete all items before deploying to production or presenting the demo.

### Testing

- [ ] `npm run test:coverage` passes with zero failures
- [ ] Coverage meets thresholds (80% overall)
- [ ] `npm run test:rls` passes all checks
- [ ] `npm run test:e2e` passes all scenarios
- [ ] All security audit checklist items verified (Section 6)

### Security

- [ ] No TypeScript `any` types (`npx tsc --noEmit` clean)
- [ ] No secrets in client bundle (search bundle for key patterns)
- [ ] CREDIT_HELD reason verified not to appear in customer responses
- [ ] Internal case updates verified not visible to customers
- [ ] SAP financial data verified not in customer API responses
- [ ] RLS policies verified on all tables
- [ ] All API routes have Zod input validation
- [ ] File uploads restricted to allowed types and sizes

### Code Quality

- [ ] `npm run build` completes without errors or warnings
- [ ] ESLint passes: `npx eslint src/`
- [ ] No console.log statements in production code
- [ ] All environment variables documented in `.env.local.example`
- [ ] `TESTING.md` exists in project root

### Demo Readiness

- [ ] Seed data loads correctly (`supabase db reset && supabase db seed`)
- [ ] All four demo user accounts have correct passwords set in Supabase Auth
- [ ] All five demo flows work end to end
- [ ] Workshop stage tracker displays correctly for all stages
- [ ] Action Required banner displays and response works
- [ ] Payment stub notice displays correctly
- [ ] Admin dashboard shows correct case counts

---

*End of Testing & Security Audit Guide — Cosworth Electronics RMA Portal*
*Read alongside: Cosworth_RMA_Complete_Brief_v1.1.md, Cosworth_RMA_Claude_Code_Guide.md*
