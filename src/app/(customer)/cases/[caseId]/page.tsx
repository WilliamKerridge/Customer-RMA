import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createUserScopedClient } from '@/lib/supabase/with-auth'
import WorkshopStageTracker from '@/components/cases/WorkshopStageTracker'
import CaseTimeline from '@/components/cases/CaseTimeline'
import HoldStateBanner from '@/components/cases/HoldStateBanner'
import type { CaseUpdateRow } from '@/types/database'

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  AWAITING_PAYMENT: 'Awaiting Payment',
  RMA_ISSUED: 'RMA Issued',
  PARTS_RECEIVED: 'Parts Received',
  IN_REPAIR: 'In Repair',
  QUALITY_CHECK: 'Quality Check',
  READY_TO_RETURN: 'Ready to Return',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
}

const FAULT_TYPE_LABELS: Record<string, string> = {
  repair: 'Repair',
  service: 'End of Season Service',
  service_plan: 'Service Plan',
  loan_return: 'Loan Unit Return',
  code_update: 'Code Update',
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  waived: 'Waived',
  invoiced: 'Invoiced',
  stub_notified: 'Awaiting Contact',
}

const UK_ADDRESS = `Cosworth Electronics Ltd\nAcorn House, Bakers Road\nUxbridge, UB8 1RG\nUnited Kingdom`
const US_ADDRESS = `Cosworth Electronics LLC\n8720 Castle Park Drive\nIndianapolis, IN 46256\nUSA`

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface Props {
  params: Promise<{ caseId: string }>
}

export default async function CaseDetailPage({ params }: Props) {
  const { caseId } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect(`/login?next=/cases/${caseId}`)

  // Resolves canonical UUID from public.users by email (better-auth IDs differ).
  // Returns the service client + UUID for use in customer_id filters.
  const { supabase, userId } = await createUserScopedClient(session.user.email)

  // Fetch case — customer_id filter is the security boundary (404 if not their case)
  const { data: caseData, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .eq('customer_id', userId)
    .single()

  if (error || !caseData) notFound()

  // Fetch products for this case
  const { data: caseProducts } = await supabase
    .from('case_products')
    .select('*, products(part_number, display_name, variant)')
    .eq('case_id', caseId)

  // Fetch non-internal updates
  const { data: updates } = await supabase
    .from('case_updates')
    .select('*')
    .eq('case_id', caseId)
    .eq('is_internal', false)
    .order('created_at', { ascending: false })

  const showWorkshop = caseData.status === 'IN_REPAIR' || !!caseData.workshop_stage
  const showShipping = ['RMA_ISSUED', 'PARTS_RECEIVED', 'IN_REPAIR', 'QUALITY_CHECK', 'READY_TO_RETURN', 'CLOSED'].includes(caseData.status)
  const shippingAddress = caseData.office === 'UK' ? UK_ADDRESS : US_ADDRESS

  type CaseProduct = {
    id: string
    serial_number: string | null
    quantity: number
    fault_notes: string | null
    products: { part_number: string; display_name: string; variant: string | null } | null
  }

  return (
    <>
      {/* Hero */}
      <div className="bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8 relative overflow-hidden">
        <div className="absolute -top-15 -right-15 w-75 h-75 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,180,216,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px opacity-40"
          style={{ background: 'linear-gradient(90deg, transparent, #00b4d8, transparent)' }} />
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center gap-2 text-[12px] text-white/50 mb-2.5 font-mono">
            <Link href="/cases" className="hover:text-white/80 transition-colors">My Returns</Link>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-brand-accent">{caseData.case_number}</span>
          </div>
          <h1 className="font-heading text-[26px] font-bold text-white leading-tight">
            Case {caseData.case_number}
          </h1>
          <p className="mt-1.5 text-[13px] text-white/60">
            {STATUS_LABELS[caseData.status] ?? caseData.status}
            {' · '}
            {FAULT_TYPE_LABELS[caseData.fault_type] ?? caseData.fault_type}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto w-full px-8 py-7">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-4 min-w-0">
            {/* Hold banners */}
            {caseData.is_on_hold && (
              <HoldStateBanner
                holdReason={caseData.hold_reason ?? ''}
                holdCustomerLabel={caseData.hold_customer_label ?? ''}
                awaitingCustomerQuestion={caseData.awaiting_customer_question}
                caseId={caseId}
              />
            )}

            {/* Workshop tracker */}
            {showWorkshop && (
              <WorkshopStageTracker
                workshopStage={caseData.workshop_stage}
                isOnHold={caseData.is_on_hold}
                estimatedCompletion={caseData.sap_estimated_completion}
                daysOpen={caseData.sap_days_open}
              />
            )}

            {/* Timeline */}
            <CaseTimeline updates={(updates ?? []) as CaseUpdateRow[]} />
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-4">
            {/* Reference boxes */}
            <div className="grid grid-cols-3 gap-2">
              <RefBox label="Case ID" value={caseData.case_number} colour="blue" />
              <RefBox label="RMA Number" value={caseData.rma_number} colour="purple" pending />
              <RefBox label="SAP Order" value={caseData.sap_sales_order} pending />
            </div>

            {/* Case details */}
            <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-grey-100">
                <h2 className="font-heading text-sm font-semibold text-text">Case Details</h2>
              </div>
              <div className="divide-y divide-grey-100">
                {[
                  { label: 'Office', value: caseData.office === 'UK' ? 'Cosworth Electronics UK' : 'Cosworth Electronics USA' },
                  { label: 'Fault Type', value: FAULT_TYPE_LABELS[caseData.fault_type] ?? caseData.fault_type },
                  { label: 'Required By', value: formatDate(caseData.required_return_date) },
                  { label: 'Est. Completion', value: formatDate(caseData.sap_estimated_completion) },
                  { label: 'PO Number', value: caseData.po_number },
                  { label: 'Payment', value: PAYMENT_STATUS_LABELS[caseData.payment_status] ?? caseData.payment_status },
                  { label: 'Submitted', value: formatDate(caseData.created_at) },
                ].map(({ label, value }) =>
                  value ? (
                    <div key={label} className="grid grid-cols-2 px-4 py-2.5">
                      <span className="text-[11px] font-semibold text-grey-400 uppercase tracking-[0.06em]">{label}</span>
                      <span className="text-[13px] text-text font-medium">{value}</span>
                    </div>
                  ) : null
                )}
              </div>
            </div>

            {/* Products */}
            <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-grey-100">
                <h2 className="font-heading text-sm font-semibold text-text">Products</h2>
              </div>
              <div className="divide-y divide-grey-100">
                {(caseProducts ?? []).map((cp: CaseProduct) => (
                  <div key={cp.id} className="px-4 py-3">
                    <div className="text-[13px] font-semibold text-text">
                      {cp.products
                        ? `${cp.products.display_name}${cp.products.variant ? ` ${cp.products.variant}` : ''}`
                        : 'Unknown product'}
                    </div>
                    {cp.products && (
                      <div className="text-[11px] text-grey-400 font-mono mt-0.5">{cp.products.part_number}</div>
                    )}
                    <div className="text-[12px] text-grey-500 mt-0.5">
                      {cp.serial_number ? `S/N: ${cp.serial_number} · ` : ''}Qty: {cp.quantity}
                    </div>
                    {cp.fault_notes && (
                      <p className="text-[12px] text-grey-500 mt-1 italic">{cp.fault_notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping instructions */}
            {showShipping && caseData.rma_number && (
              <div className="bg-blue/5 border border-blue/20 rounded-xl p-4">
                <h2 className="font-heading text-sm font-semibold text-text mb-2">Shipping Instructions</h2>
                <p className="text-[12.5px] text-grey-700 mb-3">
                  Please ship your unit to the address below, quoting your RMA number{' '}
                  <strong className="font-mono text-blue">{caseData.rma_number}</strong> on the outer packaging.
                </p>
                <pre className="text-[12px] text-grey-600 whitespace-pre-wrap font-sans leading-relaxed">
                  {shippingAddress}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function RefBox({
  label,
  value,
  colour,
  pending = false,
}: {
  label: string
  value: string | null
  colour?: 'blue' | 'purple'
  pending?: boolean
}) {
  return (
    <div className="bg-white border border-grey-200 rounded-[10px] p-3 text-center">
      <div className="text-[10px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-1.5">{label}</div>
      {value ? (
        <div
          className={`font-mono text-[12px] font-semibold ${
            colour === 'blue' ? 'text-blue' : colour === 'purple' ? 'text-purple-600' : 'text-text'
          }`}
        >
          {value}
        </div>
      ) : pending ? (
        <div className="text-[11px] text-grey-400 italic">Pending</div>
      ) : null}
    </div>
  )
}
