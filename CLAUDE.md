# Cosworth Electronics — RMA & Returns Portal
## CLAUDE.md — Project Context for Claude Code

> This file is read by Claude Code at the start of every session. It contains everything you need to know about this project. Read it fully before writing any code.

---

## What This Project Is

A full-stack web application that replaces the static returns form at `cosworth.com/motorsport/returns/` with a complete RMA (Returns Materials Authorisation) case management system for Cosworth Electronics.

Customers submit product returns, receive a Case ID immediately, and can track their repair through every workshop stage. Staff manage approvals, workshop progress, and customer communications through an admin portal.

**Live URL (target):** `returns.cosworth.com`
**Replaces:** `cosworth.com/motorsport/returns/` (301 redirect to be added by Cosworth web team)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 — App Router, Server Components, Server Actions |
| Language | TypeScript — strict mode, no `any` types |
| Database | Supabase (PostgreSQL) — RLS enforced on all tables |
| File Storage | Supabase Storage |
| Auth | Better Auth |
| Styling | Tailwind CSS |
| Email | Resend with React Email templates |
| Payments | Stripe — existing Cosworth account, currently in stub mode |
| Hosting | Vercel |

---

## Brand & Design

**Colours (add to tailwind.config.ts as custom tokens):**
```
navy:        #002847   — nav, headers, hero backgrounds
navy-mid:    #003a63   — hero gradients
blue:        #0066cc   — CTAs, links, active states
blue-light:  #0080ff   — hover on blue
accent:      #00b4d8   — brand highlight, logo text
grey-50:     #f8fafc   — page backgrounds
grey-100:    #f1f5f9   — alternate rows, input backgrounds
text:        #0f172a   — body copy
```

**Fonts:** Space Grotesk (headings, case numbers) + DM Sans (body) + DM Mono (reference numbers, fees)

**Layout rules:**
- Sticky dark navy nav bar, 64px height, white Cosworth logo left, auth controls right
- Page hero sections: dark navy gradient with subtle radial accent glow
- Card-based content: white, rounded-xl, border-grey-200, subtle shadow
- Footer: three-column navy footer — Cosworth Ltd (Northampton), Cosworth Electronics Ltd (Cambridge), Cosworth Electronics LLC (Indianapolis)
- Mobile-first responsive — must work on tablet (trackside use case)

**Reference the HTML prototype** (`cosworth-rma-portal-v2.html`) for exact visual design of every page before building any UI component.

---

## User Roles

| Role | Access |
|---|---|
| `customer` | Own cases only — submit, track, respond to hold queries, pay |
| `staff_uk` | UK case queue — full case management, products, accounts |
| `staff_us` | US case queue — full case management, can create UK transfer cases |
| `admin` | Global — all of the above plus user management |

Route protection via `middleware.ts`:
- `/admin/*` — requires `staff_uk`, `staff_us`, or `admin`
- `/cases/*` — requires any authenticated user
- `/submit` — public (guests can submit)
- `/cases/[caseId]/respond` — public with valid token (no login required)

---

## Case Lifecycle

Every return has a **Case ID** (`CASE-YYYYMM-XXXX`) generated on submission. Additional references attach as the case progresses:

```
CASE-YYYYMM-XXXX   — created on submission, lives forever
RMA-YYYYMM-XXXX    — issued by staff on approval
SAP Sales Order    — manually added by staff
SAP Works Order    — manually added by staff
INT-YYYYMM-XXXX    — auto-created for USA → UK transfer cases
```

**Case statuses:**
`SUBMITTED → UNDER_REVIEW → AWAITING_PAYMENT → RMA_ISSUED → PARTS_RECEIVED → IN_REPAIR → QUALITY_CHECK → READY_TO_RETURN → CLOSED / REJECTED`

For USA cases that need UK repair: `RETURNED_TO_US_OFFICE` (auto-set when the INT child case closes)

---

## Workshop Stages

When a case is `IN_REPAIR`, it moves through 7 Planner bucket stages. These are the **only stages shown to customers** — there is no SAP milestone tier on the customer-facing view.

| Planner Bucket | Portal Enum | Customer Label |
|---|---|---|
| Awaiting test | `AWAITING_TEST` | Awaiting Test |
| Re-test | `RETEST` | Under Test |
| Rework | `REWORK` | In Rework |
| Final test | `FINAL_TEST` | Final Test |
| Clean and label | `CLEAN_AND_LABEL` | Finishing |
| Inspection | `INSPECTION` | Inspection |
| Completed | `WORKSHOP_COMPLETE` | Repair Complete |

**Hold states** (pause the workflow):

| Planner Bucket | Customer Label | Notes |
|---|---|---|
| Awaiting parts | On Hold — Awaiting Parts | Informational |
| With support | On Hold — Under Investigation | Informational |
| With engineering | On Hold — Engineering Review | Informational |
| Awaiting confirmation customer | **Action Required — Response Needed** | Triggers email + portal banner + response token |
| Credit held | **On Hold — Please Contact Us** | ⚠ NEVER expose "credit held" wording to customer |

---

## Fee Structure

Three fee types per product — no separate fees page, all managed inline on the Products & Fees page:

| Column | Description |
|---|---|
| `test_fee` | Charged when unit is received and tested |
| `standard_repair_fee` | Standard component-level repair |
| `major_repair_fee` | Board-level or full unit replacement |

Representative values: ECUs (£700 / £1,500 / £3,500), Displays (£350 / £750 / £1,800), Loggers (£450 / £950 / £2,200), Power Systems (£550 / £1,200 / £2,800), Steering Wheels (£200 / £450 / £950).

---

## Payment Mode

Stripe is wired in but **currently stubbed**. Controlled by a single environment variable:

```
PAYMENT_MODE=stub    # shows "contact us" message — current setting
PAYMENT_MODE=stripe  # activates real Stripe payment flow
```

**Payment is required when:** `customer_accounts.credit_terms = false` OR guest submission.

When `PAYMENT_MODE=stub`: customer sees an amber notice — "A member of our team will contact you within 24 hours to arrange payment." No Stripe calls are made.

When `PAYMENT_MODE=stripe`: Stripe Elements payment form, PaymentIntent created on load, webhook updates case on success.

**Never switch payment mode based on request body** — always read from `process.env.PAYMENT_MODE`.

---

## Office Routing

| Office | Queue | RMA Approval Email | Submission Email |
|---|---|---|---|
| UK | `staff_uk` and `admin` | `UK_RETURNS_EMAIL` env var | `UK_RETURNS_EMAIL` |
| US | `staff_us` and `admin` | `US_SALES_EMAIL` env var | `US_SALES_EMAIL` |

USA → UK transfers: when US staff tick "Send to UK for Repair", an `INT-*` child case is created. UK team see it in their queue. When UK closes the INT case, the parent case status auto-updates to `RETURNED_TO_US_OFFICE`. Child case updates notify US office only.

---

## Admin Pages

| Route | Purpose |
|---|---|
| `/admin/dashboard` | Case queue filtered by office role |
| `/admin/cases` | All cases with filters |
| `/admin/cases/[caseId]` | Full case detail — approve, reject, stage, hold, update |
| `/admin/products` | **Combined Products & Fees** — single table, inline fee editing |
| `/admin/products/[id]/edit` | Full product edit — details + three fee fields |
| `/admin/accounts` | Customer account list |
| `/admin/accounts/[id]` | Account detail — settings, credit terms, PO toggle, cases |
| `/admin/import` | Power BI Excel import — preview before confirm |

**There is no separate `/admin/fees` page.** Fees live on the products page.

---

## Power BI Import

Staff upload an Excel export from the Cosworth Repairs Power BI report. Primary match key is the **Description column** (RMA number).

Key column mappings:
- `Description` → `cases.rma_number` (match key)
- `Product Status` → workshop stage or hold reason (via Planner bucket mapping)
- `Sales Order` → `cases.sap_sales_order`
- `Service Order` → `cases.sap_works_order`
- `Estimated Completion` → `cases.sap_estimated_completion`
- `Value` → `cases.sap_order_value` (staff-visible only)
- `Spent Hours` → `cases.sap_spent_hours` (staff-visible only)

**Always show a preview before applying.** Never auto-apply import changes. Import log is read-only and never deleted.

---

## Critical Security Rules

These are non-negotiable. Every session, every file:

1. **`CREDIT_HELD` never reaches a customer response.** The `hold_reason` column is internal only. Customers always see `hold_customer_label`. The string "credit held" or "CREDIT_HELD" must never appear in any customer-facing API response, page, or email.

2. **RLS enforced in Supabase.** Never rely on app-level checks alone. All tables have Row Level Security. Use the server client (with cookies) for all server-side data access. Never use the service role key client-side.

3. **No secrets in the client bundle.** `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY` are server-only. Never reference them in components or client code.

4. **All API routes validate input with Zod.** Every POST/PATCH endpoint has a Zod schema. Return 400 with field-level errors on validation failure.

5. **SAP financial data (value, hours) is staff-only.** Never include `sap_order_value` or `sap_spent_hours` in customer-facing API responses.

6. **Internal case updates (`is_internal=true`) never reach customers.** Filter at the query level, not the component level.

7. **Customers can only access their own cases.** Enforce at the RLS level AND in route handlers. A customer hitting `/cases/[other-customer-case-id]` gets 404, not 403 (don't reveal the case exists).

---

## Testing Rules

> **The prime directive: never modify a test to make it pass. Fix the application code.**

Full rules are in `TESTING.md` (to be created in project root). Summary:

- Never change expected values to match broken behaviour
- Never skip, comment out, or remove a failing test
- Never use `.only()` or `.skip()` to hide failures before committing
- Security tests in `src/tests/security/` are **immutable** — a failure means a real vulnerability
- If a test is wrong because requirements changed, ask for explicit approval before changing it
- When a test fails: explain what it checks, explain what the code does, fix the code

---

## Environment Variables

All must be set in `.env.local` for development and in Vercel for production:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
UK_RETURNS_EMAIL=returns@cosworth.com
US_SALES_EMAIL=us-sales@cosworth.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
PAYMENT_MODE=stub
```

---

## Key Conventions

**File structure:** `src/app/` with App Router. Customer routes in `(customer)/`, admin routes in `(admin)/`, auth routes in `(auth)/`.

**Components:** shared UI primitives in `src/components/ui/`. Case-specific in `src/components/cases/`. Layout in `src/components/layout/`.

**Types:** Supabase generated types in `src/types/database.ts`. Workshop enums in `src/types/workshop.ts`.

**Emails:** React Email templates in `src/emails/`. Sending logic in `src/lib/email.ts`. Email failures must never break the user action — wrap in try/catch, log the error.

**Case numbers:** Generated by database function `generate_case_number()`. Never generate in application code.

**Imports:** Use `@/` path alias for all src imports.

**Supabase clients:**
- `src/lib/supabase/client.ts` — browser (use in client components)
- `src/lib/supabase/server.ts` — server (use in Server Components, Route Handlers, Server Actions)
- Never use the service role key except in trusted server-only contexts

---

## Skills & Commands

### UI/UX Design Intelligence
Before building any UI component or page, read `.claude/UI_UX_DESIGN.md`. It contains:
- Cosworth-specific component patterns (cards, buttons, badges, tables, forms)
- Brand token usage rules
- Typography and spacing system
- Accessibility requirements
- Pre-build checklist

### Slash Commands
The following commands are available in `.claude/commands/`:

| Command | When to use |
|---|---|
| `/implement-phase [N]` | Start a new build phase from the build guide |
| `/fix-failing-test [output]` | Fix a failing test — pastes error, fixes code not test |
| `/security-check [file]` | Audit a file or feature against security rules |
| `/review-component [file]` | Compare a component against the prototype and design rules |
| `/write-tests [feature]` | Write tests for a feature per the testing guide spec |
| `/check-prototype [name]` | Look up how something should look in the prototype |

### Testing Rules
Read `TESTING.md` in the project root before any session involving tests.
The prime directive is always: **never modify a test to make it pass — fix the application code.**

---



All four documents live alongside this file in the project. Read the relevant section before building each feature:

| Document | Use For |
|---|---|
| `Cosworth_RMA_Complete_Brief_v1.1.md` | Full requirements — schema, API routes, UI spec, all sections |
| `Cosworth_RMA_Claude_Code_Guide.md` | Phase-by-phase build prompts — work through these in order |
| `Cosworth_RMA_Testing_Security_Guide.md` | Test setup, all test cases, security audit checklist |
| `cosworth-rma-portal-v2.html` | Visual prototype — open in browser to see exact design for every page |

---

## Build Order

Work through the build guide phases in sequence. Do not skip ahead.

```
Phase 1 — Foundation (Tailwind tokens, nav, footer, shared UI)
Phase 2 — Database & Auth (schema, seed, Supabase clients, Better Auth, login)
Phase 3 — RMA Submission Form (5-step wizard, file upload, case creation API)
Phase 4 — Customer Case Tracking (case list, case detail, workshop tracker, hold banner)
Phase 5 — Admin Portal (dashboard, case queue, case detail, approve/reject/stage/hold)
Phase 6 — Workshop Stages, Products & Fees, Accounts pages
Phase 7 — Email Notifications (all Resend templates, sending service)
Phase 8 — Payment Stub & Stripe wiring
Phase 9 — Power BI Import page
Phase 10 — Seed data, loading states, error handling, demo polish
```

Complete the verification step at the end of each phase before moving on.

---

## Demo Accounts (set passwords in Supabase Auth after seeding)

| Role | Email | Password |
|---|---|---|
| Customer (credit terms) | demo.customer@btsport.com | Demo1234! |
| Customer (no credit) | demo.customer2@tfsport.com | Demo1234! |
| Staff UK | demo.staff@cosworth.com | Demo1234! |
| Admin | demo.admin@cosworth.com | Demo1234! |
