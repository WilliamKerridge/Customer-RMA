import type { CaseUpdateRow } from '@/types/database'

interface Props {
  updates: CaseUpdateRow[]
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function CaseTimeline({ updates }: Props) {
  if (updates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-grey-200 shadow-sm p-[22px]">
        <h2 className="font-heading text-sm font-semibold text-text mb-4">Case Updates</h2>
        <p className="text-[13px] text-grey-400">No updates yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
      <div className="px-[22px] py-[18px] border-b border-grey-100">
        <h2 className="font-heading text-sm font-semibold text-text">Case Updates</h2>
      </div>
      <div className="px-[22px] py-5">
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-grey-200" />

          <div className="space-y-5">
            {updates.map((update, i) => (
              <div key={update.id} className="flex gap-4">
                {/* Dot */}
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                      update.status_change_to
                        ? 'bg-blue'
                        : i === 0
                        ? 'bg-brand-accent'
                        : 'bg-grey-300'
                    }`}
                  >
                    {update.status_change_to ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" className="w-2.5 h-2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    {update.status_change_to && (
                      <span className="text-[11px] font-semibold text-blue bg-blue/8 px-2 py-0.5 rounded-full">
                        Status update
                      </span>
                    )}
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
      </div>
    </div>
  )
}
