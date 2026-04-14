# /security-check

Run a security audit on a specific file, route, or feature against the Cosworth RMA security rules.

## Usage
```
/security-check [file path or feature name]
```

Examples:
- `/security-check src/app/api/cases/[caseId]/route.ts`
- `/security-check hold state feature`
- `/security-check customer case detail page`

## What this command does

1. Reads the specified file(s) or identifies all files relevant to the feature
2. Checks each file against the security rules in `CLAUDE.md` and `docs/Cosworth_RMA_Testing_Security_Guide.md`
3. Reports any violations found
4. Suggests fixes for each violation

## Security checks performed

### Critical (must fix before any commit)
- [ ] `CREDIT_HELD` string appears anywhere in a customer-facing response, page, or email template
- [ ] `hold_reason` column returned directly to a customer API response
- [ ] `sap_order_value` or `sap_spent_hours` in any customer-facing response
- [ ] Internal case updates (`is_internal=true`) returned to customer
- [ ] Service role key used in client-side code or component
- [ ] `STRIPE_SECRET_KEY`, `BETTER_AUTH_SECRET`, or `RESEND_API_KEY` in client code
- [ ] API route missing Zod validation
- [ ] Customer can access another customer's case (missing ownership check)
- [ ] Payment status changed without Stripe webhook signature verification
- [ ] `PAYMENT_MODE` read from request body instead of `process.env`

### Important (fix before deployment)
- [ ] Missing RLS policy on a new table
- [ ] Supabase service role client used in a Server Component without justification
- [ ] Auth role check in application code without corresponding RLS policy
- [ ] Missing `cursor-pointer` on interactive elements (accessibility)
- [ ] Form inputs without associated `<label>` elements
- [ ] Images without `alt` text

## Output format

For each issue found:
```
CRITICAL: [issue description]
File: [path]
Line: [line number]
Fix: [specific change required]
```
