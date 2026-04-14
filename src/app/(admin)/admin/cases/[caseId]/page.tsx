import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import type { CaseAttachmentRow } from '@/types/database'
import AdminCaseDetailClient from '@/components/admin/AdminCaseDetailClient'
import type { CaseUpdateFull, SubmissionDetails } from '@/components/admin/AdminCaseDetailClient'

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review', AWAITING_PAYMENT: 'Awaiting Payment',
  RMA_ISSUED: 'RMA Issued', PARTS_RECEIVED: 'Parts Received', IN_REPAIR: 'In Repair',
  QUALITY_CHECK: 'Quality Check', READY_TO_RETURN: 'Ready to Return', CLOSED: 'Closed', REJECTED: 'Rejected',
}

const STATUS_COLOUR: Record<string, string> = {
  SUBMITTED: 'bg-blue/10 text-blue', UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  AWAITING_PAYMENT: 'bg-orange-100 text-orange-700', RMA_ISSUED: 'bg-purple-100 text-purple-700',
  PARTS_RECEIVED: 'bg-cyan-100 text-cyan-700', IN_REPAIR: 'bg-blue/10 text-blue',
  QUALITY_CHECK: 'bg-indigo-100 text-indigo-700', READY_TO_RETURN: 'bg-teal-100 text-teal-700',
  CLOSED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-600',
}

interface Props {
  params: Promise<{ caseId: string }>
}

export default async function AdminCaseDetailPage({ params }: Props) {
  const { caseId } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const supabase = createServiceClient()

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('email', session.user.email)
    .single()

  const role = (userProfile as { role: string } | null)?.role ?? ''
  if (!['staff_uk', 'staff_us', 'admin'].includes(role)) redirect('/')

  const { data: caseData, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single()

  if (error || !caseData) notFound()

  // Attempt the full query (requires migrations 006-009). If any column doesn't
  // exist yet the whole PostgREST request returns null — fall back to a minimal
  // query so at least the product names and fault notes are visible.
  const fullProductsQuery = await supabase
    .from('case_products')
    .select(`
      id, serial_number, quantity, fault_notes, status, rejection_reason,
      workshop_stage, workshop_findings, staff_notes,
      sap_works_order, sap_estimated_completion, sap_order_value, sap_spent_hours,
      fee_basis,
      products(part_number, display_name, variant)
    `)
    .eq('case_id', caseId)
    .order('created_at', { ascending: true })

  let productsResult = fullProductsQuery
  if (fullProductsQuery.error) {
    console.warn('Full case_products query failed (migrations pending?):', fullProductsQuery.error.message)
    // Fall back to base columns only — always present regardless of migrations
    const fallback = await supabase
      .from('case_products')
      .select('id, serial_number, quantity, fault_notes, products(part_number, display_name, variant)')
      .eq('case_id', caseId)
    productsResult = fallback as typeof fullProductsQuery
  }

  const [updatesResult, customerResult, attachmentsResult] = await Promise.all([
    supabase
      .from('case_updates')
      .select('id, created_at, content, is_internal, status_change_to, product_id')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false }),
    caseData.customer_id
      ? supabase
          .from('users')
          .select('full_name, email, company')
          .eq('id', caseData.customer_id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from('case_attachments')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false }),
  ])

  const products = (productsResult.data ?? []) as Parameters<typeof AdminCaseDetailClient>[0]['products']
  const updates = (updatesResult.data ?? []) as CaseUpdateFull[]
  const customer = customerResult.data as { full_name: string | null; email: string; company: string | null } | null

  // Generate signed download URLs for attachments
  const rawAttachments = (attachmentsResult.data ?? []) as CaseAttachmentRow[]
  const BUCKET = 'case-attachments'
  const attachments = await Promise.all(
    rawAttachments.map(async (a) => {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(a.storage_path, 3600)
      return { ...a, downloadUrl: signed?.signedUrl ?? null }
    })
  )

  const { data: customerAccount } = caseData.customer_id
    ? await supabase
        .from('customer_accounts')
        .select('credit_terms, po_required')
        .eq('user_id', caseData.customer_id)
        .single()
    : { data: null }

  const isMultiProduct = products.length > 1

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-heading text-[22px] font-bold text-text">{caseData.case_number}</h1>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLOUR[caseData.status] ?? 'bg-grey-100 text-grey-600'}`}>
              {STATUS_LABELS[caseData.status] ?? caseData.status}
            </span>
            {caseData.is_on_hold && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                On Hold
              </span>
            )}
          </div>
          {customer && (
            <p className="text-[13px] text-grey-500">
              {customer.full_name} · {customer.company ?? customer.email}
            </p>
          )}
        </div>
      </div>

      {/* Reference boxes */}
      <div className={`grid gap-3 mb-6 ${isMultiProduct ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {[
          { label: 'Case ID',        value: caseData.case_number,    colour: 'text-blue' },
          { label: 'RMA Number',     value: caseData.rma_number,     colour: 'text-purple-600' },
          { label: 'SAP Sales Order', value: caseData.sap_sales_order, colour: 'text-text' },
          // For multi-product cases, the Works Order lives per-product — omit from header
          ...(!isMultiProduct
            ? [{ label: 'SAP Works Order', value: caseData.sap_works_order, colour: 'text-text' }]
            : []),
        ].map(({ label, value, colour }) => (
          <div key={label} className="bg-white border border-grey-200 rounded-[10px] p-3 text-center">
            <div className="text-[10px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-1.5">{label}</div>
            {value
              ? <div className={`font-mono text-[12px] font-semibold ${colour}`}>{value}</div>
              : <div className="text-[11px] text-grey-400 italic">
                  {label === 'SAP Sales Order' ? 'Pending' : 'Pending'}
                </div>
            }
          </div>
        ))}
        {isMultiProduct && (
          <div className="bg-white border border-grey-200 rounded-[10px] p-3 text-center">
            <div className="text-[10px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-1.5">
              Works Order
            </div>
            <div className="text-[11px] text-grey-400 italic">Per product</div>
          </div>
        )}
      </div>

      {/* Main content — client component manages product selection */}
      <AdminCaseDetailClient
        caseId={caseId}
        caseData={{
          id: caseData.id,
          status: caseData.status,
          workshop_stage: caseData.workshop_stage ?? null,
          is_on_hold: caseData.is_on_hold,
          hold_reason: caseData.hold_reason ?? null,
          hold_customer_label: caseData.hold_customer_label ?? null,
          sap_sales_order: caseData.sap_sales_order ?? null,
          sap_works_order: caseData.sap_works_order ?? null,
          sap_estimated_completion: caseData.sap_estimated_completion ?? null,
          sap_order_value: caseData.sap_order_value ?? null,
          sap_spent_hours: caseData.sap_spent_hours ?? null,
          sap_days_open: caseData.sap_days_open ?? null,
          last_import_at: caseData.last_import_at ?? null,
        }}
        products={products}
        updates={updates}
        customer={customer}
        customerAccount={(customerAccount as { credit_terms: boolean; po_required: boolean } | null)}
        attachments={attachments}
        poNumber={caseData.po_number ?? null}
        office={caseData.office}
        faultType={caseData.fault_type}
        caseNumber={caseData.case_number}
        rmaNumber={caseData.rma_number ?? null}
        submittedAt={caseData.created_at}
        paymentStatus={caseData.payment_status ?? null}
        submissionDetails={{
          fault_description:    caseData.fault_description ?? null,
          fault_display_info:   caseData.fault_display_info ?? false,
          fault_display_details: caseData.fault_display_details ?? null,
          tested_on_other_unit: caseData.tested_on_other_unit ?? false,
          fault_follows:        caseData.fault_follows ?? null,
          required_return_date: caseData.required_return_date ?? null,
          shipping_address:     (caseData.shipping_address as SubmissionDetails['shipping_address']) ?? null,
        }}
      />
    </div>
  )
}
