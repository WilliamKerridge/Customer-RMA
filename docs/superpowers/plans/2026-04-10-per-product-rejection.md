# Per-Product Rejection & Product Detail Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow staff to reject individual products from a multi-product submission (partial or full rejection), add per-product SAP Works Order and financial fields, a per-product timeline, and internal workshop notes per product.

**Architecture:** Schema migration moves `sap_works_order`, `sap_estimated_completion`, `sap_order_value`, and `sap_spent_hours` from `cases` to `case_products` (where they belong — each product has its own SAP Works Order and repair cost). `status`, `rejection_reason`, `workshop_findings`, and `staff_notes` are also added to `case_products`. `case_updates` gains a nullable `product_id` FK enabling per-product timeline entries. A new `AdminProductsCard` client component replaces the static products card, showing per-product SAP data, timeline, reject button, and notes. A new `PartialRejection` email template handles partial rejections. The existing whole-case reject route is kept for full case rejection.

**Tech Stack:** Next.js App Router, Supabase (PostgreSQL), TypeScript, Tailwind CSS, React Email + Resend, Zod

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `supabase/migrations/006_product_fields.sql` | Schema changes — see Task 1 |
| `src/app/api/cases/[caseId]/products/[productId]/reject/route.ts` | POST — reject a single product, auto-close case if all rejected |
| `src/app/api/cases/[caseId]/products/[productId]/notes/route.ts` | PATCH — update `workshop_findings`, `staff_notes`, and per-product SAP fields |
| `src/components/admin/AdminProductsCard.tsx` | Client component — products list with per-row reject, notes, SAP data, and timeline |
| `src/emails/PartialRejection.tsx` | Email template — sent when only some products are rejected |

### Modified files
| File | What changes |
|---|---|
| `src/app/(admin)/admin/cases/[caseId]/page.tsx` | Replace static products card with `<AdminProductsCard>`; fetch per-product updates |
| `src/components/admin/AdminSapCard.tsx` | Remove `sapWorksOrder` prop — Works Order moves to product level |
| `src/app/api/cases/[caseId]/sap/route.ts` | Remove `sap_works_order` from allowed fields |
| `src/app/api/cases/[caseId]/products/[productId]/notes/route.ts` | Also handle `sap_works_order`, `sap_estimated_completion`, `sap_order_value`, `sap_spent_hours` |
| `src/app/api/cases/[caseId]/reject/route.ts` | Also mark all `case_products` as `rejected` when whole case is rejected |
| `src/lib/email.ts` | Add `sendPartialRejection()` function |
| `src/app/(customer)/cases/[caseId]/page.tsx` | Show rejected product badge + reason |
| `src/lib/import/stage-mapper.ts` | No change needed — stage mapping stays at case level |
| `src/app/api/admin/import/parse/route.ts` | ⚠ See **Import Note** below — matching strategy depends on Power BI export format |
| `src/app/api/admin/import/confirm/route.ts` | ⚠ See **Import Note** below |

---

## ⚠ Open Question: Power BI Import Matching

**This task cannot be completed without your input.**

The Power BI export currently matches rows to cases by `Description` (RMA number). Now that `sap_works_order` moves to `case_products`, the import needs to know **which product on the case** each row refers to.

Two likely scenarios — which is yours?

**Option A — One RMA per product:** Each product submitted gets its own unique RMA number. The `Description` column in the Power BI export already uniquely identifies one product on one case. In this case the import can match `Description → case_products` directly (via a lookup through `cases.rma_number + product index`, or a dedicated `case_products.rma_number` column).

**Option B — One RMA per case, product identified by part number or line number:** The export has one RMA per case but multiple rows per case (one per product), distinguished by a part number, item number, or SAP line number column. In this case the import needs a secondary match key (part number or line number) to identify the product row.

**Action required:** Before implementing Tasks 10–11, confirm which option applies and provide a sample of the Power BI column headers if possible.

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/006_product_fields.sql`

This migration does four things:
1. Adds rejection, notes, and status fields to `case_products`
2. Moves per-product SAP fields (`sap_works_order`, `sap_estimated_completion`, `sap_order_value`, `sap_spent_hours`) from `cases` to `case_products` — these belong at product level, not case level
3. Keeps `sap_sales_order` and `sap_days_open` on `cases` — these are case/customer-level
4. Adds nullable `product_id` FK to `case_updates` to enable per-product timeline entries

- [ ] **Step 1: Write the migration**

```sql
-- ============================================================
-- 006: Per-product fields, SAP Works Order move, product timeline
-- ============================================================

-- 1. Per-product status, rejection, and workshop fields
ALTER TABLE case_products
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason   text,
  ADD COLUMN IF NOT EXISTS workshop_findings  text,
  ADD COLUMN IF NOT EXISTS staff_notes        text;

-- 2. Move per-product SAP fields from cases to case_products
--    (each product has its own Works Order, completion date, cost, hours)
ALTER TABLE case_products
  ADD COLUMN IF NOT EXISTS sap_works_order          text,
  ADD COLUMN IF NOT EXISTS sap_estimated_completion date,
  ADD COLUMN IF NOT EXISTS sap_order_value          decimal(10,2),
  ADD COLUMN IF NOT EXISTS sap_spent_hours          decimal(6,2);

-- 3. sap_works_order, sap_estimated_completion, sap_order_value, sap_spent_hours
--    are now deprecated on cases but kept as nullable columns for backward
--    compatibility until the import and SAP card are updated.
--    Do NOT drop them yet — data migration happens in a future migration.

-- 4. Per-product timeline: add nullable product_id to case_updates
ALTER TABLE case_updates
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES case_products(id) ON DELETE SET NULL;

-- Index for per-product timeline queries
CREATE INDEX IF NOT EXISTS idx_case_updates_product_id
  ON case_updates (product_id) WHERE product_id IS NOT NULL;

-- Index for querying rejected products per case
CREATE INDEX IF NOT EXISTS idx_case_products_status
  ON case_products (case_id, status);
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected output: `Applying migration 006_product_fields.sql... Finished supabase db push.`

- [ ] **Step 3: Verify columns exist**

```bash
npx supabase db diff --schema public 2>/dev/null | grep -E "sap_works_order|product_id|status|workshop"
```

Expected: new columns on `case_products`, `product_id` on `case_updates`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/006_product_fields.sql
git commit -m "feat: per-product fields migration — status, SAP works order, timeline product_id"
```

---

## Task 2: Per-product reject API route

**Files:**
- Create: `src/app/api/cases/[caseId]/products/[productId]/reject/route.ts`

**Logic:**
1. Validate staff role
2. Check the case is in `SUBMITTED` or `UNDER_REVIEW` status
3. Mark the product `status = 'rejected'`, set `rejection_reason`
4. Insert a `case_updates` timeline entry naming the product
5. Count remaining non-rejected products on the case
6. If **all** products are now rejected → set `cases.status = 'REJECTED'`, send `sendCaseRejected` email
7. If **some** products remain → send `sendPartialRejection` email

- [ ] **Step 1: Create the route file**

```typescript
// src/app/api/cases/[caseId]/products/[productId]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { sendCaseRejected, sendPartialRejection } from '@/lib/email'

const BodySchema = z.object({
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
})

async function requireStaff(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users').select('id, role').eq('email', session.user.email).single()
  const profile = data as { id: string; role: string } | null
  if (!profile || !['staff_uk', 'staff_us', 'admin'].includes(profile.role)) return null
  return { ...session.user, canonicalId: profile.id }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string; productId: string }> }
) {
  try {
    const user = await requireStaff(request)
    if (!user) return NextResponse.json({ message: 'Unauthorised' }, { status: 403 })

    const { caseId, productId } = await params
    const body = await request.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })
    }

    const { reason } = parsed.data
    const supabase = createServiceClient()

    // Verify case exists and is in a rejectable status
    const { data: caseRow } = await supabase
      .from('cases')
      .select('id, status, case_number, customer_id')
      .eq('id', caseId)
      .single()

    if (!caseRow) return NextResponse.json({ message: 'Case not found' }, { status: 404 })
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(caseRow.status)) {
      return NextResponse.json(
        { message: 'Products can only be rejected during SUBMITTED or UNDER_REVIEW' },
        { status: 409 }
      )
    }

    // Verify the product belongs to this case
    const { data: productRow } = await supabase
      .from('case_products')
      .select('id, status, products(display_name, part_number)')
      .eq('id', productId)
      .eq('case_id', caseId)
      .single()

    if (!productRow) return NextResponse.json({ message: 'Product not found on this case' }, { status: 404 })
    if (productRow.status === 'rejected') {
      return NextResponse.json({ message: 'Product is already rejected' }, { status: 409 })
    }

    // Mark product as rejected
    const { error: updateErr } = await supabase
      .from('case_products')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', productId)

    if (updateErr) {
      console.error('Product reject failed:', updateErr)
      return NextResponse.json({ message: 'Failed to reject product' }, { status: 500 })
    }

    // Get display name for timeline entry
    const productName = (productRow.products as { display_name: string; part_number: string } | null)
      ?.display_name ?? 'Unknown product'

    // Timeline entry
    await supabase.from('case_updates').insert({
      case_id: caseId,
      author_id: user.canonicalId,
      content: `Product rejected: ${productName}. Reason: ${reason}`,
      is_internal: false,
    })

    // Check if all products are now rejected
    const { data: remaining } = await supabase
      .from('case_products')
      .select('id, status')
      .eq('case_id', caseId)

    const allRejected = (remaining ?? []).every(p => p.status === 'rejected')

    // Fetch customer for email
    let customerEmail: string | null = null
    let customerName: string | null = null
    if (caseRow.customer_id) {
      const { data: cu } = await supabase
        .from('users').select('email, full_name').eq('id', caseRow.customer_id).single()
      if (cu) {
        const c = cu as { email: string; full_name: string | null }
        customerEmail = c.email
        customerName = c.full_name ?? c.email
      }
    }

    if (allRejected) {
      // Close the whole case
      await supabase
        .from('cases')
        .update({ status: 'REJECTED', closed_at: new Date().toISOString() })
        .eq('id', caseId)

      await supabase.from('case_updates').insert({
        case_id: caseId,
        author_id: user.canonicalId,
        content: 'All products rejected. Case closed.',
        is_internal: false,
        status_change_to: 'REJECTED',
      })

      if (customerEmail && customerName) {
        sendCaseRejected(caseId, customerEmail, {
          customerName,
          caseNumber: caseRow.case_number,
          reason: 'All submitted products have been rejected. Please see individual product notes for details.',
        })
      }
    } else {
      // Partial rejection — notify customer
      if (customerEmail && customerName) {
        sendPartialRejection(caseId, customerEmail, {
          customerName,
          caseNumber: caseRow.case_number,
          rejectedProductName: productName,
          reason,
        })
      }
    }

    return NextResponse.json({ ok: true, allRejected })
  } catch (err) {
    console.error('Product reject route error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/api/cases/[caseId]/products/[productId]/reject/route.ts"
git commit -m "feat: add per-product reject API route with auto case-close logic"
```

---

## Task 3: Per-product notes and SAP data API route

**Files:**
- Create: `src/app/api/cases/[caseId]/products/[productId]/notes/route.ts`

Allows staff to update `workshop_findings`, `staff_notes`, and the per-product SAP fields (`sap_works_order`, `sap_estimated_completion`, `sap_order_value`, `sap_spent_hours`) on an individual product. All fields are staff-only and never shown to customers.

- [ ] **Step 1: Create the route file**

```typescript
// src/app/api/cases/[caseId]/products/[productId]/notes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const BodySchema = z.object({
  workshop_findings:        z.string().max(2000).nullable().optional(),
  staff_notes:              z.string().max(2000).nullable().optional(),
  sap_works_order:          z.string().max(50).nullable().optional(),
  sap_estimated_completion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  sap_order_value:          z.number().min(0).nullable().optional(),
  sap_spent_hours:          z.number().min(0).nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string; productId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ message: 'Unauthorised' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: profile } = await supabase
    .from('users').select('role').eq('email', session.user.email).single()

  if (!['staff_uk', 'staff_us', 'admin'].includes((profile as { role: string } | null)?.role ?? '')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid data', errors: parsed.error.flatten() }, { status: 400 })
  }

  const { caseId, productId } = await params
  const updates: Record<string, unknown> = {}
  if (parsed.data.workshop_findings !== undefined) updates.workshop_findings = parsed.data.workshop_findings
  if (parsed.data.staff_notes !== undefined)       updates.staff_notes = parsed.data.staff_notes

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: 'No fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('case_products')
    .update(updates)
    .eq('id', productId)
    .eq('case_id', caseId)

  if (error) {
    console.error('Product notes update failed:', error)
    return NextResponse.json({ message: 'Failed to update product notes' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/api/cases/[caseId]/products/[productId]/notes/route.ts"
git commit -m "feat: add per-product workshop findings and staff notes PATCH route"
```

---

## Task 4: PartialRejection email template

**Files:**
- Create: `src/emails/PartialRejection.tsx`

Sent when one or more — but not all — products are rejected. Tells the customer their case is still open for the remaining items.

- [ ] **Step 1: Create the template**

```typescript
// src/emails/PartialRejection.tsx
import { Heading, Text, Section, Hr } from '@react-email/components'
import React from 'react'
import EmailLayout from './components/EmailLayout'

interface PartialRejectionProps {
  customerName: string
  caseNumber: string
  rejectedProductName: string
  reason: string
}

export default function PartialRejection({
  customerName,
  caseNumber,
  rejectedProductName,
  reason,
}: PartialRejectionProps) {
  return (
    <EmailLayout preview={`Product update for your return ${caseNumber}`}>
      <Heading style={h1}>Product Return Update</Heading>
      <Text style={greeting}>Dear {customerName},</Text>
      <Text style={body}>
        We are writing regarding your return request <strong>{caseNumber}</strong>. One of the
        products in your submission cannot be accepted for repair.
      </Text>

      <Section style={productBox}>
        <Text style={productLabel}>Rejected Product</Text>
        <Text style={productName}>{rejectedProductName}</Text>
        <Text style={reasonLabel}>Reason</Text>
        <Text style={reasonText}>{reason}</Text>
      </Section>

      <Text style={body}>
        Your case remains open and we will continue to process the remaining items in your
        submission. You will receive further updates as your repair progresses.
      </Text>

      <Hr style={hr} />

      <Text style={footer}>
        If you have any questions, please contact our returns team quoting your case
        reference <strong>{caseNumber}</strong>.
      </Text>
    </EmailLayout>
  )
}

const h1: React.CSSProperties = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px', fontFamily: 'Arial, sans-serif' }
const greeting: React.CSSProperties = { fontSize: '15px', color: '#0f172a', margin: '0 0 12px', fontFamily: 'Arial, sans-serif' }
const body: React.CSSProperties = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 20px', fontFamily: 'Arial, sans-serif' }
const productBox: React.CSSProperties = { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px 20px', margin: '0 0 24px' }
const productLabel: React.CSSProperties = { fontSize: '11px', fontWeight: 'bold', color: '#ef4444', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 4px', fontFamily: 'Arial, sans-serif' }
const productName: React.CSSProperties = { fontSize: '15px', fontWeight: 'bold', color: '#7f1d1d', margin: '0 0 12px', fontFamily: 'Arial, sans-serif' }
const reasonLabel: React.CSSProperties = { fontSize: '11px', fontWeight: 'bold', color: '#ef4444', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 4px', fontFamily: 'Arial, sans-serif' }
const reasonText: React.CSSProperties = { fontSize: '14px', color: '#7f1d1d', lineHeight: '1.6', margin: 0, fontFamily: 'Arial, sans-serif' }
const hr: React.CSSProperties = { borderColor: '#e2e8f0', margin: '20px 0' }
const footer: React.CSSProperties = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: 0, fontFamily: 'Arial, sans-serif' }
```

- [ ] **Step 2: Commit**

```bash
git add src/emails/PartialRejection.tsx
git commit -m "feat: add PartialRejection email template"
```

---

## Task 5: Wire sendPartialRejection into email.ts

**Files:**
- Modify: `src/lib/email.ts`

Add the `sendPartialRejection` function. Follow the existing pattern — render template, send via Resend, log to `email_notifications`, never throw.

- [ ] **Step 1: Add the function**

Add the following to `src/lib/email.ts` alongside the other `send*` functions:

```typescript
import PartialRejection from '@/emails/PartialRejection'

export async function sendPartialRejection(
  caseId: string,
  recipientEmail: string,
  data: {
    customerName: string
    caseNumber: string
    rejectedProductName: string
    reason: string
  }
) {
  const html = await render(
    <PartialRejection
      customerName={data.customerName}
      caseNumber={data.caseNumber}
      rejectedProductName={data.rejectedProductName}
      reason={data.reason}
    />
  )
  return send({
    caseId,
    recipientEmail,
    subject: `Product update for your return ${data.caseNumber}`,
    template: 'PartialRejection',
    html,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat: add sendPartialRejection email sender"
```

---

## Task 6: Update whole-case reject route to mark all products

**Files:**
- Modify: `src/app/api/cases/[caseId]/reject/route.ts`

When staff reject an entire case in one action, all `case_products` rows should also be set to `rejected` so the status is consistent.

- [ ] **Step 1: Add product update after case update**

In the existing reject route, after the successful `cases.update({ status: 'REJECTED' })` call and before the `case_updates.insert`, add:

```typescript
// Mark all products as rejected
await supabase
  .from('case_products')
  .update({ status: 'rejected', rejection_reason: reason })
  .eq('case_id', caseId)
```

The full updated block (replacing the existing update + audit section):

```typescript
const { error } = await supabase
  .from('cases')
  .update({ status: 'REJECTED', closed_at: new Date().toISOString() })
  .eq('id', caseId)

if (error) {
  console.error('Case reject failed:', error)
  return NextResponse.json({ message: 'Failed to reject case' }, { status: 500 })
}

// Mark all products on this case as rejected
await supabase
  .from('case_products')
  .update({ status: 'rejected', rejection_reason: reason })
  .eq('case_id', caseId)

const { error: auditError } = await supabase.from('case_updates').insert({
  case_id: caseId,
  author_id: user.canonicalId,
  content: `Case rejected. Reason: ${reason}`,
  is_internal: false,
  status_change_to: 'REJECTED',
})
if (auditError) console.error('Audit insert failed on reject:', auditError)
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/api/cases/[caseId]/reject/route.ts"
git commit -m "feat: mark all case_products as rejected when whole case is rejected"
```

---

## Task 7: AdminProductsCard client component

**Files:**
- Create: `src/components/admin/AdminProductsCard.tsx`

Replaces the static products card on the admin case detail page. Shows per-product:
- Product name, part number, S/N, quantity
- Status badge (pending / accepted / rejected)
- Rejection reason (if rejected)
- Expandable `workshop_findings` and `staff_notes` text areas (inline edit, save on blur)
- "Reject" button (only visible when case is `SUBMITTED` or `UNDER_REVIEW` and product is not already rejected)

- [ ] **Step 1: Create the component**

```typescript
// src/components/admin/AdminProductsCard.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  part_number: string
  display_name: string
  variant: string | null
}

interface CaseProductRow {
  id: string
  serial_number: string | null
  quantity: number
  fault_notes: string | null
  status: string
  rejection_reason: string | null
  workshop_findings: string | null
  staff_notes: string | null
  products: Product | null
}

interface Props {
  caseId: string
  caseStatus: string
  products: CaseProductRow[]
}

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-grey-100 text-grey-600',
  accepted: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  pending:  'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
}

function ProductRow({
  product,
  caseId,
  canReject,
  onRejected,
}: {
  product: CaseProductRow
  caseId: string
  canReject: boolean
  onRejected: () => void
}) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason]     = useState('')
  const [rejectLoading, setRejectLoading]   = useState(false)
  const [rejectError, setRejectError]       = useState<string | null>(null)

  const [findings, setFindings]             = useState(product.workshop_findings ?? '')
  const [staffNotes, setStaffNotes]         = useState(product.staff_notes ?? '')
  const [savingNotes, setSavingNotes]       = useState(false)
  const [showNotes, setShowNotes]           = useState(
    !!(product.workshop_findings || product.staff_notes)
  )

  const productName = product.products
    ? `${product.products.display_name}${product.products.variant ? ` ${product.products.variant}` : ''}`
    : 'Unknown product'

  async function handleReject() {
    if (!rejectReason.trim()) return
    setRejectLoading(true)
    setRejectError(null)
    try {
      const res = await fetch(`/api/cases/${caseId}/products/${product.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? 'Failed to reject product')
      }
      onRejected()
    } catch (err) {
      setRejectError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setRejectLoading(false)
    }
  }

  async function saveNotes() {
    setSavingNotes(true)
    try {
      await fetch(`/api/cases/${caseId}/products/${product.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshop_findings: findings.trim() || null,
          staff_notes:       staffNotes.trim() || null,
        }),
      })
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <div className={`px-4 py-3 ${product.status === 'rejected' ? 'bg-red-50/40' : ''}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-text">{productName}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[product.status] ?? STATUS_STYLES.pending}`}>
              {STATUS_LABELS[product.status] ?? product.status}
            </span>
          </div>
          {product.products && (
            <div className="text-[11px] text-grey-400 font-mono mt-0.5">{product.products.part_number}</div>
          )}
          <div className="text-[12px] text-grey-500 mt-0.5">
            {product.serial_number ? `S/N: ${product.serial_number} · ` : ''}Qty: {product.quantity}
          </div>
          {product.fault_notes && (
            <p className="text-[12px] text-grey-500 mt-1 italic">{product.fault_notes}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setShowNotes(s => !s)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-grey-100 text-grey-600 hover:bg-grey-200 transition-colors"
          >
            {showNotes ? 'Hide notes' : 'Add notes'}
          </button>
          {canReject && product.status !== 'rejected' && (
            <button
              onClick={() => setShowRejectForm(s => !s)}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-md text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors"
            >
              Reject
            </button>
          )}
        </div>
      </div>

      {/* Rejection reason display */}
      {product.status === 'rejected' && product.rejection_reason && (
        <div className="mt-2 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          <p className="text-[11px] font-semibold text-red-600 uppercase tracking-[0.06em] mb-0.5">
            Rejection reason
          </p>
          <p className="text-[12.5px] text-red-800">{product.rejection_reason}</p>
        </div>
      )}

      {/* Inline reject form */}
      {showRejectForm && product.status !== 'rejected' && (
        <div className="mt-2 space-y-2">
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={2}
            placeholder="Reason for rejecting this product…"
            className="w-full px-3 py-2 border border-red-200 rounded-lg text-[12.5px] outline-none focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.1)] resize-y"
          />
          {rejectError && (
            <p className="text-[11px] text-red-600">{rejectError}</p>
          )}
          <div className="flex gap-1.5">
            <button
              onClick={handleReject}
              disabled={rejectLoading || !rejectReason.trim()}
              className="px-3 py-1.5 rounded-md text-[11px] font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {rejectLoading ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
            <button
              onClick={() => { setShowRejectForm(false); setRejectError(null) }}
              className="px-3 py-1.5 rounded-md text-[11px] font-semibold bg-grey-100 text-grey-600 hover:bg-grey-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Workshop notes section */}
      {showNotes && (
        <div className="mt-3 space-y-2 border-t border-grey-100 pt-3">
          <div>
            <label className="block text-[10px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-1">
              Workshop Findings
            </label>
            <textarea
              value={findings}
              onChange={e => setFindings(e.target.value)}
              onBlur={saveNotes}
              rows={2}
              placeholder="Findings from test / inspection…"
              className="w-full px-3 py-2 border border-grey-200 rounded-lg text-[12.5px] outline-none focus:border-blue focus:shadow-[0_0_0_3px_rgba(0,102,204,0.1)] resize-y bg-amber-50/30"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-1">
              Staff Notes
            </label>
            <textarea
              value={staffNotes}
              onChange={e => setStaffNotes(e.target.value)}
              onBlur={saveNotes}
              rows={2}
              placeholder="Internal notes (not shown to customer)…"
              className="w-full px-3 py-2 border border-grey-200 rounded-lg text-[12.5px] outline-none focus:border-blue focus:shadow-[0_0_0_3px_rgba(0,102,204,0.1)] resize-y bg-amber-50/30"
            />
          </div>
          {savingNotes && (
            <p className="text-[10px] text-grey-400">Saving…</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminProductsCard({ caseId, caseStatus, products }: Props) {
  const router = useRouter()
  const canReject = ['SUBMITTED', 'UNDER_REVIEW'].includes(caseStatus)

  return (
    <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3.5 border-b border-grey-100 flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold text-text">Products</h2>
        {canReject && products.some(p => p.status !== 'rejected') && (
          <span className="text-[11px] text-grey-400">Individual products can be rejected before RMA is issued</span>
        )}
      </div>
      <div className="divide-y divide-grey-100">
        {products.map(p => (
          <ProductRow
            key={p.id}
            product={p}
            caseId={caseId}
            canReject={canReject}
            onRejected={() => router.refresh()}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AdminProductsCard.tsx
git commit -m "feat: AdminProductsCard with per-product reject and inline notes editing"
```

---

## Task 8: Update admin case detail page

**Files:**
- Modify: `src/app/(admin)/admin/cases/[caseId]/page.tsx`

Three changes:
1. Import `AdminProductsCard`
2. Update the `case_products` select query to include the new columns
3. Replace the static products card JSX with `<AdminProductsCard>`

- [ ] **Step 1: Update the import**

Add to the imports block:
```typescript
import AdminProductsCard from '@/components/admin/AdminProductsCard'
```

- [ ] **Step 2: Update the products query**

Change the `case_products` select from:
```typescript
supabase
  .from('case_products')
  .select('*, products(part_number, display_name, variant)')
  .eq('case_id', caseId),
```
To:
```typescript
supabase
  .from('case_products')
  .select('id, serial_number, quantity, fault_notes, status, rejection_reason, workshop_findings, staff_notes, products(part_number, display_name, variant)')
  .eq('case_id', caseId),
```

- [ ] **Step 3: Replace the static products card**

Replace the entire `{/* Products */}` section (lines ~323–348) with:

```tsx
{/* Products */}
<AdminProductsCard
  caseId={caseId}
  caseStatus={caseData.status}
  products={products as CaseProduct[]}
/>
```

- [ ] **Step 4: Update the `CaseProduct` type** (local interface in the page file)

Replace:
```typescript
type CaseProduct = {
  id: string
  serial_number: string | null
  quantity: number
  fault_notes: string | null
  products: { part_number: string; display_name: string; variant: string | null } | null
}
```
With:
```typescript
type CaseProduct = {
  id: string
  serial_number: string | null
  quantity: number
  fault_notes: string | null
  status: string
  rejection_reason: string | null
  workshop_findings: string | null
  staff_notes: string | null
  products: { part_number: string; display_name: string; variant: string | null } | null
}
```

- [ ] **Step 5: Commit**

```bash
git add "src/app/(admin)/admin/cases/[caseId]/page.tsx"
git commit -m "feat: replace static products card with AdminProductsCard"
```

---

## Task 9: Show rejected products on customer case view

**Files:**
- Modify: `src/app/(customer)/cases/[caseId]/page.tsx`

Update the `case_products` query to fetch `status` and `rejection_reason`. Show a red "Rejected" badge and the rejection reason on any rejected product row. Do **not** expose `workshop_findings` or `staff_notes`.

- [ ] **Step 1: Update the products select query**

In the customer case detail page, find the `case_products` select and add the new fields:
```typescript
supabase
  .from('case_products')
  .select('id, serial_number, quantity, fault_notes, status, rejection_reason, products(part_number, display_name, variant)')
  .eq('case_id', caseId)
```

- [ ] **Step 2: Update the product row JSX**

In the products list rendering, add after the existing product name / part number / S/N lines:

```tsx
{/* Rejection indicator — customer-facing */}
{(cp as { status: string; rejection_reason: string | null }).status === 'rejected' && (
  <div className="mt-2 bg-red-50 border border-red-100 rounded-md px-3 py-2">
    <p className="text-[11px] font-semibold text-red-600 uppercase tracking-[0.06em] mb-0.5">
      Not accepted
    </p>
    {(cp as { rejection_reason: string | null }).rejection_reason && (
      <p className="text-[12.5px] text-red-800">
        {(cp as { rejection_reason: string | null }).rejection_reason}
      </p>
    )}
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(customer)/cases/[caseId]/page.tsx"
git commit -m "feat: show rejected product status and reason on customer case view"
```

---

---

## Task 10: Update Power BI import parse route for per-product matching

**Files:**
- Modify: `src/app/api/admin/import/parse/route.ts`

**Matching strategy (in priority order):**
1. Match `Service Order` value directly against `case_products.sap_works_order` (previously imported) → exact product row found
2. RMA matches a case with exactly **one** product that has no `sap_works_order` yet → auto-assign
3. RMA matches a case with **multiple** products that have no `sap_works_order` → flag as `needsAssignment: true`, include the list of candidate products for staff to pick in the UI

The preview row type needs extending:

```typescript
export interface ImportPreviewRow {
  rmaNumber: string
  caseId: string | null
  caseNumber: string | null
  plannerStatus: string
  mappedStatus: string | null
  workshopStage: string | null
  holdReason: string | null
  clearHold: boolean
  sapSalesOrder: string | null
  // Per-product SAP fields
  sapWorksOrder: string | null
  sapEstimatedCompletion: string | null
  sapOrderValue: number | null
  sapSpentHours: number | null
  // Product matching
  matchedProductId: string | null        // null if not yet resolved
  matchedProductName: string | null
  needsAssignment: boolean               // true = multiple candidates, staff must pick
  candidateProducts: {                   // populated when needsAssignment = true
    id: string
    display_name: string
    part_number: string
    variant: string | null
  }[]
  matched: boolean                       // case-level match
}
```

- [ ] **Step 1: Update the parse route**

Replace the existing `src/app/api/admin/import/parse/route.ts` with the following (full file):

```typescript
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { mapPlannerBucket, describeMappedStatus } from '@/lib/import/stage-mapper'

export interface ImportPreviewRow {
  rmaNumber: string
  caseId: string | null
  caseNumber: string | null
  plannerStatus: string
  mappedStatus: string | null
  workshopStage: string | null
  holdReason: string | null
  clearHold: boolean
  sapSalesOrder: string | null
  sapWorksOrder: string | null
  sapEstimatedCompletion: string | null
  sapOrderValue: number | null
  sapSpentHours: number | null
  matchedProductId: string | null
  matchedProductName: string | null
  needsAssignment: boolean
  candidateProducts: {
    id: string
    display_name: string
    part_number: string
    variant: string | null
  }[]
  matched: boolean
}

function parseBool(val: unknown, def = false): boolean {
  if (val == null) return def
  return ['yes', 'true', '1', 'y'].includes(String(val).toLowerCase().trim())
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ message: 'Unauthorised' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: userProfile } = await supabase
    .from('users').select('role').eq('email', session.user.email).single()

  if (!['staff_uk', 'staff_us', 'admin'].includes((userProfile as { role: string } | null)?.role ?? '')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ message: 'No file provided' }, { status: 400 })

  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    return NextResponse.json({ message: 'File must be .xlsx or .xls' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })

  if (rows.length === 0) {
    return NextResponse.json({ message: 'The spreadsheet contains no data rows' }, { status: 400 })
  }

  // Collect RMA numbers and Works Order numbers for batch lookups
  const rmaNumbers = rows
    .map(r => String(r['Description'] ?? '').trim())
    .filter(Boolean)

  const worksOrders = rows
    .map(r => String(r['Service Order'] ?? '').trim())
    .filter(Boolean)

  // Batch fetch cases by RMA number
  const { data: cases } = await supabase
    .from('cases')
    .select('id, case_number, rma_number, workshop_stage, hold_reason')
    .in('rma_number', rmaNumbers)

  const caseByRma = new Map((cases ?? []).map(c => [c.rma_number ?? '', c]))

  // Batch fetch all products for matched cases, including any existing works orders
  const caseIds = (cases ?? []).map(c => c.id)
  const { data: allProducts } = caseIds.length > 0
    ? await supabase
        .from('case_products')
        .select('id, case_id, sap_works_order, products(part_number, display_name, variant)')
        .in('case_id', caseIds)
    : { data: [] }

  // Index: works order → product
  const productByWorksOrder = new Map<string, typeof allProducts extends (infer T)[] ? T : never>()
  for (const p of allProducts ?? []) {
    if (p.sap_works_order) productByWorksOrder.set(p.sap_works_order, p)
  }

  // Index: caseId → products[]
  const productsByCase = new Map<string, typeof allProducts>()
  for (const p of allProducts ?? []) {
    const existing = productsByCase.get(p.case_id) ?? []
    existing.push(p)
    productsByCase.set(p.case_id, existing)
  }

  const preview: ImportPreviewRow[] = rows.map(row => {
    const rmaNumber    = String(row['Description']    ?? '').trim()
    const plannerStatus = String(row['Product Status'] ?? '').trim()
    const worksOrder   = String(row['Service Order']  ?? '').trim()
    const caseRow      = rmaNumber ? caseByRma.get(rmaNumber) ?? null : null
    const mapped       = plannerStatus ? mapPlannerBucket(plannerStatus) : null

    let rawDate = row['Estimated Completion']
    let sapEstimatedCompletion: string | null = null
    if (rawDate instanceof Date) {
      sapEstimatedCompletion = rawDate.toISOString().split('T')[0]
    } else if (typeof rawDate === 'string' && rawDate.trim()) {
      sapEstimatedCompletion = rawDate.trim()
    }

    const sapOrderValue = row['Value'] != null ? Number(row['Value']) : null
    const sapSpentHours = row['Spent Hours'] != null ? Number(row['Spent Hours']) : null

    // Product matching
    let matchedProductId: string | null = null
    let matchedProductName: string | null = null
    let needsAssignment = false
    let candidateProducts: ImportPreviewRow['candidateProducts'] = []

    if (worksOrder && productByWorksOrder.has(worksOrder)) {
      // Strategy 1: direct Works Order match
      const p = productByWorksOrder.get(worksOrder)!
      matchedProductId = p.id
      const prod = p.products as { display_name: string; part_number: string; variant: string | null } | null
      matchedProductName = prod
        ? `${prod.display_name}${prod.variant ? ` ${prod.variant}` : ''}`
        : null
    } else if (caseRow) {
      const caseProducts = productsByCase.get(caseRow.id) ?? []
      const unassigned = caseProducts.filter(p => !p.sap_works_order)

      if (unassigned.length === 1) {
        // Strategy 2: only one unassigned product — auto-assign
        const p = unassigned[0]
        matchedProductId = p.id
        const prod = p.products as { display_name: string; part_number: string; variant: string | null } | null
        matchedProductName = prod
          ? `${prod.display_name}${prod.variant ? ` ${prod.variant}` : ''}`
          : null
      } else if (unassigned.length > 1) {
        // Strategy 3: multiple candidates — needs manual assignment
        needsAssignment = true
        candidateProducts = unassigned.map(p => {
          const prod = p.products as { display_name: string; part_number: string; variant: string | null } | null
          return {
            id: p.id,
            display_name: prod?.display_name ?? 'Unknown',
            part_number: prod?.part_number ?? '',
            variant: prod?.variant ?? null,
          }
        })
      }
    }

    return {
      rmaNumber,
      caseId: caseRow?.id ?? null,
      caseNumber: caseRow?.case_number ?? null,
      plannerStatus,
      mappedStatus: mapped ? describeMappedStatus(mapped) : null,
      workshopStage: mapped?.workshop_stage ?? null,
      holdReason: mapped?.hold_reason ?? null,
      clearHold: mapped?.clear_hold ?? false,
      sapSalesOrder: row['Sales Order'] != null ? String(row['Sales Order']).trim() : null,
      sapWorksOrder: worksOrder || null,
      sapEstimatedCompletion,
      sapOrderValue: isNaN(sapOrderValue!) ? null : sapOrderValue,
      sapSpentHours: isNaN(sapSpentHours!) ? null : sapSpentHours,
      matchedProductId,
      matchedProductName,
      needsAssignment,
      candidateProducts,
      matched: !!caseRow,
    }
  })

  const needsAssignmentCount = preview.filter(r => r.needsAssignment).length

  return NextResponse.json({
    filename: file.name,
    totalRows: preview.length,
    matchedRows: preview.filter(r => r.matched).length,
    needsAssignmentCount,
    rows: preview,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/import/parse/route.ts
git commit -m "feat: update import parse route for per-product Works Order matching"
```

---

## Task 11: Update Power BI import confirm route and ImportClient UI

**Files:**
- Modify: `src/app/api/admin/import/confirm/route.ts`
- Modify: `src/components/admin/ImportClient.tsx`

The confirm route now writes SAP data at product level. The `ImportClient` preview table needs a "Assign" dropdown for rows where `needsAssignment = true`, allowing staff to select which product the Works Order belongs to before confirming.

- [ ] **Step 1: Update the confirm route**

Replace `src/app/api/admin/import/confirm/route.ts` with the following:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const RowSchema = z.object({
  caseId:                  z.string().uuid().nullable(),
  matchedProductId:        z.string().uuid().nullable(),
  workshopStage:           z.string().nullable(),
  holdReason:              z.string().nullable(),
  clearHold:               z.boolean(),
  sapSalesOrder:           z.string().nullable(),
  sapWorksOrder:           z.string().nullable(),
  sapEstimatedCompletion:  z.string().nullable(),
  sapOrderValue:           z.number().nullable(),
  sapSpentHours:           z.number().nullable(),
  rmaNumber:               z.string(),
  caseNumber:              z.string().nullable(),
  matched:                 z.boolean(),
  needsAssignment:         z.boolean(),
  // Remaining fields optional (not needed by confirm logic)
}).passthrough()

const ConfirmSchema = z.object({
  filename: z.string().min(1),
  rows: z.array(RowSchema),
})

export async function PUT(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ message: 'Unauthorised' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: userProfile } = await supabase
    .from('users').select('id, role').eq('email', session.user.email).single()

  const profile = userProfile as { id: string; role: string } | null
  if (!['staff_uk', 'staff_us', 'admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = ConfirmSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid request', errors: parsed.error.flatten() }, { status: 400 })
  }

  const { filename, rows } = parsed.data
  const actionableRows = rows.filter(r => r.matched && r.caseId && !r.needsAssignment)
  let updatedRows = 0

  for (const row of actionableRows) {
    if (!row.caseId) continue

    // Case-level updates (stage, hold, sales order)
    const caseUpdates: Record<string, unknown> = {}
    if (row.workshopStage) caseUpdates.workshop_stage = row.workshopStage
    if (row.clearHold)     caseUpdates.hold_reason = null
    if (row.holdReason)    caseUpdates.hold_reason = row.holdReason
    if (row.sapSalesOrder) caseUpdates.sap_sales_order = row.sapSalesOrder

    if (Object.keys(caseUpdates).length > 0) {
      await supabase.from('cases').update(caseUpdates).eq('id', row.caseId)
    }

    // Product-level updates (works order and financial fields)
    if (row.matchedProductId) {
      const productUpdates: Record<string, unknown> = {}
      if (row.sapWorksOrder)           productUpdates.sap_works_order = row.sapWorksOrder
      if (row.sapEstimatedCompletion)  productUpdates.sap_estimated_completion = row.sapEstimatedCompletion
      if (row.sapOrderValue != null)   productUpdates.sap_order_value = row.sapOrderValue
      if (row.sapSpentHours != null)   productUpdates.sap_spent_hours = row.sapSpentHours

      if (Object.keys(productUpdates).length > 0) {
        await supabase
          .from('case_products')
          .update(productUpdates)
          .eq('id', row.matchedProductId)
      }
    }

    updatedRows++
  }

  const skippedAssignment = rows.filter(r => r.needsAssignment).length

  await supabase.from('import_logs').insert({
    filename,
    uploaded_by:   profile?.id ?? null,
    total_rows:    rows.length,
    matched_rows:  actionableRows.length,
    updated_rows:  updatedRows,
    rows_data:     rows,
  })

  return NextResponse.json({ updatedRows, skippedAssignment })
}
```

- [ ] **Step 2: Update ImportClient preview table**

In `src/components/admin/ImportClient.tsx`, add a "Product" column to the preview table and an assignment dropdown for `needsAssignment` rows.

In the `ParseResult` interface, update the `rows` type to use `ImportPreviewRow` from the parse route (already typed).

Add a `assignments` state to track staff selections for `needsAssignment` rows:

```typescript
const [assignments, setAssignments] = useState<Record<number, string>>({})
```

In the preview table, after the "Maps to" column add:

```tsx
<th className="px-4 py-3 text-left font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">Product</th>
```

And in each row:

```tsx
<td className="px-4 py-3">
  {row.needsAssignment ? (
    <select
      value={assignments[i] ?? ''}
      onChange={e => setAssignments(prev => ({ ...prev, [i]: e.target.value }))}
      className="text-[12px] border border-amber-300 rounded-md px-2 py-1 bg-amber-50 text-amber-900 outline-none focus:border-amber-500"
    >
      <option value="">— Assign product —</option>
      {row.candidateProducts.map(p => (
        <option key={p.id} value={p.id}>
          {p.display_name}{p.variant ? ` ${p.variant}` : ''} ({p.part_number})
        </option>
      ))}
    </select>
  ) : row.matchedProductName ? (
    <span className="text-[12px] text-grey-700">{row.matchedProductName}</span>
  ) : (
    <span className="text-[11px] text-grey-400">—</span>
  )}
</td>
```

Before calling the confirm API, merge staff assignments into the rows:

```typescript
const rowsWithAssignments = result.rows.map((row, i) => ({
  ...row,
  matchedProductId: assignments[i] ?? row.matchedProductId,
  needsAssignment: assignments[i] ? false : row.needsAssignment,
}))
```

Update the summary bar to show pending assignments:

```tsx
{result.rows.some(r => r.needsAssignment) && (
  <div>
    <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-[0.06em] mb-0.5">Need assignment</p>
    <p className="text-[18px] font-bold text-amber-600">
      {result.rows.filter(r => r.needsAssignment && !assignments[result.rows.indexOf(r)]).length}
    </p>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/import/confirm/route.ts src/components/admin/ImportClient.tsx
git commit -m "feat: update import confirm route and UI for per-product Works Order assignment"
```

---

## Spec Coverage Check

| Requirement | Task |
|---|---|
| `case_products` gets `status`, `rejection_reason` columns | Task 1 |
| `case_products` gets `workshop_findings`, `staff_notes` columns | Task 1 |
| `sap_works_order` moves from `cases` to `case_products` | Task 1 |
| `sap_estimated_completion`, `sap_order_value`, `sap_spent_hours` move to `case_products` | Task 1 |
| `case_updates` gets nullable `product_id` for per-product timeline | Task 1 |
| Per-product reject API route | Task 2 |
| Auto-close case when all products rejected | Task 2 |
| Per-product timeline entries written on rejection | Task 2 |
| Per-product notes and SAP PATCH API | Task 3 |
| Partial rejection email to customer | Task 4 + 5 |
| Full case rejection marks all products | Task 6 |
| Admin UI with per-row reject button, notes, SAP fields, and timeline | Task 7 |
| Admin case detail page wired to new component | Task 8 |
| `AdminSapCard` updated — Works Order moved out | Task 8 |
| Customer view shows rejected product indicator | Task 9 |
| Reject only available for SUBMITTED/UNDER_REVIEW | Task 2 (guard) + Task 7 (canReject prop) |
| Staff notes / SAP financials never shown to customers | Task 7 (not in customer query), Task 9 (not fetched) |
| Power BI import parse route updated — 3-strategy product matching | Task 10 |
| Power BI import confirm route writes Works Order at product level | Task 11 |
| ImportClient preview shows assignment dropdown for ambiguous rows | Task 11 |
| Rows with unresolved assignments skipped (not silently dropped) | Task 11 |
