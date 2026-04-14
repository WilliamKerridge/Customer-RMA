'use client'

import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: Props) {
  useEffect(() => {
    console.error('Admin page error:', error)
  }, [error])

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      <div className="bg-white rounded-xl border border-grey-200 shadow-sm p-10">
        <div className="flex justify-center mb-5">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        </div>
        <h2 className="font-heading text-lg font-bold text-text mb-2">Something went wrong</h2>
        <p className="text-[13px] text-grey-500 mb-6 leading-relaxed">
          An unexpected error occurred while loading this page. Please try again, or contact support if the problem persists.
        </p>
        {error.digest && (
          <p className="text-[11px] font-mono text-grey-400 mb-6">Error ref: {error.digest}</p>
        )}
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-navy text-white hover:bg-navy-mid transition-colors"
          >
            Try again
          </button>
          <a
            href="/admin/dashboard"
            className="px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-grey-100 text-text hover:bg-grey-200 transition-colors"
          >
            Back to dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
