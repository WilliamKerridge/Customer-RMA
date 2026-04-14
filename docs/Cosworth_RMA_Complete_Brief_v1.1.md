# Cosworth Electronics — RMA & Returns Portal
## Senior Engineer Build Brief — v1.1 (Complete)

| | |
|---|---|
| **Document Version** | 1.1 — Complete Brief |
| **Prepared By** | Will Kerridge — Customer Sales & Service Manager |
| **Date** | April 2026 |
| **Classification** | Confidential — Internal Use Only |
| **Target URL** | returns.cosworth.com |
| **Replaces** | cosworth.com/motorsport/returns/ (redirect required) |

---

## Contents

1. [Project Overview](#section-1--project-overview)
2. [Technology Stack](#section-2--technology-stack)
3. [Branding Specification](#section-3--branding-specification)
4. [Case Lifecycle & Reference Numbers](#section-4--case-lifecycle--reference-numbers)
5. [Database Schema](#section-5--database-schema)
6. [Folder Structure](#section-6--folder-structure)
7. [RMA Submission Form](#section-7--rma-submission-form)
8. [Admin Portal](#section-8--admin-portal)
9. [Email Notifications](#section-9--email-notifications)
10. [Authentication & Authorisation](#section-10--authentication--authorisation)
11. [Payment Flow (Stripe)](#section-11--payment-flow-stripe)
12. [Website Redirect & Deployment](#section-12--website-redirect--deployment)
13. [Delivery Requirements](#section-13--delivery-requirements)
14. [Workshop Stages & Hold States](#section-14--workshop-stages--hold-states)
15. [Power BI Excel Import](#section-15--power-bi-excel-import)
16. [Folder Structure Additions](#section-16--folder-structure-additions)
17. [Additional Email Notifications](#section-17--additional-email-notifications)
18. [Updated MVP Checklist](#section-18--updated-mvp-checklist)

---

## Section 1 — Project Overview

### 1.1 Purpose

This document is a complete build brief for a senior full-stack engineer to design and implement the Cosworth Electronics RMA & Returns Portal. The portal replaces the existing static returns form at `cosworth.com/motorsport/returns/` with a fully managed, role-based case management system hosted at `returns.cosworth.com`.

---

### 1.2 Existing System — What We Are Replacing

The current form at `cosworth.com/motorsport/returns/` is a static HTML form with the following limitations:

- No customer account or authentication
- No persistent case tracking or status visibility
- No admin portal or approval workflow
- No email notifications
- No payment handling
- No SAP reference integration
- Product list is hardcoded — cannot be updated without developer intervention
- No separation of UK and USA office queues

---

### 1.3 High-Level Goals

- Replace the static form with a full lifecycle case management system
- Customers can submit returns, receive a Case ID immediately, track status, and receive email updates throughout
- Staff (UK and USA) have a role-based admin portal to manage, approve, and update cases
- RMA numbers are issued on approval and linked to the case
- SAP Repair Order numbers can be added by staff and are visible on the case
- USA repairs requiring UK workshop create an internal child case with automatic parent status propagation
- Payment is collected via Stripe for non-account or non-credit-terms customers
- All branding matches the Cosworth website exactly

---

## Section 2 — Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server Components, Server Actions, Route Handlers |
| Language | TypeScript | Strict mode enabled throughout |
| Database | Supabase (PostgreSQL) | Row Level Security (RLS) enforced on all tables |
| File Storage | Supabase Storage | Fault evidence uploads, attachments per case |
| Auth | Better Auth | Roles: customer, staff_uk, staff_us, admin |
| Styling | Tailwind CSS | Cosworth brand tokens in tailwind.config.ts |
| Email | Resend | Transactional email for all notifications |
| Payments | Stripe | Existing Cosworth account — reuse keys |
| Hosting | Vercel | Deploy to returns.cosworth.com subdomain |

---

## Section 3 — Branding Specification

The portal must visually match `cosworth.com` exactly. The existing Cosworth website redirects to this app so there must be no visual discontinuity for the customer.

### 3.1 Colour Palette

| Token | Hex Value | Usage |
|---|---|---|
| `cosworth-navy` | `#003057` | Primary backgrounds, headers, nav |
| `cosworth-blue` | `#005B99` | CTAs, links, active states |
| `cosworth-light-blue` | `#D0E4F0` | Hover states, badges, row highlights |
| `cosworth-white` | `#FFFFFF` | Page backgrounds, card surfaces |
| `cosworth-grey` | `#F5F7FA` | Alternate table rows, input backgrounds |
| `cosworth-text` | `#1A1A2E` | Body copy |
| `cosworth-muted` | `#6B7280` | Labels, secondary text, metadata |

### 3.2 Typography & Assets

- **Font:** System sans-serif stack (Inter via Google Fonts preferred), matching site
- **Logo (blue):** `https://www.cosworth.com/clean-assets/images/public/cosworth_logo_blue.png`
- **Logo (white):** `https://www.cosworth.com/clean-assets/images/public/logo.png`
- **Favicon:** Download from cosworth.com and place in `/public`
- **Returns hero image:** `https://www.cosworth.com/media/2bjngoab/returns.jpg`

### 3.3 Layout

- Full-width dark navy top navigation bar with white Cosworth logo (left) and auth controls (right)
- Sticky nav on scroll
- Footer matching cosworth.com: three-column layout with address blocks for Cosworth Ltd, Cosworth Electronics Ltd (UK), and Cosworth Electronics LLC (USA)
- Card-based content areas with subtle shadow and rounded corners (`rounded-lg`)
- Mobile-first responsive — all views must work on tablet (trackside use case)

---

## Section 4 — Case Lifecycle & Reference Numbers

### 4.1 Reference Number Architecture

Every return is anchored to a single Case. Multiple reference numbers attach to the case as the lifecycle progresses:

| Reference | Format | When Issued |
|---|---|---|
| Case ID | `CASE-YYYYMM-XXXX` | Auto-generated on form submission |
| RMA Number | `RMA-YYYYMM-XXXX` | Issued by staff on case approval |
| SAP Repair Order | Free text (SAP format) | Manually added by staff after SAP booking |
| Internal Transfer | `INT-YYYYMM-XXXX` | Auto-created when USA staff tick "Send to UK" |
| Internal PO | Free text | Added by staff to the internal transfer case |

### 4.2 Status Workflow

The following statuses apply to customer-facing cases (`CASE-*`):

| Status | Description |
|---|---|
| `SUBMITTED` | Form received. Case ID issued. Awaiting staff review. |
| `UNDER_REVIEW` | Staff are reviewing the submission. |
| `AWAITING_PAYMENT` | Payment required before RMA can be issued (non-credit accounts). |
| `RMA_ISSUED` | Approved. RMA number issued. Customer may ship parts. |
| `PARTS_RECEIVED` | Parts received at Cosworth office. |
| `IN_REPAIR` | Repair or service in progress. SAP Repair Order attached. Workshop stages active — see Section 14. |
| `QUALITY_CHECK` | Repair complete. Undergoing quality check. |
| `READY_TO_RETURN` | Repair passed QC. Ready to ship back to customer. |
| `RETURNED_TO_US_OFFICE` | Auto-set when UK internal transfer case is closed (USA cases only). |
| `CLOSED` | Parts returned to customer. Case closed. |
| `REJECTED` | Case rejected by staff. Reason recorded and emailed to customer. |

### 4.3 Internal Transfer Case (USA → UK)

- When a USA staff member ticks "Send to UK for Repair" on an approved case, an internal transfer case (`INT-*`) is automatically created and linked to the parent `CASE-*`
- The INT case is visible only to `staff_uk` and `admin` roles
- USA staff receive email notifications on INT case updates
- When UK staff set the INT case status to `CLOSED`, the parent `CASE-*` status is automatically updated to `RETURNED_TO_US_OFFICE`
- After that point, USA staff manage all further customer-facing updates on the parent case

---

## Section 5 — Database Schema

Design the Supabase PostgreSQL schema with the following tables. Apply Row Level Security (RLS) on all tables. Use UUIDs as primary keys throughout. All timestamps are `timestamptz`.

### 5.1 `users`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `email` | text, unique | |
| `full_name` | text | |
| `company` | text | |
| `phone` | text | |
| `role` | enum | `customer`, `staff_uk`, `staff_us`, `admin` |
| `office` | enum | `UK`, `US`, null — set for staff accounts |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### 5.2 `customer_accounts`

Extended profile for customer-type users. Linked 1:1 to `users`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → users | |
| `company_name` | text | |
| `billing_address` | jsonb | |
| `shipping_address` | jsonb | |
| `credit_terms` | boolean | If true, skip Stripe payment; capture PO number instead |
| `po_required` | boolean | If `credit_terms=true`, require PO number on submission |
| `account_active` | boolean | |
| `notes` | text | Internal account notes |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### 5.3 `products`

Admin-managed list of returnable products. Replaces the hardcoded dropdown on the old form.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `part_number` | text, unique | e.g. `01E-501120` |
| `variant` | text | e.g. `BTCC` |
| `display_name` | text | e.g. `Antares 8 TLA` |
| `category` | text | e.g. `Engine Management Systems` |
| `active` | boolean | If false, hidden from customer form |
| `test_fee` | decimal | Fee charged when unit is received and tested |
| `standard_repair_fee` | decimal | Standard component-level repair |
| `major_repair_fee` | decimal | Board-level or full unit replacement |
| `notes` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### 5.4 `cases`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `case_number` | text, unique | `CASE-YYYYMM-XXXX`, auto-generated |
| `customer_id` | uuid, FK → users | |
| `office` | enum | `UK`, `US` — selected on form submission |
| `status` | enum | See Section 4.2 |
| `fault_type` | enum | `repair`, `service`, `service_plan`, `loan_return`, `code_update` |
| `fault_description` | text | |
| `fault_display_info` | boolean | |
| `fault_display_details` | text | |
| `tested_on_other_unit` | boolean | |
| `fault_follows` | enum | `unit`, `car` |
| `required_return_date` | date | |
| `shipping_address` | jsonb | |
| `rma_number` | text | Set on approval |
| `sap_repair_order` | text | Manually added by staff |
| `payment_required` | boolean | |
| `payment_status` | enum | `pending`, `paid`, `waived`, `invoiced` |
| `stripe_payment_intent_id` | text | |
| `po_number` | text | For credit-terms customers |
| `assigned_to` | uuid, FK → users | Staff assignee |
| `parent_case_id` | uuid, FK → cases, nullable | For INT transfer cases |
| `is_internal_transfer` | boolean | |
| `internal_po` | text | For INT transfer cases |
| `workshop_stage` | text (enum) | `AWAITING_TEST`, `RETEST`, `REWORK`, `FINAL_TEST`, `CLEAN_AND_LABEL`, `INSPECTION`, `WORKSHOP_COMPLETE` |
| `is_on_hold` | boolean | Default false |
| `hold_reason` | text (enum) | Internal: `AWAITING_PARTS`, `WITH_SUPPORT`, `WITH_ENGINEERING`, `AWAITING_CUSTOMER`, `CREDIT_HELD` |
| `hold_customer_label` | text | What the customer sees — never expose `hold_reason` directly |
| `awaiting_customer_question` | text | The staff message requiring customer response |
| `sap_sales_order` | text | Power BI: Sales Order column |
| `sap_works_order` | text | Power BI: Service Order column |
| `sap_booked_in_date` | date | Power BI: Order Loaded column |
| `sap_estimated_completion` | date | Power BI: Estimated Completion column |
| `sap_order_value` | decimal | Power BI: Value column. Staff-visible only. |
| `sap_spent_hours` | decimal | Power BI: Spent Hours column. Staff-visible only. |
| `sap_days_open` | integer | Power BI: Days Open column. Recalculated on import. |
| `last_import_at` | timestamptz | Timestamp of last Power BI import touching this case |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `closed_at` | timestamptz | |

### 5.5 `case_products`

Junction table — one case can have multiple products.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `case_id` | uuid, FK → cases | |
| `product_id` | uuid, FK → products | |
| `serial_number` | text | |
| `quantity` | integer | |
| `fault_notes` | text | |
| `test_fee_applied` | decimal | |
| `repair_fee_applied` | decimal | Test, Standard, or Major — set per case |

### 5.6 `case_updates`

Timeline of all updates on a case. Powers both the customer timeline view and internal notes.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `case_id` | uuid, FK → cases | |
| `author_id` | uuid, FK → users | |
| `content` | text | |
| `is_internal` | boolean | If true, not visible to customer |
| `status_change_to` | text, nullable | Records what status was set |
| `created_at` | timestamptz | |

### 5.7 `case_attachments`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `case_id` | uuid, FK → cases | |
| `uploaded_by` | uuid, FK → users | |
| `file_name` | text | |
| `storage_path` | text | Supabase Storage path |
| `file_size` | integer | |
| `mime_type` | text | |
| `created_at` | timestamptz | |

### 5.8 `case_response_tokens`

Secure single-use tokens for customer email responses. See Section 14.3.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `case_id` | uuid, FK → cases | |
| `token` | text, unique | Cryptographically random, 32 chars |
| `created_at` | timestamptz | |
| `expires_at` | timestamptz | 7 days from creation |
| `used_at` | timestamptz, nullable | Set on use; token then invalid |

### 5.9 `email_notifications`

Audit log of all outbound emails sent by the system.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `case_id` | uuid, FK → cases | |
| `recipient_email` | text | |
| `template` | text | |
| `sent_at` | timestamptz | |
| `resend_message_id` | text | |

---

## Section 6 — Folder Structure

Scaffold the following Next.js 14 App Router project structure. Every directory and file listed must exist in the final delivery.

```
cosworth-rma/
├── .env.local.example
├── .env.local                            # gitignored
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── middleware.ts                         # Better Auth + route protection
│
├── public/
│   ├── cosworth-logo-blue.png
│   ├── cosworth-logo-white.png
│   └── favicon.ico
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout — nav + footer
│   │   ├── page.tsx                      # Landing → redirect to /submit
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   │
│   │   ├── (customer)/
│   │   │   ├── layout.tsx                # Customer shell
│   │   │   ├── submit/
│   │   │   │   ├── page.tsx              # Multi-step RMA submission form
│   │   │   │   └── success/page.tsx      # Post-submit — shows Case ID
│   │   │   ├── cases/
│   │   │   │   ├── page.tsx              # Customer case list
│   │   │   │   └── [caseId]/
│   │   │   │       ├── page.tsx          # Case detail + timeline
│   │   │   │       └── respond/page.tsx  # Tokenised response page (no auth)
│   │   │   └── payment/
│   │   │       └── [caseId]/page.tsx     # Stripe payment page
│   │   │
│   │   ├── (admin)/
│   │   │   ├── layout.tsx                # Admin shell with sidebar
│   │   │   ├── dashboard/page.tsx        # Queue overview — UK/US filtered by role
│   │   │   ├── cases/
│   │   │   │   ├── page.tsx              # All cases table with filters
│   │   │   │   └── [caseId]/
│   │   │   │       ├── page.tsx          # Full case detail
│   │   │   │       └── transfer/page.tsx # Create UK transfer case
│   │   │   ├── import/
│   │   │   │   └── page.tsx              # Power BI Excel import
│   │   │   ├── products/
│   │   │   │   ├── page.tsx              # Product/parts list manager
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [productId]/edit/page.tsx
│   │   │   ├── accounts/
│   │   │   │   ├── page.tsx              # Customer account manager
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [accountId]/page.tsx
│   │   │   └── fees/
│   │   │       └── page.tsx              # Fee schedule manager
│   │   │
│   │   └── api/
│   │       ├── auth/[...all]/route.ts    # Better Auth handler
│   │       ├── cases/
│   │       │   ├── route.ts              # POST: create case
│   │       │   └── [caseId]/
│   │       │       ├── route.ts          # GET/PATCH case
│   │       │       ├── updates/route.ts  # POST: add update
│   │       │       ├── approve/route.ts  # POST: issue RMA
│   │       │       ├── reject/route.ts   # POST: reject case
│   │       │       ├── transfer/route.ts # POST: create INT case
│   │       │       ├── stage/route.ts    # PATCH: advance workshop stage
│   │       │       ├── hold/route.ts     # POST/DELETE: set or clear hold state
│   │       │       ├── respond/route.ts  # POST: customer response via token or session
│   │       │       └── attachments/route.ts
│   │       ├── products/route.ts
│   │       ├── accounts/route.ts
│   │       ├── admin/
│   │       │   └── import/route.ts       # POST: parse Excel preview; PUT: confirm import
│   │       ├── stripe/
│   │       │   ├── checkout/route.ts     # Create payment intent
│   │       │   └── webhook/route.ts      # Stripe webhook handler
│   │       └── webhooks/
│   │           └── supabase/route.ts     # DB triggers → email
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── AdminSidebar.tsx
│   │   ├── cases/
│   │   │   ├── CaseTimeline.tsx
│   │   │   ├── CaseStatusBadge.tsx
│   │   │   ├── CaseUpdateForm.tsx
│   │   │   ├── CaseSummaryCard.tsx
│   │   │   ├── WorkshopStageTracker.tsx  # Planner bucket workshop stage progress bar
│   │   │   ├── HoldStateBanner.tsx       # Amber hold / Action Required banner
│   │   │   └── CustomerResponseForm.tsx  # Inline response box (portal + token page)
│   │   ├── forms/
│   │   │   ├── RMASubmitForm.tsx         # Multi-step — see Section 7
│   │   │   ├── ProductSelector.tsx       # Dynamic dropdown from DB
│   │   │   └── FileUpload.tsx
│   │   └── ui/                           # Shared UI primitives
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       ├── Modal.tsx
│   │       └── DataTable.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Browser client
│   │   │   ├── server.ts                 # Server client (cookies)
│   │   │   └── schema.sql                # Full DB schema with RLS
│   │   ├── auth.ts                       # Better Auth config
│   │   ├── stripe.ts                     # Stripe client + helpers
│   │   ├── resend.ts                     # Resend client
│   │   ├── case-number.ts                # CASE-/RMA-/INT- generator
│   │   ├── office-routing.ts             # UK/US queue + email routing
│   │   ├── tokens.ts                     # Generate, validate, expire response tokens
│   │   └── import/
│   │       ├── parser.ts                 # SheetJS parser + column mapper
│   │       ├── stage-mapper.ts           # Planner bucket → portal stage mapping
│   │       └── validator.ts              # Row validation, mismatch detection
│   │
│   ├── emails/
│   │   ├── CaseSubmitted.tsx
│   │   ├── RMAIssued.tsx
│   │   ├── CaseUpdate.tsx
│   │   ├── CaseRejected.tsx
│   │   ├── PaymentRequired.tsx
│   │   ├── InternalTransferCreated.tsx
│   │   ├── WorkshopStageUpdate.tsx       # Customer notified of stage advance
│   │   ├── ActionRequired.tsx            # Awaiting customer — contains token link
│   │   ├── HoldStateChanged.tsx          # Other hold states
│   │   ├── HoldCleared.tsx               # Work resumed
│   │   └── CustomerResponseReceived.tsx  # Staff notified of customer reply
│   │
│   └── types/
│       ├── database.ts                   # Supabase generated types
│       ├── case.ts
│       ├── workshop.ts                   # WorkshopStage and HoldReason enums
│       └── auth.ts
```

---

## Section 7 — RMA Submission Form

The submission form at `/submit` is a multi-step wizard. Each step is a separate component rendered within the same page. Use React state (or React Hook Form + Zod) to manage and validate across steps.

### Step 1 — Customer Details

- If logged in: pre-fill from account. Allow editing.
- If not logged in: prompt to login/register OR continue as guest (email only)
- Fields: Full Name, Company, Email, Phone
- Shipping address for return of repaired parts

### Step 2 — Office & Return Details

- Select Cosworth Office: UK / USA (drives queue routing)
- Required return date (date picker)
- PO Number (shown only if customer account has `credit_terms=true` and `po_required=true`)

### Step 3 — Products (repeatable)

- Dynamic dropdown populated from `products` table (`active=true` only), grouped by category
- Per product: Serial Number, Quantity, Fault Notes
- "Add Another Product" button — no hardcoded limit
- File upload per case: photos, fault evidence (max 10 files, 10MB each)

### Step 4 — Fault Details

- Fault Type: Repair / End of Season Service / Service Plan / Loan Unit Return / Code Update
- Was fault information displayed on the unit? (Yes/No — if Yes, capture details)
- Have you tested on another unit? (Yes/No)
- Does the fault follow the unit or the car? (Unit / Car)
- Additional fault description (free text, required for Repair)

### Step 5 — Review & Submit

- Summary of all entered data
- Fee estimate if products have fees configured
- Payment notice if account requires upfront payment (Stripe redirect after submission)
- Submit button → creates case → returns Case ID → redirect to `/submit/success`

### Post-Submit

- Success page displays Case ID prominently
- Email sent to customer (`CaseSubmitted` template)
- Email sent to relevant office inbox (UK returns inbox or US sales inbox)
- Customer redirected to `/cases/[caseId]` if logged in

---

## Section 8 — Admin Portal

### 8.1 Dashboard (`/admin/dashboard`)

- Case queue filtered by office based on user role (`staff_uk` sees UK queue, `staff_us` sees US queue, `admin` sees all)
- Columns: Case ID, Customer, Company, Products, Workshop Stage, Status, Assigned To, Date, Required Return Date
- Filter by: Status, Workshop Stage, Hold State, Office, Assigned To, Date range
- Sort by: Date submitted, Required return date, Status
- Unread/new cases highlighted
- Cases in `AWAITING_CUSTOMER` hold flagged prominently

### 8.2 Case Detail (`/admin/cases/[caseId]`)

- All case fields displayed with edit capability for authorised staff
- **Approve** button → generates RMA number, updates status to `RMA_ISSUED`, sends `RMAIssued` email to customer and UK returns inbox
- **Reject** button → requires reason, sends `CaseRejected` email to customer
- Add SAP Repair Order field
- Status dropdown — manual override for any status
- Assign to staff member dropdown
- **Workshop Stage control** — click any stage button to advance or set; shows current stage highlighted. See Section 14.
- **Hold State control** — dropdown to set or clear any hold state. See Section 14.
- "Send to UK for Repair" checkbox (USA cases only) → creates `INT-*` case, notifies UK team
- Update timeline — staff can post customer-visible or internal-only updates
- Attachments panel — view and upload files
- SAP data panel — shows all Power BI imported fields (value, hours, dates). Staff-visible only.
- Stripe payment status shown if applicable

### 8.3 Import Page (`/admin/import`)

See Section 15 for full specification.

### 8.4 Products & Fees (`/admin/products`)

- Combined Products and Fees management on a single page — no separate fees page
- Single table showing: Part Number, Category, Description, Test Fee, Standard Repair Fee, Major Repair Fee, Active toggle, Edit
- Click any fee cell to edit inline — no need to open the product edit page for fee changes
- Toggle active/inactive per product (controls visibility on customer form instantly)
- CSV import option for bulk updates
- Product edit page for full detail: part number, variant, display name, category, notes, and all three fees

### 8.5 Customer Accounts (`/admin/accounts`)

- View all customer accounts
- Set `credit_terms` flag (Yes/No)
- Set `po_required` flag
- Add internal account notes
- View all cases linked to an account



---

## Section 9 — Email Notifications

Use Resend with React Email templates. All emails must use Cosworth branding: navy header, logo, clean sans-serif layout.

| Template | Trigger | Recipients |
|---|---|---|
| `CaseSubmitted` | Form submitted | Customer + UK/US office inbox |
| `RMAIssued` | Case approved | Customer + UK returns inbox (UK cases) |
| `CaseRejected` | Case rejected | Customer |
| `CaseUpdate` | Staff posts customer-visible update | Customer |
| `PaymentRequired` | `AWAITING_PAYMENT` status set | Customer |
| `PaymentReceived` | Stripe webhook paid | Customer |
| `InternalTransferCreated` | INT case created | UK service team inbox |
| `InternalTransferUpdate` | INT case update posted | US sales inbox |
| `InternalTransferClosed` | INT case closed | US sales inbox + parent case status updated |
| `WorkshopStageUpdate` | Workshop stage advances | Customer — shows new stage and progress snapshot |
| `ActionRequired` | Hold `AWAITING_CUSTOMER` set | Customer — contains tokenised response link, 7-day expiry |
| `HoldStateChanged` | Any other hold state set | Customer — neutral on hold message; `CREDIT_HELD` shows no reason |
| `HoldCleared` | Hold state removed | Customer — work has resumed |
| `CustomerResponseReceived` | Customer responds via portal or token link | Assigned staff member + UK/US office inbox |

### 9.1 Office Email Routing

- UK cases approved → email to: `UK_RETURNS_EMAIL` env var (e.g. `returns@cosworth.com`)
- US cases submitted/approved → email to: `US_SALES_EMAIL` env var (e.g. `us-sales@cosworth.com`)
- Internal transfer created → email to: `UK_RETURNS_EMAIL`
- Internal transfer update → email to: `US_SALES_EMAIL`

Store all office email addresses as environment variables so they can be updated without code changes.

---

## Section 10 — Authentication & Authorisation

### 10.1 Better Auth Configuration

- Email/password authentication for all users
- Email verification required for customer registration
- Password reset flow
- Session stored in Supabase via Better Auth adapter

### 10.2 Roles & Permissions

| Role | Scope | Permissions |
|---|---|---|
| `customer` | Own cases only | Submit, view, track own cases. Download attachments. Make payment. |
| `staff_uk` | UK queue | Full case management for UK cases. Create/edit products, fees. View UK accounts. Cannot access US queue. |
| `staff_us` | US queue | Full case management for US cases. Create INT transfer cases. View US accounts. Cannot access UK queue. |
| `admin` | Global | All of the above. Manage user accounts and roles. View all offices. Access all admin pages. |

### 10.3 Route Protection

- `middleware.ts` intercepts all requests
- `/admin/*` — requires `staff_uk`, `staff_us`, or `admin` role
- `/cases/*` — requires authentication (customer or staff)
- `/submit` — accessible to guests (no auth required to submit)
- `/cases/[caseId]/respond` — accessible via valid token (no auth required)
- All `/api/*` routes — validate session and role server-side on every request

---

## Section 11 — Payment Flow (Stripe)

Stripe is already configured for Cosworth's subscription sales. Reuse the existing Stripe account. Add the RMA portal as a new product/payment flow within that account.

### 11.1 When Payment Is Required

- `customer_accounts.credit_terms = false` (no credit terms set up)
- Guest submission (no account)
- `payment_required` flag can also be manually set by staff on a case

### 11.2 Payment Flow

- On case submission, if payment required: status set to `AWAITING_PAYMENT`
- Customer receives `PaymentRequired` email with payment link
- Payment page at `/payment/[caseId]` — Stripe Elements embedded
- On successful payment: Stripe webhook updates case `payment_status` to `paid`, triggers status change to `UNDER_REVIEW`
- Staff can also mark payment as `waived` or `invoiced` (for credit accounts using PO)

### 11.3 Fee Calculation

- Inspection fee is charged upfront for Repair cases
- Full repair fee estimate shown to customer on submission (from product fee schedule)
- Final repair fee set by staff and triggers a new payment request if higher than estimate
- Service Plan and End of Season Service use fixed `standard_repair_fee` from product table

---

## Section 12 — Website Redirect & Deployment

### 12.1 Redirect Instruction (Cosworth Web Team)

The following redirect must be added to the CMS or server config for `cosworth.com`. This is outside the scope of the app build but must be coordinated with the Cosworth web team:

```
Redirect 301 /motorsport/returns/ https://returns.cosworth.com/submit
```

This ensures all existing links and bookmarks to the old form continue to work seamlessly.

### 12.2 DNS

- Create CNAME record: `returns.cosworth.com` → `cname.vercel-dns.com`
- Add domain in Vercel project settings
- SSL provisioned automatically by Vercel

### 12.3 Environment Variables

Configure in Vercel environment settings and in `.env.local` for development:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=https://returns.cosworth.com
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
UK_RETURNS_EMAIL=returns@cosworth.com
US_SALES_EMAIL=us-sales@cosworth.com
NEXT_PUBLIC_APP_URL=https://returns.cosworth.com
```

---

## Section 13 — Delivery Requirements

### 13.1 Must-Have for MVP

- [ ] Full folder structure scaffolded and compiling with no TypeScript errors
- [ ] Supabase `schema.sql` with all tables, RLS policies, and seed data (products list pre-loaded)
- [ ] RMA submission form — all 5 steps, validation, multi-product
- [ ] Customer case tracking view with status timeline
- [ ] Workshop stage progress bar showing all 7 Planner bucket stages (no SAP milestone tier on customer view)
- [ ] Hold state banner with Action Required response mechanism
- [ ] Admin case queue and case detail with approve/reject/update/stage/hold controls
- [ ] Better Auth with all four roles
- [ ] Email notifications — all templates in Section 9
- [ ] Stripe payment flow for non-credit customers
- [ ] UK/US office routing
- [ ] Products admin CRUD
- [ ] Power BI import page with preview-before-confirm flow
- [ ] Tokenised customer response endpoint
- [ ] Cosworth branding applied throughout
- [ ] `CREDIT_HELD` label never exposed to customer

### 13.2 Phase 2 (Post-MVP)

- Customer account self-registration with admin approval
- CSV import for bulk product updates
- SAP integration for auto-populating repair order details
- Power Automate webhook (when Microsoft Planner exposes richer stage data)
- Reporting dashboard (cases by status, office, month, turnaround time)
- Customer portal mobile app (React Native or PWA)

### 13.3 Code Quality Standards

- TypeScript strict mode — no `any` types
- All API routes validate input with Zod
- RLS enforced in Supabase — never rely solely on app-level auth checks
- No secrets in client-side code
- All forms have loading and error states
- Accessible (WCAG AA minimum): proper labels, focus management, colour contrast

---

## Section 14 — Workshop Stages & Hold States

The SAP repair process has three milestones: **Booked In → Repair → Completed**. The portal adds granular workshop stages that sit within the SAP Repair milestone, updated manually by UK service staff or via the Power BI Excel import described in Section 15.

---

### 14.1 Workshop Stage Sequence

The following is the linear workshop progress sequence. All stages are **customer-visible** in the case progress tracker.

| # | Stage (Portal) | Planner Bucket | Customer-Facing Label |
|---|---|---|---|
| 1 | `AWAITING_TEST` | Awaiting test | Awaiting Test |
| 2 | `RETEST` | Re-test | Under Test |
| 3 | `REWORK` | Rework | In Rework |
| 4 | `FINAL_TEST` | Final test | Final Test |
| 5 | `CLEAN_AND_LABEL` | Clean and label | Finishing |
| 6 | `INSPECTION` | Inspection | Inspection |
| 7 | `WORKSHOP_COMPLETE` | Completed | Repair Complete |

> **Note:** Rework can occur multiple times. The stage is not a strict linear gate — staff can set any stage in any order to reflect the actual repair state. The progress bar shows the furthest stage reached.

> **UI Note:** The customer-facing workshop tracker shows only the 7 Planner stages. There is no SAP milestone tier displayed to customers. SAP reference numbers (Sales Order, Works Order) are visible to staff only in the admin case detail.

---

### 14.2 Hold States

Hold states pause the workflow. They are set from the Planner bucket import or manually by staff. When active, the customer-facing tracker shows an amber **On Hold** indicator alongside the last active workshop stage.

| Planner Bucket | Customer-Facing Label | Behaviour |
|---|---|---|
| Awaiting parts | On Hold — Awaiting Parts | Informational. No customer action needed. Staff update when parts arrive. |
| With support | On Hold — Under Investigation | Informational. Internal investigation in progress. |
| With engineering | On Hold — Engineering Review | Informational. Escalated to engineering team. |
| **Awaiting confirmation customer** | **Action Required — Response Needed** | **CRITICAL:** triggers immediate customer email + portal Action Required banner with response box. See Section 14.3. |
| **Credit held** | **On Hold — Please Contact Us** | Customer sees neutral label **only**. Internal credit hold flag visible to staff and admin only. **Never expose "credit held" wording to customer under any circumstances.** |

---

### 14.3 Customer Response Mechanism

When a case enters the **Awaiting confirmation — customer** hold state, the following must trigger simultaneously:

#### Portal Response

- An amber **Action Required** banner appears at the top of the customer case detail page
- The banner displays the staff message/question that triggered the hold
- A text input and **Send Response** button are displayed inline in the banner
- On submit: response posted to case timeline, hold cleared, staff notified by email, case flagged in admin queue

#### Email Response — Tokenised Link

- The notification email contains a secure tokenised link: `/api/cases/[caseId]/respond?token=xxxxx`
- Token is single-use, expires after 7 days, stored in `case_response_tokens` table
- Clicking the link opens a minimal branded page — **no login required** — showing the staff question and a response text box
- On submit: identical behaviour to portal response — timeline entry, hold cleared, staff notified

#### New Table: `case_response_tokens`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `case_id` | uuid, FK → cases | |
| `token` | text, unique | Cryptographically random, 32 chars |
| `created_at` | timestamptz | |
| `expires_at` | timestamptz | 7 days from creation |
| `used_at` | timestamptz, nullable | Set on use; token then invalid |

---

### 14.4 New Schema Columns — `cases` table

These columns are already included in the full `cases` table definition in Section 5.4. Listed here for reference:

`workshop_stage`, `is_on_hold`, `hold_reason`, `hold_customer_label`, `awaiting_customer_question`, `sap_sales_order`, `sap_works_order`, `sap_booked_in_date`, `sap_estimated_completion`, `sap_order_value`, `sap_spent_hours`, `sap_days_open`, `last_import_at`

---

## Section 15 — Power BI Excel Import

Staff upload an Excel export from the Power BI repairs report to batch-update workshop stages and SAP fields across all active cases. This is the primary mechanism for keeping portal data in sync with the SAP and Planner workflow.

> **Note on automation:** Power Automate only surfaces open/completed status from Planner — it cannot expose individual bucket (stage) data. Manual import or the Excel upload route are therefore the correct approach for MVP. A Power Automate webhook integration can be revisited in Phase 2 if Microsoft improves Planner's API surface.

---

### 15.1 Import Page

- Route: `/admin/import`
- Add **Import from Power BI** link to admin sidebar under the Admin section
- Page shows: file upload zone (accepts `.xlsx` only), last import timestamp and summary, import history log

---

### 15.2 Column Mapping

The following Power BI export columns map to portal fields. The **RMA number (Description column) is the primary match key.**

| Power BI Column | Portal Field | Notes |
|---|---|---|
| **Description** | `cases.rma_number` | **PRIMARY MATCH KEY** — used to locate the case |
| Sales Order | `cases.sap_sales_order` | Update if empty or changed |
| Service Order | `cases.sap_works_order` | Update if empty or changed |
| Product Status | `cases.workshop_stage` / `hold_reason` | Mapped via Planner bucket table — see Section 15.3 |
| Order Status | `cases.sap_order_status` | open/closed — if closed, flag for staff review |
| Material | Validation only | Cross-check against `case_products.part_number` |
| Serial | `case_products.serial_number` | Cross-check; flag mismatch but do **not** overwrite |
| Customer | Validation only | Verify name matches account — flag if mismatch |
| Order Loaded | `cases.sap_booked_in_date` | Set once; do not overwrite if already populated |
| Customer Required | `cases.required_return_date` | Update if SAP date differs from portal date |
| Estimated Completion | `cases.sap_estimated_completion` | Always overwrite with latest SAP value |
| Value | `cases.sap_order_value` | Always overwrite with latest SAP value |
| Spent Hours | `cases.sap_spent_hours` | Always overwrite with latest SAP value |
| Days Open | `cases.sap_days_open` | Always overwrite with latest value |

---

### 15.3 Planner Bucket → Portal Stage Mapping

The **Product Status** column contains the Planner bucket name. Map exactly as follows (case-insensitive matching):

| Planner Bucket (exact) | Maps To | Type |
|---|---|---|
| Awaiting test | `AWAITING_TEST` | Workshop Stage |
| Re-test | `RETEST` | Workshop Stage |
| Rework | `REWORK` | Workshop Stage |
| Final test | `FINAL_TEST` | Workshop Stage |
| Clean and label | `CLEAN_AND_LABEL` | Workshop Stage |
| Inspection | `INSPECTION` | Workshop Stage |
| Completed | `WORKSHOP_COMPLETE` | Workshop Stage |
| Awaiting parts | hold: `AWAITING_PARTS` | Hold State |
| With support | hold: `WITH_SUPPORT` | Hold State |
| With engineering | hold: `WITH_ENGINEERING` | Hold State |
| Awaiting confirmation customer | hold: `AWAITING_CUSTOMER` | Hold State — triggers customer notification |
| Credit held | hold: `CREDIT_HELD` | Hold State — internal only, **never shown to customer** |

> If a Planner bucket value is not in this table, flag the row as **unrecognised** in the import summary. Do not skip silently.

---

### 15.4 Import Process Flow

1. Staff uploads `.xlsx` file on `/admin/import`
2. System parses all rows using SheetJS
3. For each row: locate case by RMA number (Description column)
4. Build a preview of all proposed changes — **do NOT apply yet**
5. Display import summary screen showing:
   - Matched cases: N
   - Unmatched RMA numbers: list them
   - Stage changes: old stage → new stage per case
   - Hold state changes: cases entering or leaving hold
   - Awaiting customer cases: highlighted in amber — will trigger email
   - Field updates: SAP fields being updated
   - Validation warnings: serial number mismatches, customer name mismatches
6. Staff reviews summary and clicks **Confirm Import**
7. All changes applied in a single database transaction
8. For any case entering `AWAITING_CUSTOMER` hold: trigger customer notification email and generate response token
9. Import log entry created with timestamp, staff member, row count, and change summary

---

### 15.5 Import History

- The `/admin/import` page shows a table of all previous imports
- Columns: Timestamp, Imported By, Rows Processed, Cases Updated, Warnings, Action Required Triggered, Unmatched
- Each entry is expandable to show the full change summary
- Import logs are **read-only and never deleted**

---

## Section 16 — Folder Structure Additions

The following files are added to the folder structure in Section 6:

| File / Directory | Purpose |
|---|---|
| `app/(admin)/import/page.tsx` | Power BI import page: upload zone, preview table, confirm, history |
| `app/(customer)/cases/[caseId]/respond/page.tsx` | Tokenised response page — no auth required |
| `api/cases/[caseId]/stage/route.ts` | PATCH: advance workshop stage manually |
| `api/cases/[caseId]/hold/route.ts` | POST/DELETE: set or clear hold state |
| `api/cases/[caseId]/respond/route.ts` | POST: customer response via token or session |
| `api/admin/import/route.ts` | POST: parse Excel and return preview; PUT: confirm import |
| `lib/import/parser.ts` | SheetJS parser and column mapper |
| `lib/import/stage-mapper.ts` | Planner bucket → portal stage mapping table |
| `lib/import/validator.ts` | Row validation and mismatch detection |
| `lib/tokens.ts` | Generate, validate, and expire response tokens |
| `emails/ActionRequired.tsx` | Customer action required email with tokenised link |
| `emails/CustomerResponseReceived.tsx` | Staff notification when customer responds |
| `emails/HoldStateChanged.tsx` | Customer notification for hold state changes |
| `emails/HoldCleared.tsx` | Customer notification — work resumed |
| `emails/WorkshopStageUpdate.tsx` | Customer notification — stage advanced |
| `types/workshop.ts` | `WorkshopStage` and `HoldReason` enums |
| `components/cases/WorkshopStageTracker.tsx` | Planner bucket workshop stage progress bar |
| `components/cases/HoldStateBanner.tsx` | Amber hold / Action Required banner |
| `components/cases/CustomerResponseForm.tsx` | Inline response box (portal + token page) |

> All items in this section are already incorporated into the folder structure shown in Section 6.

---

## Section 17 — Additional Email Notifications

The following email templates are added to the list in Section 9:

| Template | Trigger | Recipients |
|---|---|---|
| `WorkshopStageUpdate` | Workshop stage advances (manual or import) | Customer — shows new stage and progress bar snapshot |
| `ActionRequired` | Hold `AWAITING_CUSTOMER` set | Customer — contains tokenised response link, 7-day expiry notice |
| `HoldStateChanged` | Any other hold state set | Customer — neutral on hold message; `CREDIT_HELD` shows no reason |
| `HoldCleared` | Hold state removed | Customer — work has resumed notification |
| `CustomerResponseReceived` | Customer responds via portal or token link | Assigned staff member and UK/US office inbox |

> These templates are already included in the full email list in Section 9 for reference.

---

## Section 18 — Updated MVP Checklist

The following items are added to the MVP must-have list in Section 13.1:

- [ ] Workshop stage progress bar on customer case detail — all 7 Planner stages visible
- [ ] Hold state amber banner on customer case detail
- [ ] **Action Required** banner with inline response box for `AWAITING_CUSTOMER` hold
- [ ] Tokenised email response endpoint — `/api/cases/[caseId]/respond?token=xxx`
- [ ] `case_response_tokens` table with 7-day expiry and single-use enforcement
- [ ] Staff stage advance control on admin case detail
- [ ] Staff hold state set/clear control on admin case detail
- [ ] Power BI import page (`/admin/import`) with preview-before-confirm flow
- [ ] Import column mapping per Section 15.2
- [ ] Planner bucket to stage mapping per Section 15.3
- [ ] Import history log — read-only, never deleted
- [ ] Customer Accounts page — list with credit terms, PO required, active toggle
- [ ] Account detail page — settings, cases list, credit/PO toggles, billing address, deactivate
- [ ] `CREDIT_HELD` label **never** exposed to customer under any circumstances

---

*End of Brief v1.1 — Cosworth Electronics RMA & Returns Portal*
*Read in conjunction with the interactive HTML prototype (cosworth-rma-portal-v2.html)*
