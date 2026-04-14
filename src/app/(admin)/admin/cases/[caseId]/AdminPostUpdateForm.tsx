'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WorkshopStageLabel, HoldAdminLabel, HoldReason } from '@/types/workshop'

// Human-readable labels for the case status options
const CASE_STATUS_LABELS: Record<string, string> = {
  SUBMITTED:        'Submitted',
  UNDER_REVIEW:     'Under Review',
  AWAITING_PAYMENT: 'Awaiting Payment',
  RMA_ISSUED:       'RMA Issued',
  PARTS_RECEIVED:   'Parts Received',
  IN_REPAIR:        'In Repair',
  QUALITY_CHECK:    'Quality Check',
  READY_TO_RETURN:  'Ready to Return',
  CLOSED:           'Closed',
  REJECTED:         'Rejected',
}

// Derive a human-readable label for the current effective state
function effectiveStatusLabel(
  status: string,
  workshopStage: string | null,
  isOnHold: boolean,
  holdReason: string | null,
): string {
  if (isOnHold && holdReason) {
    return `On Hold — ${HoldAdminLabel[holdReason as HoldReason] ?? holdReason}`
  }
  if (status === 'IN_REPAIR' && workshopStage) {
    return `In Repair — ${WorkshopStageLabel[workshopStage as keyof typeof WorkshopStageLabel] ?? workshopStage}`
  }
  return CASE_STATUS_LABELS[status] ?? status
}

interface Props {
  caseId: string
  productId?: string
  currentStatus: string
  workshopStage: string | null
  isOnHold: boolean
  holdReason: string | null
}

export default function AdminPostUpdateForm({
  caseId,
  productId,
  currentStatus,
  workshopStage,
  isOnHold,
  holdReason,
}: Props) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  // Default to no status change
  const [statusChange, setStatusChange] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (content.trim().length < 3) {
      setError('Update must be at least 3 characters.')
      return
    }
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/cases/${caseId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          isInternal,
          statusChangeTo: statusChange || null,
          productId: productId ?? null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message ?? 'Failed to post update')
      }
      setContent('')
      setStatusChange('')
      setIsInternal(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentLabel = effectiveStatusLabel(currentStatus, workshopStage, isOnHold, holdReason)

  return (
    <div className="px-[22px] py-5 space-y-3">
      {/* Current status context */}
      <div className="flex items-center gap-2 text-[11px]">
        <span className="text-grey-400 font-semibold uppercase tracking-[0.06em]">Current:</span>
        <span className={`font-semibold px-2 py-0.5 rounded-full ${
          isOnHold
            ? 'bg-amber-100 text-amber-700'
            : currentStatus === 'IN_REPAIR'
            ? 'bg-blue/10 text-blue'
            : 'bg-grey-100 text-grey-600'
        }`}>
          {currentLabel}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <select
          value={statusChange}
          onChange={(e) => setStatusChange(e.target.value)}
          className="text-[12px] border border-grey-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue bg-white text-grey-700"
        >
          <option value="">— No status change —</option>
          <optgroup label="Case Status">
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="AWAITING_PAYMENT">Awaiting Payment</option>
            <option value="RMA_ISSUED">RMA Issued</option>
            <option value="PARTS_RECEIVED">Parts Received</option>
            <option value="IN_REPAIR">In Repair</option>
            <option value="QUALITY_CHECK">Quality Check</option>
            <option value="READY_TO_RETURN">Ready to Return</option>
            <option value="CLOSED">Closed</option>
          </optgroup>
          <optgroup label="Workshop Stage">
            <option value="AWAITING_TEST">In Repair — Awaiting Test</option>
            <option value="RETEST">In Repair — Under Test</option>
            <option value="REWORK">In Repair — In Rework</option>
            <option value="FINAL_TEST">In Repair — Final Test</option>
            <option value="CLEAN_AND_LABEL">In Repair — Finishing</option>
            <option value="INSPECTION">In Repair — Inspection</option>
            <option value="WORKSHOP_COMPLETE">In Repair — Repair Complete</option>
          </optgroup>
          <optgroup label="Hold Status">
            <option value="AWAITING_PARTS">On Hold — Awaiting Parts</option>
            <option value="WITH_SUPPORT">On Hold — Under Investigation</option>
            <option value="WITH_ENGINEERING">On Hold — Engineering Review</option>
            <option value="AWAITING_CUSTOMER">On Hold — Awaiting Customer Response</option>
          </optgroup>
        </select>
        <label className="flex items-center gap-2 text-[12px] font-medium text-grey-600 cursor-pointer">
          <div
            onClick={() => setIsInternal((v) => !v)}
            className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${isInternal ? 'bg-amber-400' : 'bg-grey-200'}`}
          >
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${isInternal ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          Internal only
        </label>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder={isInternal ? 'Internal note (not visible to customer)…' : 'Update message (visible to customer)…'}
        className={`w-full px-3.5 py-[9px] border rounded-lg text-[13px] text-text bg-white outline-none transition-all resize-y ${
          isInternal
            ? 'border-amber-200 focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.1)] bg-amber-50/30'
            : 'border-grey-200 focus:border-blue focus:shadow-[0_0_0_3px_rgba(0,102,204,0.1)]'
        }`}
      />

      {error && <p className="text-[12px] text-red-600">{error}</p>}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-blue text-white hover:bg-blue-light transition-all disabled:opacity-60"
        >
          {isSubmitting ? 'Posting…' : 'Post Update'}
        </button>
      </div>
    </div>
  )
}
