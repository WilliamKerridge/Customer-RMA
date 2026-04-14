import Link from 'next/link'

interface Props {
  searchParams: Promise<{ caseId?: string; caseNumber?: string }>
}

export default async function SuccessPage({ searchParams }: Props) {
  const { caseId, caseNumber } = await searchParams
  const isStub = process.env.PAYMENT_MODE !== 'stripe'

  return (
    <>
      {/* Hero */}
      <div className="bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8 relative overflow-hidden">
        <div
          className="absolute -top-15 -right-15 w-75 h-75 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,180,216,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px opacity-40"
          style={{ background: 'linear-gradient(90deg, transparent, #00b4d8, transparent)' }}
        />
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center gap-2 text-[12px] text-white/50 mb-2.5 font-mono">
            Home
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-brand-accent">Return Submitted</span>
          </div>
          <h1 className="font-heading text-[26px] font-bold text-white leading-tight">
            Return Submitted Successfully
          </h1>
          <p className="mt-1.5 text-[13px] text-white/60">
            Your case has been created and our team will review it within 24 hours.
          </p>
        </div>
      </div>

      {/* Success card */}
      <div className="max-w-[640px] mx-auto w-full px-8 py-7">
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm p-10 text-center">
          {/* Green tick */}
          <div className="w-20 h-20 rounded-full bg-green-100 border-[3px] border-green-300 flex items-center justify-center mx-auto mb-6">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2 className="font-heading text-[22px] font-bold text-text mb-2">Return Request Received</h2>
          <p className="text-[14px] text-grey-500 mb-7">
            A confirmation has been sent to you by email.
          </p>

          {/* Case reference box */}
          {caseNumber && (
            <div className="bg-blue/5 border-2 border-blue/20 rounded-xl p-5 mb-7">
              <div className="text-[12px] font-semibold text-grey-400 uppercase tracking-[0.06em] mb-2">
                Your Case Reference
              </div>
              <div className="font-mono text-[24px] font-bold text-blue tracking-wide">
                {caseNumber}
              </div>
              <div className="text-[12px] text-grey-500 mt-2">
                Use this reference in all correspondence with Cosworth.
              </div>
            </div>
          )}

          {/* Payment stub notice */}
          {isStub && (
            <div className="bg-amber-50 border border-amber-200 rounded-[10px] px-4 py-3.5 mb-7 text-left">
              <div className="text-[13px] text-amber-800">
                <strong>Payment Required</strong> — A member of our team will contact you within 24 hours
                to arrange payment before your RMA is issued. Please quote your Case ID.
              </div>
            </div>
          )}

          {/* What happens next */}
          <div className="bg-grey-50 border border-grey-200 rounded-[10px] p-4 text-left mb-7">
            <div className="text-[12px] font-semibold text-grey-600 mb-3">What happens next:</div>
            <div className="space-y-2.5">
              {[
                'Our team will review your case within 24 hours',
                "You'll receive an email with your RMA number and shipping instructions",
                'Ship your unit quoting the RMA number on the outer packaging',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <span className="text-[13px] text-grey-600">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-center">
            {caseId && (
              <Link
                href={`/cases/${caseId}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-semibold bg-blue text-white hover:bg-blue-light transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,102,204,0.3)]"
              >
                Track This Case
              </Link>
            )}
            <Link
              href="/submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-semibold bg-white text-text border border-grey-300 hover:bg-grey-50 transition-all"
            >
              Submit Another Return
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
