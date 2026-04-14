'use client'

import { useState } from 'react'

interface Props {
  holdReason: string
  holdCustomerLabel: string
  awaitingCustomerQuestion: string | null
  caseId: string
  onResponseSent?: () => void
  token?: string  // for tokenised access (no login)
}

export default function HoldStateBanner({
  holdReason,
  holdCustomerLabel,
  awaitingCustomerQuestion,
  caseId,
  onResponseSent,
  token,
}: Props) {
  const [response, setResponse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isActionRequired = holdReason === 'AWAITING_CUSTOMER'

  async function handleSendResponse() {
    if (response.trim().length < 3) {
      setError('Please enter at least 3 characters.')
      return
    }
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/cases/${caseId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: response.trim(), token }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? 'Failed to send response')
      }
      setSuccess(true)
      onResponseSent?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isActionRequired) {
    return (
      <div className="rounded-xl border-[1.5px] border-orange-200 bg-orange-50 overflow-hidden mb-4">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-orange-200">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <div className="font-heading text-[14px] font-bold text-orange-900">
              Action Required — Your Response Needed
            </div>
            <div className="text-[12px] text-orange-700 mt-0.5">Repair is paused until you respond</div>
          </div>
        </div>

        <div className="px-5 py-4">
          {/* Staff question */}
          {awaitingCustomerQuestion && (
            <div className="bg-white border border-orange-200 rounded-lg px-4 py-3 mb-4">
              <div className="text-[11px] font-semibold text-orange-700 uppercase tracking-[0.06em] mb-1.5">
                Message from the workshop:
              </div>
              <p className="text-[13.5px] text-grey-700 italic leading-relaxed">
                &ldquo;{awaitingCustomerQuestion}&rdquo;
              </p>
            </div>
          )}

          {success ? (
            <div className="flex items-center gap-2.5 bg-green-50 border border-green-300 rounded-lg px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-[13px] text-green-800 font-medium">
                Response sent. Our team has been notified.
              </span>
            </div>
          ) : (
            <>
              <label className="block text-[13px] font-semibold text-grey-700 mb-2">
                Your response
              </label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-[9px] border-[1.5px] border-orange-200 rounded-lg text-[13.5px] text-text bg-white outline-none transition-all focus:border-orange-400 focus:shadow-[0_0_0_3px_rgba(194,65,12,0.1)] resize-y mb-3"
                placeholder="Type your response here…"
              />
              {error && (
                <p className="text-[12px] text-red-600 mb-3">{error}</p>
              )}
              <div className="flex gap-2.5">
                <a
                  href="mailto:returns@cosworth.com"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold bg-white text-text border border-grey-300 hover:bg-grey-50 transition-all"
                >
                  I&apos;ll call to discuss
                </a>
                <button
                  onClick={handleSendResponse}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    'Send Response'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Informational hold variant
  return (
    <div className="rounded-xl border-[1.5px] border-amber-200 bg-amber-50 overflow-hidden mb-4">
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div>
          <div className="font-heading text-[14px] font-bold text-amber-900">
            {holdCustomerLabel || 'On Hold'}
          </div>
          <div className="text-[12.5px] text-amber-800 mt-0.5">
            Our team is working on this. We will update you as soon as we have more information.
          </div>
        </div>
      </div>
    </div>
  )
}
