# /write-tests

Write tests for a specified feature, component, or API route.

## Usage
```
/write-tests [file path or feature name]
```

Examples:
- `/write-tests src/app/api/cases/[caseId]/hold/route.ts`
- `/write-tests workshop stage tracker component`
- `/write-tests Power BI import feature`

## What this command does

1. Reads the specified file(s) or identifies all files relevant to the feature
2. Reads `docs/Cosworth_RMA_Testing_Security_Guide.md` to find the relevant test spec
3. Writes tests that match the spec exactly — do not invent tests not in the spec
4. Places tests in the correct directory (`unit/`, `integration/`, `e2e/`)
5. Uses the correct test helpers from `src/tests/helpers/`

## Test writing rules

- Every test must have a clear description of what behaviour it checks
- Tests must be independent — no test should depend on another test running first
- Use `beforeEach` / `afterEach` to set up and tear down test data
- All test case numbers use the `TEST-` prefix
- Use `@faker-js/faker` for synthetic data — never real customer data
- Security tests go in `src/tests/security/` and are treated as immutable once written

## What to test first (priority order)

1. **Security tests** — CREDIT_HELD exposure, RLS policies, auth bypass attempts
2. **Business logic** — case number generation, stage mapping, token validation, payment mode
3. **API routes** — happy path + auth failures + validation failures
4. **Components** — only render logic that affects correctness, not visual styling

## Output format

Write the complete test file. Include:
- Import statements
- `describe` block with feature name
- All test cases from the spec
- Test data setup helpers
- Cleanup in `afterEach`/`afterAll`

After writing, state:
> "Written N tests covering: [list of behaviours]. Run with: `npm test [file path]`"
