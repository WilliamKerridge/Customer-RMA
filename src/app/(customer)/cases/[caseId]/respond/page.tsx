import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import HoldStateBanner from '@/components/cases/HoldStateBanner'

interface Props {
  params: Promise<{ caseId: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function TokenisedRespondPage({ params, searchParams }: Props) {
  const { caseId } = await params
  const { token } = await searchParams

  if (!token) {
    return <InvalidTokenPage />
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  // Validate token
  const { data: tokenRow } = await supabase
    .from('case_response_tokens')
    .select('*')
    .eq('token', token)
    .eq('case_id', caseId)
    .is('used_at', null)
    .gt('expires_at', now)
    .single()

  if (!tokenRow) {
    return <InvalidTokenPage />
  }

  // Fetch the case
  const { data: caseRow } = await supabase
    .from('cases')
    .select('id, case_number, is_on_hold, hold_reason, hold_customer_label, awaiting_customer_question')
    .eq('id', caseId)
    .single()

  if (!caseRow) notFound()

  const alreadyResponded = !caseRow.is_on_hold || caseRow.hold_reason !== 'AWAITING_CUSTOMER'

  return (
    <div className="bg-gradient-to-b from-grey-50 to-white min-h-[calc(100vh-64px)]">
      {/* Page hero */}
      <div className="bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8 relative overflow-hidden">
        <div
          className="absolute -top-15 -right-15 w-75 h-75 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,180,216,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px opacity-40"
          style={{ background: 'linear-gradient(90deg, transparent, #00b4d8, transparent)' }}
        />
        <div className="max-w-[640px] mx-auto">
          <div className="flex items-center gap-2 text-[12px] text-white/50 mb-2.5 font-mono">
            <span>Case {caseRow.case_number}</span>
          </div>
          <h1 className="font-heading text-[26px] font-bold text-white leading-tight">
            Respond to Our Team
          </h1>
          <p className="mt-1.5 text-[13px] text-white/60">
            Your repair is paused while we wait for your response
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[640px] mx-auto px-6 py-8">
        {alreadyResponded ? (
          <div className="bg-white rounded-xl border border-green-200 shadow-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="font-heading text-[16px] font-bold text-text mb-2">Response Already Received</h2>
            <p className="text-[13px] text-grey-500">
              This case is no longer awaiting a response. Our team has been notified and will be in touch shortly.
            </p>
            <Link
              href={`/cases/${caseId}`}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-navy text-white hover:bg-navy-mid transition-all"
            >
              View Case
            </Link>
          </div>
        ) : (
          <HoldStateBanner
            holdReason={caseRow.hold_reason ?? ''}
            holdCustomerLabel={caseRow.hold_customer_label ?? ''}
            awaitingCustomerQuestion={caseRow.awaiting_customer_question}
            caseId={caseId}
            token={token}
          />
        )}

        <p className="mt-6 text-center text-[12px] text-grey-400">
          Have an account?{' '}
          <Link href={`/cases/${caseId}`} className="text-blue hover:underline">
            Sign in to view your full case
          </Link>
        </p>
      </div>
    </div>
  )
}

function InvalidTokenPage() {
  return (
    <div className="max-w-[480px] mx-auto px-6 py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <h1 className="font-heading text-[20px] font-bold text-text mb-2">Link Expired or Invalid</h1>
      <p className="text-[13.5px] text-grey-500 leading-relaxed mb-6">
        This response link has expired or has already been used. Please log in to your account to respond directly.
      </p>
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-blue text-white hover:bg-blue-light transition-all"
      >
        Sign In to Respond
      </Link>
    </div>
  )
}
