# /fix-failing-test

Fix a failing test by correcting the application code — never the test.

## Usage
```
/fix-failing-test [paste the full test failure output]
```

## What this command does

1. Reads the full test failure output
2. Identifies which test file and assertion is failing
3. Reads the failing test to understand what behaviour it expects
4. Reads the relevant application code to understand what it currently does
5. Identifies the exact line(s) of application code causing the failure
6. Fixes only the application code — never the test
7. Explains what was wrong and what was changed

## Non-negotiable rules

- **Never modify the test file** to make the test pass
- **Never change expected values** in assertions
- **Never skip or remove** the failing test
- **Never add `.skip()`** to hide the failure
- If the test is in `src/tests/security/` — treat it as a security vulnerability and fix the vulnerability
- If the test appears to be wrong because requirements changed — stop and ask for explicit approval before changing it

## Process

When you receive a failing test, say this first:
> "This test is checking that [X]. The application code is currently doing [Y]. The fix is to change [Z] in [file]."

Then make only that change.
