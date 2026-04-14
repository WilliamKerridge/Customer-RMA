import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import StripePaymentForm from './StripePaymentForm'

const UK_CONTACT = { email: 'returns@cosworth.com', phone: '+44 (0)1895 246100' }
const US_CONTACT = { email: 'us-returns@cosworth.com', phone: '+1 (317) 570-7600' }

function formatCurrency(amount: number | null) {
  if (!amount) return '—'
  return `£${Number(amount).toFixed(2)}`
}

interface Props {
  params: Promise<{ caseId: string }>
}

export default async function PaymentPage({ params }: Props) {
  const { caseId } = await params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect(`/login?next=/payment/${caseId}`)

  const supabase = createServiceClient()

  const { data: caseRow } = await supabase
    .from('cases')
    .select('id, case_number, payment_status, payment_required, office, stripe_payment_intent_id, customer_id')
    .eq('id', caseId)
    .single()

  if (!caseRow) redirect('/cases')

  // Verify this is the customer's own case
  if (caseRow.customer_id) {
    const { data: userProfile } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()
    const userId = (userProfile as { id: string } | null)?.id
    if (userId && caseRow.customer_id !== userId) redirect('/cases')
  }

  // Already paid — redirect back to case
  if (['paid', 'waived', 'invoiced'].includes(caseRow.payment_status)) {
    redirect(`/cases/${caseId}`)
  }

  const paymentMode = process.env.PAYMENT_MODE ?? 'stub'
  const contact = caseRow.office === 'US' ? US_CONTACT : UK_CONTACT
  // Fee is determined after review — placeholder at submission stage
  const amount = 0

  // ── Stub mode ────────────────────────────────────────────────────────────
  if (paymentMode !== 'stripe') {
    return (
      <>
        {/* Hero */}
        <div className="bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8 relative overflow-hidden">
          <div className="absolute -top-15 -right-15 w-75 h-75 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(0,180,216,0.12) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-px opacity-40"
            style={{ background: 'linear-gradient(90deg, transparent, #00b4d8, transparent)' }} />
          <div className="max-w-[600px] mx-auto">
            <h1 className="font-heading text-[26px] font-bold text-white leading-tight">Payment Required</h1>
            <p className="mt-1.5 text-[13px] text-white/60">Case {caseRow.case_number}</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-[600px] mx-auto px-6 py-8">
          {/* Case reference + amount */}
          <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden mb-5">
            <div className="px-6 py-5 border-b border-grey-100">
              <h2 className="font-heading text-sm font-semibold text-text">Payment Details</h2>
            </div>
            <div className="divide-y divide-grey-100">
              {[
                { label: 'Case Reference', value: caseRow.case_number },
                { label: 'Inspection Fee', value: amount > 0 ? formatCurrency(amount) : 'To be confirmed' },
              ].map(({ label, value }) => (
                <div key={label} className="grid grid-cols-2 px-6 py-3.5">
                  <span className="text-[11px] font-semibold text-grey-400 uppercase tracking-[0.06em]">{label}</span>
                  <span className="text-[13px] font-semibold text-text">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Amber info box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-5">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-amber-800 mb-1">Payment to be arranged by our team</p>
                <p className="text-[12.5px] text-amber-700 leading-relaxed">
                  A member of our Cosworth team will contact you within 24 hours to arrange payment. Please quote your case reference{' '}
                  <span className="font-mono font-bold">{caseRow.case_number}</span> in all correspondence.
                </p>
              </div>
            </div>
          </div>

          {/* Contact details */}
          <div className="bg-white rounded-xl border border-grey-200 shadow-sm px-5 py-4 mb-6">
            <p className="text-[12px] font-semibold text-grey-500 mb-3 uppercase tracking-[0.06em]">Contact Details</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[13px] text-text">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <a href={`mailto:${contact.email}`} className="text-blue hover:underline">{contact.email}</a>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-text">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 .18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>
                <span>{contact.phone}</span>
              </div>
            </div>
          </div>

          <Link
            href="/cases"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-navy text-white hover:bg-navy-mid transition-all"
          >
            Return to My Cases
          </Link>
        </div>
      </>
    )
  }

  // ── Stripe mode ───────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8 relative overflow-hidden">
        <div className="absolute -top-15 -right-15 w-75 h-75 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,180,216,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px opacity-40"
          style={{ background: 'linear-gradient(90deg, transparent, #00b4d8, transparent)' }} />
        <div className="max-w-[600px] mx-auto">
          <h1 className="font-heading text-[26px] font-bold text-white leading-tight">Complete Payment</h1>
          <p className="mt-1.5 text-[13px] text-white/60">Case {caseRow.case_number} · {formatCurrency(amount)}</p>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto px-6 py-8">
        <StripePaymentForm
          caseId={caseId}
          caseNumber={caseRow.case_number}
          amount={amount}
          existingIntentId={caseRow.stripe_payment_intent_id}
        />
      </div>
    </>
  )
}
