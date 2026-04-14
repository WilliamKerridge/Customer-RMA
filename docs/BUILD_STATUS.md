# Cosworth RMA Portal — Build Status

> Last updated: 2026-04-08

---

## Phase Overview

| Phase | Status |
|---|---|
| Phase 1 — Foundation | ✅ Complete |
| Phase 2 — Database & Auth | ✅ Complete |
| Phase 3 — RMA Submission Form | ✅ Complete |
| Phase 4 — Customer Case Tracking | ✅ Complete |
| Phase 5 — Admin Portal | ⬜ Not started |
| Phase 6 — Workshop Stages & Hold States | ⬜ Not started |
| Phase 7 — Email Notifications | ⬜ Not started |
| Phase 8 — Payment Stub & Stripe Wiring | ⬜ Not started |
| Phase 9 — Seed Data & Demo Polish | ⬜ Not started |

---

## Phase 1 — Foundation ✅

| Prompt | Status | Notes |
|---|---|---|
| 1.1 Tailwind Brand Config | ✅ | CSS variables via `@theme inline` in globals.css (Tailwind v4 — no tailwind.config.ts) |
| 1.2 Root Layout, Navbar, Footer | ✅ | `src/components/layout/Navbar.tsx`, `Footer.tsx`, `src/app/layout.tsx` |
| 1.3 Shared UI Components | ✅ | `src/components/ui/` — button, badge, card, DataTable, input, select, textarea, switch, tabs, dialog, dropdown-menu, separator, sonner, label, index.ts |

---

## Phase 2 — Database & Auth ✅

| Prompt | Status | Notes |
|---|---|---|
| 2.1 Database Schema | ✅ | `supabase/migrations/001_initial_schema.sql` — all tables, RLS, generate_case_number() |
| 2.1a Fix user ID types | ✅ | `supabase/migrations/002_fix_user_id_types.sql` — altered all FK columns from UUID to TEXT for better-auth compatibility |
| 2.2 Seed Data | ✅ | Products, demo users, customer accounts, 2 demo cases |
| 2.3 Supabase Clients | ✅ | `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`, `service.ts`; `src/types/database.ts` |
| 2.4 Better Auth | ✅ | `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/app/api/auth/[...all]/route.ts`, login/register page, forgot-password page, Navbar auth state |

**Known deviations from spec:**
- better-auth generates TEXT user IDs (not UUIDs) — all FK columns patched to TEXT in migration 002
- `src/types/database.ts` requires `Relationships: []` on all tables + `Views`, `CompositeTypes`, `Enums` sections for supabase-js v2.101 compatibility

---

## Phase 3 — RMA Submission Form ✅

| Prompt | Status | Notes |
|---|---|---|
| 3.1 Form Foundation & Step Wizard | ✅ | `src/components/forms/RMASubmitForm.tsx` — animated 5-step progress bar with green/blue/grey states |
| 3.2 Steps 1–3 | ✅ | Step1Contact (pre-fills from session), Step2Office (radio cards, date picker, conditional PO), Step3Products (useFieldArray, grouped select, file upload zone) |
| 3.3 Steps 4–5 & Submission | ✅ | Step4Fault (per-product fault type + repair-only diagnostic questions keyed by entry_id), Step5Review (summary with fee display), success page |

**API routes:**
- `POST /api/cases` — creates case, case_products, attachments; handles payment stub mode
- `POST /api/cases/[caseId]/attachments` — file upload to Supabase Storage

**Known deviations from spec:**
- Step 4 was significantly evolved beyond the spec: per-product fault cards (one per product), each with its own fault type selector and repair-only diagnostic section (fault_display_info, tested_other_unit, fault_follows, fault_display_details). Products are keyed by `entry_id` (UUID) to handle duplicate products correctly.
- `z.number()` with `{ valueAsNumber: true }` used instead of `z.coerce.number()` (which infers `unknown` in react-hook-form resolver)

---

## Phase 4 — Customer Case Tracking ✅

| Prompt | Status | Notes |
|---|---|---|
| 4.1 Case List Page | ✅ | `src/app/(customer)/cases/page.tsx`, `CaseListClient.tsx`, `src/components/cases/CaseSummaryCard.tsx` |
| 4.2 Case Detail Page | ✅ | `src/app/(customer)/cases/[caseId]/page.tsx`, `WorkshopStageTracker.tsx`, `CaseTimeline.tsx` |
| 4.3 Hold State Banner & Customer Response | ✅ | `HoldStateBanner.tsx`, `POST /api/cases/[caseId]/respond`, `src/app/(customer)/cases/[caseId]/respond/page.tsx` |

**Build verified:** `npm run build` passes cleanly — 12 routes compiled.

**Notes:**
- `src/types/database.ts` updated to add FK relationships for `case_products → cases` and `case_products → products` so Supabase join queries type-check correctly
- Tokenised response page validates token server-side via service client, shows expired/invalid error card if token is bad, shows `already responded` card if hold is already cleared

---

## Phase 5 — Admin Portal ⬜

**Next to build.** Prompts to run in order:

- [ ] 5.1 — Admin Layout, Sidebar, Dashboard (`/admin/dashboard`)
- [ ] 5.2 — Admin Case Detail (`/admin/cases/[caseId]`)
- [ ] 5.3 — Case Approval, Stage & Hold API Routes

**Files that will be created:**
- `src/app/(admin)/layout.tsx`
- `src/app/(admin)/dashboard/page.tsx`
- `src/app/(admin)/cases/[caseId]/page.tsx`
- `src/components/layout/AdminSidebar.tsx`
- `src/app/api/cases/[caseId]/approve/route.ts`
- `src/app/api/cases/[caseId]/reject/route.ts`
- `src/app/api/cases/[caseId]/stage/route.ts`
- `src/app/api/cases/[caseId]/hold/route.ts`
- `src/types/workshop.ts` (WorkshopStage and HoldReason enums)

---

## Phase 6 — Workshop Stages & Hold States ⬜

- [ ] 6.1 — WorkshopStageTracker (already built in Phase 4, this prompt enhances it)
- [ ] 6.2 — Admin Products & Fees pages
- [ ] 6.3 — Admin Accounts pages

---

## Phase 7 — Email Notifications ⬜

- [ ] 7.1 — React Email templates (9 templates)
- [ ] 7.2 — Email sending service + wire into API routes

---

## Phase 8 — Payment Stub & Stripe Wiring ⬜

- [ ] 8.1 — Payment logic, payment page, Stripe webhook handler

---

## Phase 9 — Seed Data & Demo Polish ⬜

- [ ] 9.1 — Enhanced demo data (more cases, more accounts)
- [ ] 9.2 — Loading states, error handling, toast notifications, not-found pages
- [ ] 9.3 — Power BI import page

---

## Technical Notes (Carry Forward)

### supabase-js v2.101
All `Database` table types require:
- `Relationships: []` (or populated) on every table — even if no FKs
- Top-level `Views: {}`, `CompositeTypes: {}`, `Enums: {}` sections

Without these, `.insert()` / `.update()` calls produce `never` type errors.

### better-auth user IDs
better-auth generates TEXT IDs, not UUIDs. All FK columns referencing `users.id` are TEXT. Migration 002 handles this. Any new tables with user FK columns must use `TEXT` not `UUID`.

### Tailwind v4
Uses `@theme inline` CSS variables in `globals.css` — there is no `tailwind.config.ts`. New tokens go in `globals.css`.

### Service role client
`src/lib/supabase/service.ts` — bypasses RLS. Server-only. Used in:
- `POST /api/cases` (case creation as guest/anon)
- `POST /api/cases/[caseId]/respond` (token validation)
- `GET /cases/[caseId]/respond` page (token validation)

### CREDIT_HELD security rule
`hold_reason = 'CREDIT_HELD'` must never appear in customer-facing responses. Always use `hold_customer_label` for display. The string "credit held" or "CREDIT_HELD" must not appear in any customer route, component, or email template.
