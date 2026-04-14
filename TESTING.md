# Testing Rules — Cosworth RMA Portal

> This file is read by Claude Code alongside CLAUDE.md. These rules apply to every session that involves tests, test files, or any code that tests touch.

---

## The Prime Directive

**Never modify a test to make it pass.**

If a test is failing, the test is telling you something is wrong with the application code. Fix the application code. The test is the source of truth.

---

## What Claude Must Never Do

- Change an expected value in a test assertion to match broken behaviour
- Remove or comment out a failing test
- Add `.skip()` or `.only()` to hide failing tests
- Mock a function inside a test to bypass the logic being tested
- Change a test description to make it sound less important
- Adjust assertion strictness to make a failure disappear
- Delete test files or test cases

---

## What Claude Must Do When a Test Fails

1. **Read the test** — understand exactly what it is asserting
2. **Read the application code** — find where the behaviour diverges from the assertion
3. **Explain the gap** — tell the developer what the test expects vs what the code does
4. **Fix only the application code** — the minimum change needed to make the test pass correctly
5. **Run the test again** — confirm the fix works without breaking other tests

---

## Security Tests Are Immutable

Tests in `src/tests/security/` and any test containing `cannot`, `must not`, `never`, or `CREDIT_HELD` in the description are **security tests**. These must never be modified under any circumstances.

If a security test is failing, it means there is a real security vulnerability in the application. Fix the vulnerability.

The most critical security tests for this project:
- Any test asserting `CREDIT_HELD` does not appear in customer responses
- Any test asserting customers cannot read other customers' cases
- Any test asserting payment status cannot be changed directly by a customer
- Any test asserting RLS policies block unauthorised data access

---

## If a Test is Wrong

If a test needs to change because the **requirements genuinely changed** (not because the code is broken):

1. Stop — do not change the test
2. Tell the developer explicitly: *"This test appears to be wrong because [reason]. The requirement that changed is [X]. Do you want me to update the test to reflect the new requirement?"*
3. Wait for explicit approval before changing any test

---

## Test File Locations

```
src/tests/
├── unit/           # Pure function tests — no external dependencies
├── integration/    # API routes with real Supabase test database
│   ├── api/
│   └── rls/        # Row Level Security policy tests
├── security/       # Security-specific tests — IMMUTABLE
└── e2e/            # Playwright end-to-end tests
    └── global-setup.ts
```

---

## Running Tests

```bash
npm test                  # unit + integration (vitest)
npm run test:watch        # watch mode
npm run test:coverage     # with coverage report
npm run test:e2e          # Playwright e2e tests
npm run test:rls          # RLS policy verification script
npm run test:all          # everything
```

Coverage thresholds (build fails if below):
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

---

## Test Data Rules

- Never use production data in tests
- All test case numbers use the `TEST-` prefix
- Clean up test data after each test (use `afterEach` / `afterAll`)
- Never hardcode real email addresses or personal data
- Use `@faker-js/faker` for realistic synthetic data

---

## Writing Good Tests

A good test:
- Has a clear description of what behaviour it checks
- Tests one thing
- Would fail if the behaviour it describes broke
- Would not pass if the wrong code was written to satisfy it

A bad test:
- Tests that code runs without throwing (not that it does the right thing)
- Has assertions so loose they pass regardless of output
- Exists purely to hit a coverage number
