import { WORKSHOP_STAGES, WorkshopStageLabel } from '@/types/workshop'

const STAGES = WORKSHOP_STAGES.map((key) => ({ key, label: WorkshopStageLabel[key] }))

interface Props {
  workshopStage: string | null
  isOnHold: boolean
  estimatedCompletion: string | null
  daysOpen: number | null
}

export default function WorkshopStageTracker({
  workshopStage,
  isOnHold,
  estimatedCompletion,
  daysOpen,
}: Props) {
  const currentIndex = STAGES.findIndex((s) => s.key === workshopStage)

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  return (
    <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden mb-4">
      <div className="px-[22px] py-[18px] border-b border-grey-100">
        <h2 className="font-heading text-sm font-semibold text-text">Workshop Progress</h2>
      </div>
      <div className="px-[22px] py-5">
        {/* Stage nodes */}
        <div className="flex items-start">
          {STAGES.map((stage, i) => {
            const isDone = currentIndex !== -1 && i < currentIndex
            const isActive = i === currentIndex
            const isPending = currentIndex === -1 || i > currentIndex
            const isLast = i === STAGES.length - 1

            let dotClass = ''
            if (isDone) dotClass = 'bg-green-500 text-white'
            else if (isActive && isOnHold) dotClass = 'bg-amber-400 text-white'
            else if (isActive) dotClass = 'bg-blue text-white shadow-[0_0_0_4px_rgba(0,102,204,0.2)] animate-pulse'
            else dotClass = 'bg-grey-100 border-2 border-grey-200 text-grey-300'

            let labelClass = ''
            if (isDone) labelClass = 'text-green-600'
            else if (isActive && isOnHold) labelClass = 'text-amber-700'
            else if (isActive) labelClass = 'text-blue'
            else labelClass = 'text-grey-400'

            let connectorClass = ''
            if (isDone) connectorClass = 'bg-green-400'
            else if (isActive) connectorClass = 'bg-gradient-to-r from-blue to-grey-200'
            else connectorClass = 'bg-grey-200'

            return (
              <div key={stage.key} className="flex flex-col items-center flex-1 relative">
                {/* Connector to next */}
                {!isLast && (
                  <div
                    className={`absolute top-3.5 h-0.5 z-0 ${connectorClass}`}
                    style={{ left: '50%', right: '-50%' }}
                  />
                )}

                {/* Dot */}
                <div
                  className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${dotClass}`}
                >
                  {isDone ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="w-3 h-3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : isActive && isOnHold ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  ) : null}
                </div>

                {/* Label */}
                <span
                  className={`mt-2 text-[10px] font-semibold text-center leading-tight max-w-[64px] ${labelClass}`}
                >
                  {stage.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* SAP info bar */}
        {(estimatedCompletion || daysOpen !== null) && (
          <div className="mt-4 pt-3 border-t border-grey-100 flex gap-4 text-[12px] text-grey-500">
            {estimatedCompletion && (
              <span>
                <span className="font-semibold text-grey-700">Est. completion:</span>{' '}
                {formatDate(estimatedCompletion)}
              </span>
            )}
            {daysOpen !== null && (
              <span>
                <span className="font-semibold text-grey-700">Days open:</span> {daysOpen}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
