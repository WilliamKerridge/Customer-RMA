'use client'

import { useState } from 'react'
import ImportClient from './ImportClient'
import AccountsImportClient from './AccountsImportClient'

interface Log {
  id: string
  filename: string
  uploaded_at: string
  total_rows: number
  matched_rows: number
  updated_rows: number
}

interface Props {
  logs: Log[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const WORKSHOP_COLUMNS = [
  ['Description',          'RMA number (match key)'],
  ['Product Status',       'Workshop stage / hold reason'],
  ['Sales Order',          'SAP Sales Order'],
  ['Service Order',        'SAP Works Order'],
  ['Estimated Completion', 'Est. completion date'],
  ['Value',                'SAP order value (staff only)'],
  ['Spent Hours',          'SAP spent hours (staff only)'],
]

const ACCOUNTS_COLUMNS = [
  ['Email',          'Email address (match key)'],
  ['Full Name',      'Contact name'],
  ['Company',        'Company / users.company'],
  ['Company Name',   'Account company name (falls back to Company)'],
  ['Phone',          'Phone number'],
  ['Credit Terms',   'Yes / No'],
  ['PO Required',    'Yes / No'],
  ['Account Active', 'Yes / No (defaults to Yes)'],
  ['Notes',          'Internal account notes'],
]

export default function ImportPageTabs({ logs }: Props) {
  const [tab, setTab] = useState<'workshop' | 'accounts'>('workshop')

  const workshopLogs = logs.filter(l => !l.filename.startsWith('[accounts]'))
  const accountsLogs = logs.filter(l => l.filename.startsWith('[accounts]'))
  const visibleLogs  = tab === 'workshop' ? workshopLogs : accountsLogs

  const columns = tab === 'workshop' ? WORKSHOP_COLUMNS : ACCOUNTS_COLUMNS

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 bg-grey-100 p-1 rounded-xl mb-6 w-fit">
        {(['workshop', 'accounts'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${
              tab === t
                ? 'bg-white text-text shadow-sm'
                : 'text-grey-500 hover:text-text'
            }`}
          >
            {t === 'workshop' ? 'Workshop Data' : 'Customer Accounts'}
          </button>
        ))}
      </div>

      {/* Column mapping reference */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 mb-6">
        <p className="text-[12px] font-semibold text-blue-800 mb-2 uppercase tracking-[0.06em]">
          Expected columns
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-[12px] text-blue-700">
          {columns.map(([col, desc]) => (
            <div key={col} className="flex gap-1.5">
              <span className="font-mono font-semibold text-blue-800 whitespace-nowrap">{col}</span>
              <span className="text-blue-600">→ {desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active import client */}
      {tab === 'workshop' ? <ImportClient /> : <AccountsImportClient />}

      {/* Import history for this tab */}
      {visibleLogs.length > 0 && (
        <div className="mt-10 bg-white rounded-xl border border-grey-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-grey-100">
            <h2 className="font-heading text-sm font-semibold text-text">Import History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-grey-50 border-b border-grey-200">
                  <th className="px-5 py-3 text-left font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">File</th>
                  <th className="px-5 py-3 text-left font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">Imported</th>
                  <th className="px-5 py-3 text-right font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">Rows</th>
                  <th className="px-5 py-3 text-right font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">
                    {tab === 'workshop' ? 'Matched' : 'Existing'}
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-grey-500 text-[11px] uppercase tracking-[0.06em]">
                    {tab === 'workshop' ? 'Updated' : 'Applied'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-100">
                {visibleLogs.map(log => (
                  <tr key={log.id} className="hover:bg-grey-50">
                    <td className="px-5 py-3 font-mono text-[12px] text-text max-w-[260px] truncate">
                      {log.filename.replace(/^\[accounts\] /, '')}
                    </td>
                    <td className="px-5 py-3 text-grey-600 whitespace-nowrap">
                      {formatDate(log.uploaded_at)}
                    </td>
                    <td className="px-5 py-3 text-right text-grey-600">{log.total_rows}</td>
                    <td className="px-5 py-3 text-right text-grey-600">{log.matched_rows}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-semibold text-emerald-600">{log.updated_rows}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
