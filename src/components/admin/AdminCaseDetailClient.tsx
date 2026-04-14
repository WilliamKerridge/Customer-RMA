'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminCaseActions from '@/app/(admin)/admin/cases/[caseId]/AdminCaseActions'
import AdminPostUpdateForm from '@/app/(admin)/admin/cases/[caseId]/AdminPostUpdateForm'
import AdminAttachmentsCard from '@/components/admin/AdminAttachmentsCard'

// ── Types ────────────────────────────────────────────────────────────────────

export interface CaseProductFull {
  id: string
  serial_number: string | null
  quantity: number
  fault_notes: string | null
  status: string
  rejection_reason: string | null
  workshop_stage: string | null
  workshop_findings: string | null
  staff_notes: string | null
  sap_works_order: string | null
  sap_estimated_completion: string | null
  sap_order_value: number | null
  sap_spent_hours: number | null
  fee_basis: string
  products: {
    part_number: string
    display_name: string
    variant: string | null
  } | null
}

export interface CaseUpdateFull {
  id: string
  created_at: string
  content: string
  is_internal: boolean
  status_change_to: string | null
  product_id: string | null
}

export interface CaseDataForClient {
  id: string
  status: string
  workshop_stage: string | null
  is_on_hold: boolean
  hold_reason: string | null
  hold_customer_label: string | null
  sap_sales_order: string | null
  sap_works_order: string | null
  sap_estimated_completion: string | null
  sap_order_value: number | null
  sap_spent_hours: number | null
  sap_days_open: number | null
  last_import_at: string | null
}

interface CustomerInfo {
  full_name: string | null
  email: string
  company: string | null
}

interface CustomerAccount {
  credit_terms: boolean
  po_required: boolean
}

interface Attachment {
  id: string
  file_name: string
  storage_path: string
  file_size: number | null
  mime_type: string | null
  created_at: string
  downloadUrl: string | null
}

export interface SubmissionDetails {
  fault_description: string | null
  fault_display_info: boolean
  fault_display_details: string | null
  tested_on_other_unit: boolean
  fault_follows: string | null
  required_return_date: string | null
  shipping_address: {
    name?: string
    company?: string
    // Submission route stores street address as 'street'; newer code may use 'address_line1'
    street?: string
    address_line1?: string
    address_line2?: string
    city?: string
    postcode?: string
    country?: string
    phone?: string
    email?: string
  } | null
}

interface Props {
  caseId: string
  caseData: CaseDataForClient
  products: CaseProductFull[]
  updates: CaseUpdateFull[]
  customer: CustomerInfo | null
  customerAccount: CustomerAccount | null
  attachments: Attachment[]
  poNumber: string | null
  office: string
  faultType: string
  caseNumber: string
  rmaNumber: string | null
  submittedAt: string
  paymentStatus: string | null
  submissionDetails: SubmissionDetails
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const FAULT_TYPE_LABELS: Record<string, string> = {
  repair: 'Repair', service: 'End of Season Service', service_plan: 'Service Plan',
  loan_return: 'Loan Unit Return', code_update: 'Code Update',
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const PRODUCT_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending:  { label: 'Pending',  className: 'bg-grey-100 text-grey-500' },
  accepted: { label: 'Accepted', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-600' },
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminCaseDetailClient({
  caseId,
  caseData,
  products,
  updates,
  customer,
  customerAccount,
  attachments,
  poNumber,
  office,
  faultType,
  caseNumber: _caseNumber,
  rmaNumber: _rmaNumber,
  submittedAt,
  paymentStatus,
  submissionDetails,
}: Props) {
  const isMultiProduct = products.length > 1

  // Always default to the first product so updates are tagged to a product.
  // In "All" view (multi-product only, selectedProductId === null) updates are case-level.
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    products[0]?.id ?? null
  )

  const selectedProduct = selectedProductId
    ? products.find((p) => p.id === selectedProductId) ?? null
    : null

  // Timeline filter:
  // - Multi-product + product selected: show case-level (product_id=null) + that product's entries
  // - "All" selected OR single-product: show everything
  const visibleUpdates = isMultiProduct && selectedProductId
    ? updates.filter((u) => u.product_id === null || u.product_id === selectedProductId)
    : updates

  const productDisplayName = (p: CaseProductFull) =>
    p.products
      ? `${p.products.display_name}${p.products.variant ? ` ${p.products.variant}` : ''}`
      : 'Unknown product'

  return (
    <div>
      {/* Product selector tabs — always shown so updates can be scoped to a product.
          Multi-product cases also get an "All Products" aggregate view. */}
      <div className="mb-5">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[11px] font-semibold text-grey-400 uppercase tracking-[0.06em] mr-1">
            Product:
          </span>
          {/* "All Products" tab — multi-product only */}
          {isMultiProduct && (
            <button
              onClick={() => setSelectedProductId(null)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                selectedProductId === null
                  ? 'bg-navy text-white border-navy'
                  : 'bg-white text-grey-600 border-grey-200 hover:border-grey-300'
              }`}
            >
              All Products
            </button>
          )}
          {products.map((p) => {
            const badge = PRODUCT_STATUS_BADGE[p.status] ?? PRODUCT_STATUS_BADGE.pending
            const isSelected = selectedProductId === p.id
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProductId(p.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                  isSelected
                    ? 'bg-blue/8 text-blue border-blue shadow-[0_0_0_3px_rgba(0,102,204,0.12)]'
                    : 'bg-white text-grey-600 border-grey-200 hover:border-grey-300 hover:text-grey-800'
                }`}
              >
                {productDisplayName(p)}
                {p.serial_number && (
                  <span className="font-mono text-[10px] opacity-70">
                    {p.serial_number}
                  </span>
                )}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badge.className}`}>
                  {badge.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

        {/* LEFT COLUMN */}
        <div className="space-y-5">

          {/* Workshop Stage + Hold + Approval controls */}
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
            slotBetweenReviewAndStage={
              <SubmissionDetailsCard
                submissionDetails={submissionDetails}
                products={products}
              />
            }
          />

          {/* Post Update */}
          <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
            <div className="px-[22px] py-[18px] border-b border-grey-100">
              <h2 className="font-heading text-sm font-semibold text-text">
                Post Update{selectedProduct ? ` — ${productDisplayName(selectedProduct)}` : ''}
              </h2>
            </div>
            <AdminPostUpdateForm
              caseId={caseId}
              productId={selectedProduct?.id}
              currentStatus={caseData.status}
              // workshopStage is product-aware; isOnHold/holdReason are case-level only.
              // If hold is ever implemented per-product, update these two props accordingly.
              workshopStage={selectedProduct?.workshop_stage ?? caseData.workshop_stage ?? null}
              isOnHold={caseData.is_on_hold}
              holdReason={caseData.hold_reason}
            />
          </div>

          {/* Case Timeline */}
          <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
            <div className="px-[22px] py-[18px] border-b border-grey-100 flex items-center justify-between gap-3">
              <h2 className="font-heading text-sm font-semibold text-text">Case Timeline</h2>
              {isMultiProduct && (
                <span className="text-[11px] text-grey-400">
                  {selectedProductId
                    ? `Showing case-level + ${productDisplayName(selectedProduct!)} entries`
                    : 'Showing all products'}
                </span>
              )}
            </div>
            <div className="px-[22px] py-5">
              {visibleUpdates.length === 0 ? (
                <p className="text-[13px] text-grey-400">No updates yet.</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-grey-200" />
                  <div className="space-y-5">
                    {visibleUpdates.map((update, i) => (
                      <div key={update.id} className="flex gap-4">
                        <div className="relative z-10 flex-shrink-0">
                          <div className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                            update.status_change_to ? 'bg-blue' : update.is_internal ? 'bg-amber-400' : i === 0 ? 'bg-brand-accent' : 'bg-grey-300'
                          }`}>
                            {update.status_change_to ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" className="w-2.5 h-2.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                        <div className={`flex-1 pb-1 min-w-0 rounded-lg px-3 py-2 ${
                          update.is_internal ? 'bg-amber-50 border border-amber-200' : ''
                        }`}>
                          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                            {update.is_internal && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                Internal Note
                              </span>
                            )}
                            {update.status_change_to && (
                              <span className="text-[10px] font-semibold text-blue bg-blue/8 px-2 py-0.5 rounded-full">
                                Status update
                              </span>
                            )}
                            {/* Product tag — shown in "All" view when the entry is product-specific */}
                            {update.product_id && !selectedProductId && (() => {
                              const p = products.find((x) => x.id === update.product_id)
                              return p ? (
                                <span className="text-[10px] font-semibold text-blue/70 bg-blue/5 border border-blue/15 px-2 py-0.5 rounded-full">
                                  {productDisplayName(p)}
                                </span>
                              ) : null
                            })()}
                            <span className="font-mono text-[11px] text-grey-400">
                              {formatDateTime(update.created_at)}
                            </span>
                          </div>
                          <p className="text-[13px] text-grey-700 leading-relaxed">{update.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">

          {/* Customer Account */}
          <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-grey-100">
              <h2 className="font-heading text-sm font-semibold text-text">Customer</h2>
            </div>
            <div className="px-4 py-4">
              {customer ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-grey-200 flex items-center justify-center text-[12px] font-bold text-grey-500 flex-shrink-0">
                      {(customer.full_name ?? customer.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-text">{customer.full_name ?? '—'}</div>
                      <div className="text-[11px] text-grey-400">{customer.email}</div>
                    </div>
                  </div>
                  {customer.company && (
                    <div className="text-[12px] text-grey-600 mb-2">{customer.company}</div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {customerAccount?.credit_terms && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Credit Terms</span>
                    )}
                    {customerAccount?.po_required && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue/10 text-blue">PO Required</span>
                    )}
                    {poNumber && (
                      <span className="text-[10px] font-mono text-grey-500">PO: {poNumber}</span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-[13px] text-grey-400">Guest submission</p>
              )}
            </div>
          </div>

          {/* Case Details */}
          <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-grey-100">
              <h2 className="font-heading text-sm font-semibold text-text">Case Details</h2>
            </div>
            <div className="divide-y divide-grey-100">
              {[
                { label: 'Office',     value: office },
                { label: 'Fault Type', value: FAULT_TYPE_LABELS[faultType] ?? faultType },
                { label: 'Payment',    value: paymentStatus },
                { label: 'Submitted',  value: formatDate(submittedAt) },
              ].filter((row) => !!row.value).map(({ label, value }) => (
                <div key={label} className="grid grid-cols-2 px-4 py-2.5">
                  <span className="text-[11px] font-semibold text-grey-400 uppercase tracking-[0.06em]">{label}</span>
                  <span className="text-[13px] text-text font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Products — full list with status badges, fee basis, and SAP data */}
          <ProductsCard
            caseId={caseId}
            products={products}
            sapSalesOrder={caseData.sap_sales_order ?? null}
            sapDaysOpen={caseData.sap_days_open ?? null}
            lastImportAt={caseData.last_import_at ?? null}
          />

          {/* Attachments */}
          <AdminAttachmentsCard caseId={caseId} initialAttachments={attachments} />
        </div>
      </div>
    </div>
  )
}

// ── ProductsCard ─────────────────────────────────────────────────────────────

const FEE_BASIS_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'warranty', label: 'Warranty (no charge)' },
  { value: 'foc',      label: 'FOC (no charge)' },
]

const FEE_BASIS_BADGE: Record<string, { label: string; className: string }> = {
  standard: { label: 'Standard',        className: 'bg-grey-100 text-grey-500' },
  warranty: { label: 'Warranty',         className: 'bg-purple-100 text-purple-700' },
  foc:      { label: 'FOC',             className: 'bg-blue/10 text-blue' },
}

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
}) {
  const router = useRouter()
  // Sales Order inline edit (case-level)
  const [salesOrderEditing, setSalesOrderEditing] = useState(false)
  const [salesOrderValue, setSalesOrderValue] = useState(sapSalesOrder ?? '')
  const [salesOrderSaving, setSalesOrderSaving] = useState(false)
  const [salesOrderError, setSalesOrderError] = useState<string | null>(null)
  // Fee basis — tracks which product is currently being saved
  const [feeSavingId, setFeeSavingId] = useState<string | null>(null)
  const [feeError, setFeeError] = useState<string | null>(null)
  // SAP inline edit — one product open at a time
  const [sapEditId, setSapEditId] = useState<string | null>(null)
  const [sapSaving, setSapSaving] = useState(false)
  const [sapError, setSapError] = useState<string | null>(null)
  const [sapForm, setSapForm] = useState<Record<string, string>>({})

  async function saveSalesOrder() {
    setSalesOrderSaving(true)
    setSalesOrderError(null)
    try {
      const res = await fetch(`/api/cases/${caseId}/sap`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sap_sales_order: salesOrderValue.trim() || null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSalesOrderError(data.message ?? 'Failed to save')
        return
      }
      setSalesOrderEditing(false)
      router.refresh()
    } catch {
      setSalesOrderError('Failed to save')
    } finally {
      setSalesOrderSaving(false)
    }
  }

  function openSapEdit(p: CaseProductFull) {
    setSapEditId(p.id)
    setSapError(null)
    setSapForm({
      sap_works_order:          p.sap_works_order ?? '',
      sap_estimated_completion: p.sap_estimated_completion ?? '',
      sap_order_value:          p.sap_order_value != null ? String(p.sap_order_value) : '',
      sap_spent_hours:          p.sap_spent_hours != null ? String(p.sap_spent_hours) : '',
    })
  }

  function closeSapEdit() {
    setSapEditId(null)
    setSapError(null)
  }

  async function saveSap(productId: string) {
    setSapSaving(true)
    setSapError(null)
    try {
      const res = await fetch(`/api/cases/${caseId}/products/${productId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sap_works_order:          sapForm.sap_works_order.trim() || null,
          sap_estimated_completion: sapForm.sap_estimated_completion || null,
          sap_order_value:          sapForm.sap_order_value !== '' ? parseFloat(sapForm.sap_order_value) : null,
          sap_spent_hours:          sapForm.sap_spent_hours !== '' ? parseFloat(sapForm.sap_spent_hours) : null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSapError(data.message ?? 'Failed to save')
        return
      }
      setSapEditId(null)
      router.refresh()
    } catch {
      setSapError('Failed to save')
    } finally {
      setSapSaving(false)
    }
  }

  async function handleFeeBasisChange(productId: string, newBasis: string) {
    setFeeSavingId(productId)
    setFeeError(null)
    try {
      const res = await fetch(`/api/cases/${caseId}/products/${productId}/fee-basis`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fee_basis: newBasis }),
      })
      if (!res.ok) {
        const data = await res.json()
        setFeeError(data.message ?? 'Failed to update fee basis')
        return
      }
      router.refresh()
    } catch {
      setFeeError('Failed to update fee basis')
    } finally {
      setFeeSavingId(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3.5 border-b border-grey-100">
        <h2 className="font-heading text-sm font-semibold text-text">Products</h2>
      </div>

      {/* Case-level SAP fields: Sales Order + Days Open / Last Import */}
      <div className="px-4 py-3 border-b border-grey-100 bg-grey-50 space-y-2">
        {/* Sales Order row */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-grey-400 uppercase tracking-[0.06em] w-24 flex-shrink-0">
            Sales Order
          </span>
          {salesOrderEditing ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <input
                type="text"
                value={salesOrderValue}
                onChange={(e) => setSalesOrderValue(e.target.value)}
                placeholder="e.g. 4500001234"
                className="flex-1 min-w-0 text-[12px] font-mono border border-grey-200 rounded-md px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') saveSalesOrder(); if (e.key === 'Escape') setSalesOrderEditing(false) }}
              />
              <button
                onClick={() => setSalesOrderEditing(false)}
                className="text-[11px] text-grey-500 hover:text-grey-700 font-semibold flex-shrink-0"
              >
                Cancel
              </button>
              <button
                onClick={saveSalesOrder}
                disabled={salesOrderSaving}
                className="text-[11px] font-semibold text-white bg-navy hover:bg-navy-mid px-2 py-0.5 rounded-md transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {salesOrderSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {sapSalesOrder
                ? <span className="font-mono text-[12px] text-text">{sapSalesOrder}</span>
                : <span className="text-[11px] text-grey-400 italic">Not set</span>
              }
              <button
                onClick={() => { setSalesOrderEditing(true); setSalesOrderValue(sapSalesOrder ?? '') }}
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-blue hover:text-blue-light transition-colors ml-1"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                {sapSalesOrder ? 'Edit' : 'Add'}
              </button>
            </div>
          )}
        </div>
        {salesOrderError && (
          <p className="text-[11px] text-red-600">{salesOrderError}</p>
        )}
        {/* Days Open + Last Import row — only shown if data exists */}
        {(sapDaysOpen != null || lastImportAt) && (
          <div className="flex items-center gap-3 text-[11px] text-grey-400">
            {sapDaysOpen != null && (
              <span><span className="font-semibold text-grey-600">{sapDaysOpen}</span> days open</span>
            )}
            {sapDaysOpen != null && lastImportAt && <span>·</span>}
            {lastImportAt && (
              <span>Last import: {formatDateTime(lastImportAt)}</span>
            )}
          </div>
        )}
      </div>

      {(feeError || sapError) && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-[12px] text-red-600">
          {feeError ?? sapError}
        </div>
      )}
      <div className="divide-y divide-grey-100">
        {products.map((p) => {
          const statusBadge = PRODUCT_STATUS_BADGE[p.status] ?? PRODUCT_STATUS_BADGE.pending
          const feeBadge = FEE_BASIS_BADGE[p.fee_basis] ?? FEE_BASIS_BADGE.standard
          const name = p.products
            ? `${p.products.display_name}${p.products.variant ? ` ${p.products.variant}` : ''}`
            : 'Unknown product'
          const isEditingSap = sapEditId === p.id

          // SAP summary values for display
          const hasSapData = p.sap_works_order || p.sap_order_value != null || p.sap_spent_hours != null || p.sap_estimated_completion

          return (
            <div key={p.id} className="px-4 py-3.5">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-text leading-tight">{name}</div>
                  <div className="font-mono text-[11px] text-grey-400 mt-0.5">
                    {p.products?.part_number ?? '—'}
                    {p.serial_number && (
                      <span className="ml-2">· S/N {p.serial_number}</span>
                    )}
                  </div>
                </div>
                <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge.className}`}>
                  {statusBadge.label}
                </span>
              </div>

              {/* Fee Basis */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-semibold text-grey-400 uppercase tracking-[0.06em]">
                  Fee
                </span>
                {feeSavingId === p.id ? (
                  <span className="text-[11px] text-grey-400">Saving…</span>
                ) : (
                  <select
                    value={p.fee_basis ?? 'standard'}
                    onChange={(e) => handleFeeBasisChange(p.id, e.target.value)}
                    className="text-[11px] font-semibold border border-grey-200 rounded-md px-2 py-0.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue cursor-pointer"
                  >
                    {FEE_BASIS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${feeBadge.className}`}>
                  {feeBadge.label}
                </span>
              </div>

              {/* SAP Data section */}
              <div className="border border-grey-100 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-grey-50">
                  <span className="text-[10px] font-semibold text-grey-500 uppercase tracking-[0.06em]">SAP Data</span>
                  {!isEditingSap ? (
                    <button
                      onClick={() => openSapEdit(p)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue hover:text-blue-light transition-colors"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      {hasSapData ? 'Edit' : 'Add'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={closeSapEdit}
                        className="text-[11px] font-semibold text-grey-500 hover:text-grey-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveSap(p.id)}
                        disabled={sapSaving}
                        className="text-[11px] font-semibold text-white bg-navy hover:bg-navy-mid px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
                      >
                        {sapSaving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>

                {isEditingSap ? (
                  <div className="px-3 py-2.5 grid grid-cols-2 gap-2">
                    {[
                      { label: 'Works Order',   key: 'sap_works_order',          type: 'text',   placeholder: 'e.g. 7654321' },
                      { label: 'Est. Completion', key: 'sap_estimated_completion', type: 'date',   placeholder: '' },
                      { label: 'Order Value (£)', key: 'sap_order_value',          type: 'number', placeholder: '0.00' },
                      { label: 'Spent Hours',    key: 'sap_spent_hours',          type: 'number', placeholder: '0.0' },
                    ].map(({ label, key, type, placeholder }) => (
                      <div key={key}>
                        <label className="block text-[10px] font-semibold text-grey-400 uppercase tracking-[0.05em] mb-1">
                          {label}
                        </label>
                        <input
                          type={type}
                          value={sapForm[key] ?? ''}
                          onChange={(e) => setSapForm((f) => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          step={type === 'number' ? '0.01' : undefined}
                          min={type === 'number' ? '0' : undefined}
                          className="w-full text-[12px] border border-grey-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue"
                        />
                      </div>
                    ))}
                    {sapError && (
                      <p className="col-span-2 text-[11px] text-red-600">{sapError}</p>
                    )}
                  </div>
                ) : hasSapData ? (
                  <div className="px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1">
                    {p.sap_works_order && (
                      <div>
                        <span className="text-[10px] text-grey-400">Works Order</span>
                        <div className="font-mono text-[12px] text-text">{p.sap_works_order}</div>
                      </div>
                    )}
                    {p.sap_estimated_completion && (
                      <div>
                        <span className="text-[10px] text-grey-400">Est. Completion</span>
                        <div className="text-[12px] text-text">{formatDate(p.sap_estimated_completion)}</div>
                      </div>
                    )}
                    {p.sap_order_value != null && (
                      <div>
                        <span className="text-[10px] text-grey-400">Order Value</span>
                        <div className="font-mono text-[12px] text-text">£{Number(p.sap_order_value).toFixed(2)}</div>
                      </div>
                    )}
                    {p.sap_spent_hours != null && (
                      <div>
                        <span className="text-[10px] text-grey-400">Spent Hours</span>
                        <div className="font-mono text-[12px] text-text">{p.sap_spent_hours}h</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-3 py-2">
                    <span className="text-[11px] text-grey-400 italic">No SAP data entered yet</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── SubmissionDetailsCard ────────────────────────────────────────────────────

const FAULT_FOLLOWS_LABELS: Record<string, string> = {
  unit: 'Fault follows the unit',
  car:  'Fault follows the car',
}

function SubmissionDetailsCard({
  submissionDetails,
  products,
}: {
  submissionDetails: SubmissionDetails
  products: CaseProductFull[]
}) {
  const {
    fault_description,
    fault_display_info,
    fault_display_details,
    tested_on_other_unit,
    fault_follows,
    required_return_date,
    shipping_address,
  } = submissionDetails

  const addr = shipping_address

  return (
    <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
      <div className="px-[22px] py-[18px] border-b border-grey-100">
        <h2 className="font-heading text-sm font-semibold text-text">Submission Details</h2>
        <p className="text-[11px] text-grey-400 mt-0.5">As submitted by the customer</p>
      </div>

      <div className="divide-y divide-grey-100">

        {/* All products — always show every product as submitted regardless of selected tab */}
        {products.map((p, i) => {
          const name = p.products
            ? `${p.products.display_name}${p.products.variant ? ` ${p.products.variant}` : ''}`
            : 'Unknown product'
          return (
            <div key={p.id} className="px-[22px] py-4">
              {/* Product header row */}
              <div className="flex items-start gap-3 mb-3">
                {/* Index pill */}
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-navy text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-text leading-snug">{name}</div>
                  <div className="font-mono text-[11px] text-grey-400 mt-0.5">
                    {p.products?.part_number ?? '—'}
                    {p.serial_number && (
                      <span className="ml-3 text-grey-400">
                        S/N: <span className="text-grey-500">{p.serial_number}</span>
                      </span>
                    )}
                    {!p.serial_number && (
                      <span className="ml-3 text-grey-300">No serial number</span>
                    )}
                  </div>
                </div>
                {p.quantity > 1 && (
                  <span className="flex-shrink-0 text-[11px] font-semibold text-grey-500 bg-grey-100 px-2 py-0.5 rounded-full">
                    Qty {p.quantity}
                  </span>
                )}
              </div>
              {/* Fault notes */}
              {p.fault_notes ? (
                <div className="ml-8 bg-grey-50 rounded-lg px-3 py-2.5 border border-grey-100">
                  <div className="text-[10px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-1">
                    Reported Fault
                  </div>
                  <p className="text-[13px] text-grey-700 leading-relaxed">{p.fault_notes}</p>
                </div>
              ) : (
                <p className="ml-8 text-[12px] text-grey-400 italic">No fault notes provided.</p>
              )}
            </div>
          )
        })}

        {/* General fault description */}
        {fault_description && (
          <div className="px-[22px] py-4">
            <div className="text-[10px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-1.5">
              General Fault Description
            </div>
            <p className="text-[13px] text-text leading-relaxed">{fault_description}</p>
          </div>
        )}

        {/* Diagnostic flags */}
        {(tested_on_other_unit !== undefined || fault_follows || fault_display_info) && (
          <div className="px-[22px] py-4 space-y-2">
            <div className="text-[10px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-2">
              Diagnostics
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${tested_on_other_unit ? 'bg-green-100' : 'bg-grey-100'}`}>
                {tested_on_other_unit ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="w-2.5 h-2.5 text-green-600">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="w-2.5 h-2.5 text-grey-400">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </span>
              <span className="text-[12px] text-grey-600">
                {tested_on_other_unit ? 'Tested on another unit' : 'Not tested on another unit'}
              </span>
            </div>
            {fault_follows && (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full flex-shrink-0 bg-blue/10 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue" />
                </span>
                <span className="text-[12px] text-grey-600">{FAULT_FOLLOWS_LABELS[fault_follows] ?? fault_follows}</span>
              </div>
            )}
            {fault_display_info && (
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 bg-amber-100 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                </span>
                <div>
                  <span className="text-[12px] text-grey-600">Display issue reported</span>
                  {fault_display_details && (
                    <p className="text-[11px] text-grey-500 mt-0.5">{fault_display_details}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Required return date + return address — side by side */}
        {(required_return_date || addr) && (
          <div className="px-[22px] py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {required_return_date && (
              <div>
                <div className="text-[10px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-1.5">
                  Required By
                </div>
                <span className="text-[13px] text-text font-medium">{formatDate(required_return_date)}</span>
              </div>
            )}
            {addr && (
              <div>
                <div className="text-[10px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-1.5">
                  Return Address
                </div>
                <address className="not-italic text-[12px] text-grey-600 leading-relaxed space-y-0.5">
                  {addr.name     && <div className="font-semibold text-text">{addr.name}</div>}
                  {addr.company  && <div>{addr.company}</div>}
                  {(addr.street ?? addr.address_line1) && <div>{addr.street ?? addr.address_line1}</div>}
                  {addr.address_line2 && <div>{addr.address_line2}</div>}
                  {(addr.city || addr.postcode) && (
                    <div>{[addr.city, addr.postcode].filter(Boolean).join(', ')}</div>
                  )}
                  {addr.country  && <div>{addr.country}</div>}
                  {addr.phone    && <div className="mt-1 text-grey-500">{addr.phone}</div>}
                  {addr.email    && <div className="text-grey-500">{addr.email}</div>}
                </address>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
