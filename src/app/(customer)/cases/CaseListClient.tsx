'use client'

import { useState } from 'react'
import CaseSummaryCard from '@/components/cases/CaseSummaryCard'
import type { CaseRow } from '@/types/database'

const OPEN_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'AWAITING_PAYMENT', 'RMA_ISSUED', 'PARTS_RECEIVED', 'IN_REPAIR', 'QUALITY_CHECK', 'READY_TO_RETURN']
const CLOSED_STATUSES = ['CLOSED', 'REJECTED']
const TABS = ['All', 'Open', 'On Hold', 'Closed'] as const
type Tab = (typeof TABS)[number]

type EnrichedCase = CaseRow & { product_name?: string | null }

interface Props {
  cases: EnrichedCase[]
}

export default function CaseListClient({ cases }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('All')

  const filtered = cases.filter((c) => {
    if (activeTab === 'Open')    return OPEN_STATUSES.includes(c.status) && !c.is_on_hold
    if (activeTab === 'On Hold') return c.is_on_hold
    if (activeTab === 'Closed')  return CLOSED_STATUSES.includes(c.status)
    return true
  })

  const tabCount = (tab: Tab) => {
    if (tab === 'All')     return cases.length
    if (tab === 'Open')    return cases.filter((c) => OPEN_STATUSES.includes(c.status) && !c.is_on_hold).length
    if (tab === 'On Hold') return cases.filter((c) => c.is_on_hold).length
    if (tab === 'Closed')  return cases.filter((c) => CLOSED_STATUSES.includes(c.status)).length
    return 0
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-2 mb-5">
        {TABS.map((tab) => {
          const count = tabCount(tab)
          const isActive = tab === activeTab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all ${
                isActive
                  ? 'bg-blue text-white'
                  : 'bg-white border border-grey-200 text-grey-600 hover:border-grey-300 hover:text-text'
              }`}
            >
              {tab}
              {count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0 rounded-full ${
                    isActive ? 'bg-white/25 text-white' : 'bg-grey-100 text-grey-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Case list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-grey-400">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-40">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p className="text-[13px]">No cases found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <CaseSummaryCard key={c.id} case_={c} />
          ))}
        </div>
      )}
    </div>
  )
}
