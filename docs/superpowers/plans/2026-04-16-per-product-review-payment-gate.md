# Per-Product Case Review with Payment Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow staff to accept or reject each product individually during case review, with a predefined rejection reason dropdown, and a payment/PO confirmation gate before the RMA is issued.

**Architecture:** Per-product accept/reject controls are added to the existing `ProductsCard` component (right column of admin case detail). The "Approve & Issue RMA" case-level button in `AdminCaseActions` is replaced with an "Issue RMA" button that only activates once all products have been reviewed, and shows a payment confirmation panel before calling the approve route. The approve route gains a check that all products are non-pending.

**Tech Stack:** Next.js 14 App Router, TypeScript, Zod, Supabase service client, React Email / Resend (existing `sendPartialRejection` + `sendCaseRejected` functions)

---

## File Map

| File | Change |
|------|--------|
| `src/lib/rejection-reasons.ts` | **Create** — typed list of predefined rejection reason codes + labels |
| `src/app/api/cases/[caseId]/products/[productId]/accept/route.ts` | **Create** — POST endpoint to accept a product |
| `src/app/api/cases/[caseId]/approve/route.ts` | **Modify** — add all-products-non-pending guard |
| `src/components/admin/AdminCaseDetailClient.tsx` | **Modify** — add accept/reject controls to `ProductsCard`; pass new props to `AdminCaseActions` |
| `src/app/(admin)/admin/cases/[caseId]/AdminCaseActions.tsx` | **Modify** — replace old approve button with Issue RMA + payment gate panel |

---

## Task 1: Predefined rejection reasons module

**Files:**
- Create: `src/lib/rejection-reasons.ts`

- [ ] **Step 1: Create the module**

```typescript
// src/lib/rejection-reasons.ts

export const REJECTION_REASONS = [
  { value: 'BEYOND_ECONOMIC_REPAIR',    label: 'Beyond Economic Repair' },
  { value: 'NO_FAULT_FOUND',           label: 'No Fault Found — Unit returned to customer' },
  { value: 'INCORRECT_ITEM_SUBMITTED', label: 'Incorrect Item Submitted' },
  { value: 'CUSTOMER_CANCELLED',       label: 'Customer Cancelled' },
  { value: 'OUT_OF_WARRANTY',          label: 'Out of Warranty — Awaiting customer approval' },
  { value: 'NOT_ACCEPTED',             label: 'Not Accepted for Repair' },
] as const

export type RejectionReasonValue = (typeof REJECTION_REASONS)[number]['value']
```

- [ ] **Step 2: Verify module exports compile**

```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/rejection-reasons.ts
git commit -m "feat: add predefined rejection reasons module"
```

---

## Task 2: Accept product API endpoint

**Files:**
- Create: `src/app/api/cases/[caseId]/products/[productId]/accept/route.ts`

The existing `reject/route.ts` in the same directory is the pattern to follow. This endpoint marks a single product as `accepted` and logs a timeline entry.

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/cases/[caseId]/products/[productId]/accept/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

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
    const supabase = createServiceClient()

    // Verify case exists and is in a reviewable status
    const { data: caseRow } = await supabase
      .from('cases')
      .select('id, status, case_number')
      .eq('id', caseId)
      .single()

    if (!caseRow) return NextResponse.json({ message: 'Case not found' }, { status: 404 })
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(caseRow.status)) {
      return NextResponse.json(
        { message: 'Products can only be accepted during SUBMITTED or UNDER_REVIEW' },
        { status: 409 }
      )
    }

    // Verify the product belongs to this case
    const { data: productRow } = await supabase
      .from('case_products')
      .select('id, status, products(display_name)')
      .eq('id', productId)
      .eq('case_id', caseId)
      .single()

    if (!productRow) return NextResponse.json({ message: 'Product not found on this case' }, { status: 404 })
    if ((productRow as { status: string }).status === 'accepted') {
      return NextResponse.json({ message: 'Product is already accepted' }, { status: 409 })
    }

    // Mark product as accepted
    const { error: updateErr } = await supabase
      .from('case_products')
      .update({ status: 'accepted', rejection_reason: null })
      .eq('id', productId)

    if (updateErr) {
      console.error('Product accept failed:', updateErr)
      return NextResponse.json({ message: 'Failed to accept product' }, { status: 500 })
    }

    const productName = (productRow.products as { display_name: string } | null)
      ?.display_name ?? 'Unknown product'

    await supabase.from('case_updates').insert({
      case_id: caseId,
      product_id: productId,
      author_id: user.canonicalId,
      content: `Product accepted: ${productName}.`,
      is_internal: false,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Product accept route error:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/cases/[caseId]/products/[productId]/accept/route.ts"
git commit -m "feat: add accept product API endpoint"
```

---

## Task 3: Update approve route — guard against pending products

**Files:**
- Modify: `src/app/api/cases/[caseId]/approve/route.ts:47-49`

Currently the approve route only checks `caseRow.status !== 'SUBMITTED'`. Add a check that all products on the case are non-pending before allowing the RMA to be issued.

- [ ] **Step 1: Add the pending-products guard**

In `approve/route.ts`, after the status check on line 47, add:

```typescript
    // Block RMA issue if any product is still pending review
    const { data: caseProducts } = await supabase
      .from('case_products')
      .select('id, status')
      .eq('case_id', caseId)

    const hasPendingProducts = (caseProducts ?? []).some(
      (p) => (p as { status: string }).status === 'pending'
    )
    if (hasPendingProducts) {
      return NextResponse.json(
        { message: 'All products must be accepted or rejected before issuing the RMA' },
        { status: 409 }
      )
    }
```

Insert this block immediately after:
```typescript
    if (caseRow.status !== 'SUBMITTED') {
      return NextResponse.json({ message: 'Case is not in SUBMITTED status' }, { status: 409 })
    }
```

The full updated section (lines 46–65 in the original) becomes:

```typescript
    if (!caseRow) return NextResponse.json({ message: 'Case not found' }, { status: 404 })
    if (caseRow.status !== 'SUBMITTED') {
      return NextResponse.json({ message: 'Case is not in SUBMITTED status' }, { status: 409 })
    }

    // Block RMA issue if any product is still pending review
    const { data: caseProducts } = await supabase
      .from('case_products')
      .select('id, status')
      .eq('case_id', caseId)

    const hasPendingProducts = (caseProducts ?? []).some(
      (p) => (p as { status: string }).status === 'pending'
    )
    if (hasPendingProducts) {
      return NextResponse.json(
        { message: 'All products must be accepted or rejected before issuing the RMA' },
        { status: 409 }
      )
    }

    // Generate RMA number
    const { data: rmaData, error: rmaError } = await supabase.rpc('generate_rma_number')
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/cases/[caseId]/approve/route.ts"
git commit -m "feat: block RMA issue until all products are reviewed"
```

---

## Task 4: Per-product accept/reject controls in ProductsCard

**Files:**
- Modify: `src/components/admin/AdminCaseDetailClient.tsx`

`ProductsCard` is defined at the bottom of this file (line 444). It needs:
1. A new `currentStatus: string` prop
2. State for whichever product is showing its reject form (`rejectingId`)
3. State for the rejection reason dropdown value (`rejectReasonValues`)
4. An `acceptProduct` async function
5. A `rejectProduct` async function
6. Per-product Accept/Reject UI in each product row, shown when `currentStatus === 'SUBMITTED'` and product status is `'pending'`

Additionally, `AdminCaseDetailClient` itself must:
- Pass `currentStatus={caseData.status}` to `ProductsCard`
- Compute `allProductsReviewed` and `hasAcceptedProducts` booleans
- Pass them as new props to `AdminCaseActions`

- [ ] **Step 1: Add `currentStatus` prop to `ProductsCard` signature and call site**

Find the `ProductsCard` function signature at line ~444:
```typescript
function ProductsCard({
  caseId,
  products,
  sapSalesOrder,
  sapDaysOpen,
  lastImportAt,
}: {
  caseId: string
  products: CaseProductFull[]
  sapSalesOrder: string | null
  sapDaysOpen: number | null
  lastImportAt: string | null
})
```

Change it to:
```typescript
function ProductsCard({
  caseId,
  products,
  sapSalesOrder,
  sapDaysOpen,
  lastImportAt,
  currentStatus,
}: {
  caseId: string
  products: CaseProductFull[]
  sapSalesOrder: string | null
  sapDaysOpen: number | null
  lastImportAt: string | null
  currentStatus: string
})
```

At the `ProductsCard` call site (line ~414):
```typescript
          <ProductsCard
            caseId={caseId}
            products={products}
            sapSalesOrder={caseData.sap_sales_order ?? null}
            sapDaysOpen={caseData.sap_days_open ?? null}
            lastImportAt={caseData.last_import_at ?? null}
          />
```
Change to:
```typescript
          <ProductsCard
            caseId={caseId}
            products={products}
            sapSalesOrder={caseData.sap_sales_order ?? null}
            sapDaysOpen={caseData.sap_days_open ?? null}
            lastImportAt={caseData.last_import_at ?? null}
            currentStatus={caseData.status}
          />
```

- [ ] **Step 2: Add accept/reject state and handlers inside `ProductsCard`**

Import `REJECTION_REASONS` at the top of the file. Add after the existing `import { useRouter } from 'next/navigation'` imports:
```typescript
import { REJECTION_REASONS } from '@/lib/rejection-reasons'
```

Inside `ProductsCard`, after the existing state declarations (after `const [sapForm, setSapForm] = useState<Record<string, string>>({})`), add:

```typescript
  // Accept/reject state
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReasonValues, setRejectReasonValues] = useState<Record<string, string>>({})
  const [reviewSaving, setReviewSaving] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)

  async function acceptProduct(productId: string) {
    setReviewSaving(productId)
    setReviewError(null)
    try {
      const res = await fetch(`/api/cases/${caseId}/products/${productId}/accept`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setReviewError(data.message ?? 'Failed to accept product')
        return
      }
      router.refresh()
    } catch {
      setReviewError('Failed to accept product')
    } finally {
      setReviewSaving(null)
    }
  }

  async function rejectProduct(productId: string) {
    const reason = rejectReasonValues[productId]
    if (!reason) return
    setReviewSaving(productId)
    setReviewError(null)
    try {
      const res = await fetch(`/api/cases/${caseId}/products/${productId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setReviewError(data.message ?? 'Failed to reject product')
        return
      }
      setRejectingId(null)
      router.refresh()
    } catch {
      setReviewError('Failed to reject product')
    } finally {
      setReviewSaving(null)
    }
  }
```

- [ ] **Step 3: Add per-product accept/reject UI to each product row**

In the `products.map((p) => { ... })` block inside `ProductsCard`, after the `{/* Fee Basis */}` div and before the `{/* SAP Data section */}` div, add:

```typescript
              {/* Accept / Reject controls — shown only during SUBMITTED review for pending products */}
              {currentStatus === 'SUBMITTED' && p.status === 'pending' && (
                <div className="mb-3">
                  {rejectingId === p.id ? (
                    <div className="border border-red-200 rounded-lg bg-red-50 p-3 space-y-2">
                      <div className="text-[10px] font-semibold text-red-700 uppercase tracking-[0.06em]">
                        Select rejection reason
                      </div>
                      <select
                        value={rejectReasonValues[p.id] ?? ''}
                        onChange={(e) =>
                          setRejectReasonValues((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        className="w-full text-[12px] border border-red-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
                      >
                        <option value="">— Select a reason —</option>
                        {REJECTION_REASONS.map((r) => (
                          <option key={r.value} value={r.label}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRejectingId(null)}
                          className="text-[11px] font-semibold text-grey-500 hover:text-grey-700 px-2.5 py-1 rounded-md border border-grey-200 bg-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => rejectProduct(p.id)}
                          disabled={!rejectReasonValues[p.id] || reviewSaving === p.id}
                          className="text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md transition-colors disabled:opacity-50"
                        >
                          {reviewSaving === p.id ? 'Rejecting…' : 'Confirm Rejection'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptProduct(p.id)}
                        disabled={reviewSaving === p.id}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                      >
                        {reviewSaving === p.id ? 'Saving…' : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Accept
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setRejectingId(p.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 border border-red-200 bg-white hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Show rejection reason on rejected products */}
              {p.status === 'rejected' && p.rejection_reason && (
                <div className="mb-3 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-md px-2.5 py-1.5">
                  <span className="font-semibold">Rejected: </span>{p.rejection_reason}
                </div>
              )}
```

Also, after the `(feeError || sapError)` error banner, add the review error:
```typescript
      {reviewError && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-[12px] text-red-600">
          {reviewError}
        </div>
      )}
```

- [ ] **Step 4: Pass `allProductsReviewed` and `hasAcceptedProducts` from `AdminCaseDetailClient` to `AdminCaseActions`**

In `AdminCaseDetailClient`, compute these inside the component body (before the return statement):
```typescript
  const allProductsReviewed = products.every((p) => p.status !== 'pending')
  const hasAcceptedProducts = products.some((p) => p.status === 'accepted')
```

Then update the `AdminCaseActions` call site (line ~243):
```typescript
          <AdminCaseActions
            caseId={caseId}
            currentStage={caseData.workshop_stage}
            currentStatus={caseData.status}
            isOnHold={caseData.is_on_hold}
            holdReason={caseData.hold_reason}
            holdCustomerLabel={caseData.hold_customer_label}
            productId={selectedProduct?.id}
            productStage={selectedProduct?.workshop_stage ?? null}
            productName={selectedProduct ? productDisplayName(selectedProduct) : undefined}
            allProductsReviewed={allProductsReviewed}
            hasAcceptedProducts={hasAcceptedProducts}
            creditTerms={customerAccount?.credit_terms ?? false}
            poRequired={customerAccount?.po_required ?? false}
            poNumber={poNumber}
            slotBetweenReviewAndStage={
              <SubmissionDetailsCard
                submissionDetails={submissionDetails}
                products={products}
              />
            }
          />
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors (AdminCaseActions TypeScript errors expected — will be fixed in Task 5)

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/AdminCaseDetailClient.tsx src/lib/rejection-reasons.ts
git commit -m "feat: add per-product accept/reject controls in ProductsCard"
```

---

## Task 5: Issue RMA with payment gate in AdminCaseActions

**Files:**
- Modify: `src/app/(admin)/admin/cases/[caseId]/AdminCaseActions.tsx`

Replace the existing "Approve & Issue RMA" button (and free-text reject form) in the `SUBMITTED` state block with:
1. New props: `allProductsReviewed`, `hasAcceptedProducts`, `creditTerms`, `poRequired`, `poNumber`
2. "Issue RMA" button — disabled when `!allProductsReviewed || !hasAcceptedProducts`
3. A payment gate panel (shown when Issue RMA is clicked) that confirms payment/PO before calling approve

The existing free-text case-level Reject button is kept as a fallback for rejecting the entire case at once.

- [ ] **Step 1: Add new props to the `Props` interface**

```typescript
interface Props {
  caseId: string
  currentStage: string | null
  currentStatus: string
  isOnHold: boolean
  holdReason: string | null
  holdCustomerLabel: string | null
  productId?: string
  productStage?: string | null
  productName?: string
  slotBetweenReviewAndStage?: React.ReactNode
  // New: for Issue RMA flow
  allProductsReviewed: boolean
  hasAcceptedProducts: boolean
  creditTerms: boolean
  poRequired: boolean
  poNumber: string | null
}
```

- [ ] **Step 2: Add new state for the Issue RMA flow**

In the function body, after the existing `const [error, setError] = useState<string | null>(null)` line, add:

```typescript
  const [showIssueRmaPanel, setShowIssueRmaPanel] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [issueRmaLoading, setIssueRmaLoading] = useState(false)
```

- [ ] **Step 3: Add the `issueRma` async function**

After the existing `reject` function, add:

```typescript
  async function issueRma() {
    setIssueRmaLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cases/${caseId}/approve`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? 'Failed to issue RMA')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIssueRmaLoading(false)
    }
  }
```

- [ ] **Step 4: Replace the SUBMITTED status block UI**

Find the entire block:
```typescript
      {/* Approval actions (SUBMITTED only) */}
      {currentStatus === 'SUBMITTED' && (
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-[22px] py-[18px] border-b border-grey-100">
            <h2 className="font-heading text-sm font-semibold text-text">Case Review</h2>
          </div>
          <div className="px-[22px] py-5">
            <p className="text-[13px] text-grey-600 mb-4">
              This case is pending review. Approve to issue an RMA number, or reject with a reason.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={approve}
                disabled={approveLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-green-600 text-white hover:bg-green-700 transition-all disabled:opacity-60"
              >
                {approveLoading ? 'Approving…' : 'Approve & Issue RMA'}
              </button>
              <button
                onClick={() => setShowRejectForm((s) => !s)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-all"
              >
                Reject
              </button>
            </div>
            {showRejectForm && (
              <div className="mt-4 space-y-2">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Reason for rejection…"
                  className="w-full px-3.5 py-[9px] border border-grey-200 rounded-lg text-[13px] outline-none focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.1)] resize-y"
                />
                <button
                  onClick={reject}
                  disabled={rejectLoading || !rejectReason.trim()}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-60"
                >
                  {rejectLoading ? 'Rejecting…' : 'Confirm Rejection'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
```

Replace with:

```typescript
      {/* Case Review (SUBMITTED only) */}
      {currentStatus === 'SUBMITTED' && (
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-[22px] py-[18px] border-b border-grey-100">
            <h2 className="font-heading text-sm font-semibold text-text">Case Review</h2>
          </div>
          <div className="px-[22px] py-5 space-y-4">

            {/* Product review status */}
            {!allProductsReviewed && (
              <div className="flex items-center gap-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Accept or reject each product in the Products card before issuing the RMA.
              </div>
            )}

            {/* Issue RMA button */}
            <div className="flex gap-2.5 flex-wrap">
              <button
                onClick={() => { setShowIssueRmaPanel((s) => !s); setPaymentConfirmed(false) }}
                disabled={!allProductsReviewed || !hasAcceptedProducts}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-green-600 text-white hover:bg-green-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Issue RMA
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              <button
                onClick={() => setShowRejectForm((s) => !s)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-all"
              >
                Reject Entire Case
              </button>
            </div>

            {/* Payment gate panel */}
            {showIssueRmaPanel && allProductsReviewed && hasAcceptedProducts && (
              <div className="border border-grey-200 rounded-lg bg-grey-50 p-4 space-y-3">
                <div className="text-[12px] font-semibold text-grey-700 uppercase tracking-[0.05em]">
                  Payment &amp; PO Confirmation
                </div>

                {creditTerms ? (
                  <div className="flex items-center gap-2 text-[12px] text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4 flex-shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Customer has credit terms — no upfront payment required.
                  </div>
                ) : (
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentConfirmed}
                      onChange={(e) => setPaymentConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-blue-600 cursor-pointer"
                    />
                    <span className="text-[12.5px] text-grey-700">
                      I confirm that payment or a valid PO has been received for this case before issuing the RMA.
                    </span>
                  </label>
                )}

                {poRequired && !poNumber && (
                  <div className="flex items-center gap-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Account requires a PO number but none was provided on submission. Confirm with the customer before proceeding.
                  </div>
                )}

                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={() => setShowIssueRmaPanel(false)}
                    className="text-[12px] font-semibold text-grey-500 hover:text-grey-700 px-3 py-1.5 rounded-md border border-grey-200 bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={issueRma}
                    disabled={issueRmaLoading || (!creditTerms && !paymentConfirmed)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold bg-green-600 text-white hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {issueRmaLoading ? 'Issuing…' : 'Confirm & Issue RMA'}
                  </button>
                </div>
              </div>
            )}

            {/* Case-level reject form */}
            {showRejectForm && (
              <div className="space-y-2">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Reason for rejecting the entire case…"
                  className="w-full px-3.5 py-[9px] border border-grey-200 rounded-lg text-[13px] outline-none focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.1)] resize-y"
                />
                <button
                  onClick={reject}
                  disabled={rejectLoading || !rejectReason.trim()}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-60"
                >
                  {rejectLoading ? 'Rejecting…' : 'Confirm Case Rejection'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
```

Note: You can remove the now-unused `approve` function and `approveLoading` state from `AdminCaseActions` since the approve action is now `issueRma`.

- [ ] **Step 5: Remove unused `approve` function and `approveLoading` state**

Remove:
```typescript
  const [approveLoading, setApproveLoading] = useState(false)
```
and:
```typescript
  async function approve() {
    setApproveLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cases/${caseId}/approve`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? 'Failed to approve case')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setApproveLoading(false)
    }
  }
```

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add "src/app/(admin)/admin/cases/[caseId]/AdminCaseActions.tsx"
git commit -m "feat: replace approve button with per-product review flow and payment gate"
```

---

## Verification

1. Open a case in `SUBMITTED` status in the admin portal
2. Right column → Products card: each product row shows green "Accept" and red "Reject" buttons
3. Click "Reject" on a product: dropdown appears with predefined reasons (Beyond Economic Repair, No Fault Found, etc.)
4. Select a reason and confirm: product badge changes to red "Rejected", rejection reason shown below
5. Click "Accept" on another product: product badge changes to green "Accepted"
6. While any product is still "Pending": left column → Case Review card shows amber warning and "Issue RMA" button is disabled (greyed out)
7. Once all products reviewed: "Issue RMA" button becomes active
8. Click "Issue RMA":
   - If customer has credit terms: shows green "credit terms" notice, "Confirm & Issue RMA" enabled immediately
   - If customer needs payment: shows checkbox "I confirm payment has been received", button disabled until checked
   - If PO required but not provided: shows amber warning alongside payment confirmation
9. Click "Confirm & Issue RMA": RMA number issued, case status changes to `RMA_ISSUED`, customer receives RMA email
10. If all products rejected: case moves to `REJECTED` automatically (existing behaviour)
11. TypeScript: `npx tsc --noEmit` exits 0
