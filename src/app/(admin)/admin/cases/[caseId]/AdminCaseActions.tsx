'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WorkshopStage, WorkshopStageLabel, HoldReason, HoldAdminLabel, HoldCustomerLabel, WORKSHOP_STAGES } from '@/types/workshop'

interface Props {
  caseId: string
  currentStage: string | null
  currentStatus: string
  isOnHold: boolean
  holdReason: string | null
  holdCustomerLabel: string | null
  // Per-product stage control — when set, stage updates go to the product route
  productId?: string
  productStage?: string | null
  productName?: string
  // Content rendered between Case Review and Workshop Stage cards (e.g. submission details)
  slotBetweenReviewAndStage?: React.ReactNode
}

export default function AdminCaseActions({
  caseId,
  currentStage,
  currentStatus,
  isOnHold,
  holdReason,
  holdCustomerLabel,
  productId,
  productStage,
  productName,
  slotBetweenReviewAndStage,
}: Props) {
  const router = useRouter()
  const [stageLoading, setStageLoading] = useState<string | null>(null)
  const [holdLoading, setHoldLoading] = useState(false)
  const [clearHoldLoading, setClearHoldLoading] = useState(false)
  const [approveLoading, setApproveLoading] = useState(false)
  const [rejectLoading, setRejectLoading] = useState(false)
  const [selectedHold, setSelectedHold] = useState<HoldReason | ''>('')
  const [holdQuestion, setHoldQuestion] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // When productId is provided use product stage, otherwise fall back to case stage
  const activeStage = productId ? productStage : currentStage
  const currentIndex = WORKSHOP_STAGES.indexOf(activeStage as WorkshopStage)

  async function advanceStage(stage: WorkshopStage) {
    setStageLoading(stage)
    setError(null)
    try {
      const url = productId
        ? `/api/cases/${caseId}/products/${productId}/stage`
        : `/api/cases/${caseId}/stage`
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? 'Failed to update stage')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setStageLoading(null)
    }
  }

  async function setHold() {
    if (!selectedHold) return
    setHoldLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cases/${caseId}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holdReason: selectedHold,
          customerLabel: HoldCustomerLabel[selectedHold as HoldReason],
          question: selectedHold === HoldReason.AWAITING_CUSTOMER ? holdQuestion : undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? 'Failed to set hold')
      }
      setSelectedHold('')
      setHoldQuestion('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setHoldLoading(false)
    }
  }

  async function clearHold() {
    setClearHoldLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cases/${caseId}/hold`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? 'Failed to clear hold')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setClearHoldLoading(false)
    }
  }

  async function approve() {
    setApproveLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cases/${caseId}/approve`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? 'Failed to approve case')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setApproveLoading(false)
    }
  }

  async function reject() {
    if (!rejectReason.trim()) return
    setRejectLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/cases/${caseId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? 'Failed to reject case')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setRejectLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Approval actions (SUBMITTED only) */}
      {currentStatus === 'SUBMITTED' && (
        <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-[22px] py-[18px] border-b border-grey-100">
            <h2 className="font-heading text-sm font-semibold text-text">Case Review</h2>
          </div>
          <div className="px-[22px] py-5">
            <p className="text-[13px] text-grey-600 mb-4">
              This case is pending review. Approve to issue an RMA number, or reject with a reason.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={approve}
                disabled={approveLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-green-600 text-white hover:bg-green-700 transition-all disabled:opacity-60"
              >
                {approveLoading ? 'Approving…' : 'Approve & Issue RMA'}
              </button>
              <button
                onClick={() => setShowRejectForm((s) => !s)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-white text-red-600 border border-red-200 hover:bg-red-50 transition-all"
              >
                Reject
              </button>
            </div>
            {showRejectForm && (
              <div className="mt-4 space-y-2">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Reason for rejection…"
                  className="w-full px-3.5 py-[9px] border border-grey-200 rounded-lg text-[13px] outline-none focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.1)] resize-y"
                />
                <button
                  onClick={reject}
                  disabled={rejectLoading || !rejectReason.trim()}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-60"
                >
                  {rejectLoading ? 'Rejecting…' : 'Confirm Rejection'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slot: rendered between Case Review and Workshop Stage */}
      {slotBetweenReviewAndStage}

      {/* Workshop Stage Control */}
      <div className="bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
        <div className="px-[22px] py-[18px] border-b border-grey-100 flex items-center justify-between gap-4">
          <h2 className="font-heading text-sm font-semibold text-text">
            Workshop Stage{productName ? ` — ${productName}` : ''}
          </h2>
          {/* Hold controls */}
          <div className="flex items-center gap-2">
            <select
              value={selectedHold}
              onChange={(e) => setSelectedHold(e.target.value as HoldReason | '')}
              className="text-[12px] border border-grey-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue bg-white text-grey-700"
            >
              <option value="">— Set Hold —</option>
              {Object.values(HoldReason).map((r) => (
                <option key={r} value={r}>{HoldAdminLabel[r]}</option>
              ))}
            </select>
            <button
              onClick={setHold}
              disabled={!selectedHold || holdLoading}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-all disabled:opacity-40"
            >
              {holdLoading ? 'Setting…' : 'Set Hold'}
            </button>
          </div>
        </div>

        <div className="px-[22px] py-5">
          {/* Stage buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {WORKSHOP_STAGES.map((stage, i) => {
              const isDone = currentIndex !== -1 && i < currentIndex
              const isActive = stage === activeStage

              return (
                <button
                  key={stage}
                  onClick={() => advanceStage(stage)}
                  disabled={stageLoading !== null}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                    isDone
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : isActive
                      ? 'bg-blue/8 text-blue border-blue shadow-[0_0_0_3px_rgba(0,102,204,0.15)]'
                      : 'bg-white text-grey-500 border-grey-200 hover:border-grey-300 hover:text-grey-700'
                  } ${stageLoading === stage ? 'opacity-60 cursor-wait' : ''}`}
                >
                  {isDone && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3 inline mr-1">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {WorkshopStageLabel[stage]}
                </button>
              )
            })}
          </div>

          {/* Hold question input (AWAITING_CUSTOMER) */}
          {selectedHold === HoldReason.AWAITING_CUSTOMER && (
            <div className="mt-3 space-y-2">
              <label className="block text-[12px] font-semibold text-grey-700">
                Message / question to send the customer:
              </label>
              <textarea
                value={holdQuestion}
                onChange={(e) => setHoldQuestion(e.target.value)}
                rows={3}
                placeholder="Describe what you need from the customer…"
                className="w-full px-3.5 py-[9px] border border-orange-200 rounded-lg text-[13px] outline-none focus:border-orange-400 focus:shadow-[0_0_0_3px_rgba(194,65,12,0.1)] resize-y"
              />
            </div>
          )}

          {/* Active hold alert */}
          {isOnHold && holdReason && (
            <div className="mt-4 flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <div>
                <span className="text-[12px] font-semibold text-amber-800">Hold active: </span>
                <span className="text-[12px] text-amber-700">{HoldAdminLabel[holdReason as HoldReason] ?? holdReason}</span>
              </div>
              <button
                onClick={clearHold}
                disabled={clearHoldLoading}
                className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-white text-amber-700 border border-amber-300 hover:bg-amber-100 transition-all disabled:opacity-60 flex-shrink-0"
              >
                {clearHoldLoading ? 'Clearing…' : 'Clear Hold'}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{error}</p>
      )}
    </div>
  )
}
