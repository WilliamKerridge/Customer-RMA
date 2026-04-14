'use client'

import Link from 'next/link'
import type { CaseRow } from '@/types/database'

const STATUS_ORDER = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'RMA_ISSUED',
  'PARTS_RECEIVED',
  'IN_REPAIR',
  'QUALITY_CHECK',
  'READY_TO_RETURN',
  'CLOSED',
]

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  AWAITING_PAYMENT: 'Awaiting Payment',
  RMA_ISSUED: 'RMA Issued',
  PARTS_RECEIVED: 'Parts Received',
  IN_REPAIR: 'In Repair',
  QUALITY_CHECK: 'Quality Check',
  READY_TO_RETURN: 'Ready to Return',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
}

const FAULT_TYPE_LABELS: Record<string, string> = {
  repair: 'Repair',
  service: 'End of Season Service',
  service_plan: 'Service Plan',
  loan_return: 'Loan Unit Return',
  code_update: 'Code Update',
}

const WORKSHOP_STAGE_LABELS: Record<string, string> = {
  AWAITING_TEST: 'Awaiting Test',
  RETEST: 'Under Test',
  REWORK: 'In Rework',
  FINAL_TEST: 'Final Test',
  CLEAN_AND_LABEL: 'Finishing',
  INSPECTION: 'Inspection',
  WORKSHOP_COMPLETE: 'Repair Complete',
}

// 6-node progress bar nodes
const PROGRESS_NODES = [
  { label: 'Submitted',   statuses: ['SUBMITTED', 'UNDER_REVIEW', 'AWAITING_PAYMENT'] },
  { label: 'RMA Issued',  statuses: ['RMA_ISSUED'] },
  { label: 'Received',    statuses: ['PARTS_RECEIVED'] },
  { label: 'In Repair',   statuses: ['IN_REPAIR'] },
  { label: 'QC',          statuses: ['QUALITY_CHECK'] },
  { label: 'Returned',    statuses: ['READY_TO_RETURN', 'CLOSED'] },
]

function getNodeState(nodeIndex: number, status: string): 'done' | 'active' | 'pending' {
  // Find which node the current status belongs to
  let currentNode = -1
  for (let i = 0; i < PROGRESS_NODES.length; i++) {
    if (PROGRESS_NODES[i].statuses.includes(status)) {
      currentNode = i
      break
    }
  }
  if (currentNode === -1) return 'pending'
  if (nodeIndex < currentNode) return 'done'
  if (nodeIndex === currentNode) return 'active'
  return 'pending'
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props {
  case_: CaseRow & { product_name?: string | null }
}

export default function CaseSummaryCard({ case_ }: Props) {
  const isActionRequired =
    case_.is_on_hold && case_.hold_reason === 'AWAITING_CUSTOMER'
  const isOnHold = case_.is_on_hold && case_.hold_reason !== 'AWAITING_CUSTOMER'
  const workshopLabel =
    case_.status === 'IN_REPAIR' && case_.workshop_stage
      ? WORKSHOP_STAGE_LABELS[case_.workshop_stage] ?? case_.workshop_stage
      : null

  return (
    <Link
      href={`/cases/${case_.id}`}
      className={`block bg-white rounded-xl border shadow-sm hover:shadow-md transition-all group ${
        isActionRequired
          ? 'border-orange-300'
          : 'border-grey-200 hover:border-blue/30'
      }`}
    >
      {/* Action required banner */}
      {isActionRequired && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-orange-50 border-b border-orange-200 rounded-t-xl">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2.5" className="flex-shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span className="text-[12.5px] font-semibold text-orange-900">
            Action Required — Your response is needed to continue the repair
          </span>
          <span className="ml-auto text-[12px] font-semibold text-orange-700 underline underline-offset-2">
            Respond Now →
          </span>
        </div>
      )}

      <div className="p-4">
        {/* Top row: case ID + status badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="font-mono text-[12px] font-semibold text-blue bg-blue/8 px-2 py-0.5 rounded">
              {case_.case_number}
            </span>
            {case_.rma_number && (
              <span className="ml-2 font-mono text-[11px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                {case_.rma_number}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isActionRequired ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-800 border border-orange-300">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                Action Required
              </span>
            ) : isOnHold ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                {case_.hold_customer_label ?? 'On Hold'}
              </span>
            ) : (
              <StatusBadge status={case_.status} />
            )}
          </div>
        </div>

        {/* Product + fault type */}
        <div className="mb-3">
          <div className="text-[13px] font-medium text-text">
            {case_.product_name ?? 'Return submitted'}
          </div>
          <div className="text-[12px] text-grey-500 mt-0.5">
            {FAULT_TYPE_LABELS[case_.fault_type] ?? case_.fault_type}
            {case_.required_return_date
              ? ` · Required by ${formatDate(case_.required_return_date)}`
              : ''}
          </div>
        </div>

        {/* 6-node mini progress bar */}
        <div className="flex items-center mb-3">
          {PROGRESS_NODES.map((node, i) => {
            const state = getNodeState(i, case_.status)
            const isLast = i === PROGRESS_NODES.length - 1
            const label =
              state === 'active' && workshopLabel && node.label === 'In Repair'
                ? workshopLabel
                : node.label

            return (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      state === 'done'
                        ? 'bg-green-500'
                        : state === 'active'
                        ? 'bg-blue shadow-[0_0_0_3px_rgba(0,102,204,0.2)] animate-pulse'
                        : 'bg-grey-100 border-2 border-grey-200'
                    }`}
                  >
                    {state === 'done' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" className="w-2.5 h-2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`mt-1 text-[9px] font-semibold text-center leading-tight max-w-[48px] ${
                      state === 'done'
                        ? 'text-green-600'
                        : state === 'active'
                        ? 'text-blue'
                        : 'text-grey-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={`flex-1 h-0.5 mx-0.5 -mt-3 ${
                      state === 'done' ? 'bg-green-400' : 'bg-grey-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-grey-100">
          <span className="text-[11px] text-grey-400">
            Submitted {formatDate(case_.created_at)}
          </span>
          <span className="text-[12px] font-semibold text-blue group-hover:underline underline-offset-2">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  )
}

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status

  const cls: Record<string, string> = {
    SUBMITTED:       'bg-blue-50 text-blue-700',
    UNDER_REVIEW:    'bg-amber-50 text-amber-800',
    AWAITING_PAYMENT:'bg-amber-50 text-amber-800',
    RMA_ISSUED:      'bg-purple-50 text-purple-700',
    PARTS_RECEIVED:  'bg-orange-50 text-orange-700',
    IN_REPAIR:       'bg-orange-50 text-orange-800',
    QUALITY_CHECK:   'bg-orange-50 text-orange-800',
    READY_TO_RETURN: 'bg-green-50 text-green-700',
    CLOSED:          'bg-green-50 text-green-700',
    REJECTED:        'bg-red-50 text-red-800',
  }

  const dotCls: Record<string, string> = {
    SUBMITTED:       'bg-blue-400',
    UNDER_REVIEW:    'bg-amber-400',
    AWAITING_PAYMENT:'bg-amber-400',
    RMA_ISSUED:      'bg-purple-400',
    PARTS_RECEIVED:  'bg-orange-400',
    IN_REPAIR:       'bg-orange-500',
    QUALITY_CHECK:   'bg-orange-500',
    READY_TO_RETURN: 'bg-green-500',
    CLOSED:          'bg-green-500',
    REJECTED:        'bg-red-500',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cls[status] ?? 'bg-grey-100 text-grey-600'}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls[status] ?? 'bg-grey-400'}`} />
      {label}
    </span>
  )
}
