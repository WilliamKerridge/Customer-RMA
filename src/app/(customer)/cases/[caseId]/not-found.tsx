import Link from 'next/link'

export default function CaseNotFound() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      <div className="bg-white rounded-xl border border-grey-200 shadow-sm p-10">
        <div className="flex justify-center mb-5">
          <div className="w-12 h-12 rounded-full bg-grey-100 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="11" y1="16" x2="11.01" y2="16" />
            </svg>
          </div>
        </div>
        <h2 className="font-heading text-lg font-bold text-text mb-2">Case not found</h2>
        <p className="text-[13px] text-grey-500 mb-6">
          This case does not exist or you do not have permission to view it.
        </p>
        <Link
          href="/cases"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-navy text-white hover:bg-navy-mid transition-colors"
        >
          My cases
        </Link>
      </div>
    </div>
  )
}
